import { NextResponse } from 'next/server';
import { orchestrateBagScan } from '@/lib/agents/orchestrator';
import { getRequestClient }   from '@/lib/supabase';
import { scanLimiter, isRateLimited } from '@/lib/rate-limit';
import type { ImageInput }    from '@/lib/agents/vision-agent';
import type { UserContext }   from '@/lib/types';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME  = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function POST(req: Request) {
  // H1-fix: require authentication before touching the AI
  const db = getRequestClient(req);
  const { data: { user }, error: authError } = await db.auth.getUser();
  if (!user || authError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // H3-fix: per-user rate limit (5 scans / 10 min)
  if (await isRateLimited(scanLimiter, `scan:${user.id}`)) {
    return NextResponse.json(
      { error: 'Too many scans — please wait a few minutes before trying again.' },
      { status: 429 },
    );
  }

  const formData = await req.formData();
  const files    = formData.getAll('image') as File[];

  // H1-fix: file count, size, and MIME type validation
  if (files.length === 0) {
    return NextResponse.json({ error: 'No image provided' }, { status: 400 });
  }
  if (files.length > 2) {
    return NextResponse.json({ error: 'Maximum 2 images per scan' }, { status: 400 });
  }

  const activeEquipmentId = (formData.get('activeEquipmentId') as string) || null;

  const images: ImageInput[] = [];
  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Each image must be 5 MB or smaller' }, { status: 400 });
    }
    const mime = file.type;
    if (!ALLOWED_MIME.has(mime)) {
      return NextResponse.json(
        { error: 'Unsupported image format — please use JPEG, PNG, or WebP' },
        { status: 400 },
      );
    }
    images.push({
      data:     Buffer.from(await file.arrayBuffer()).toString('base64'),
      mimeType: mime,
    });
  }

  // Fetch user context for personalised recommendation (best-effort — never blocks the scan)
  let userContext: UserContext | undefined;
  try {
    // Fetch equipment from DB: prefer the active profile by ID, fall back to most recent
    let equipmentRow: { machine_name: string; grinder_name: string | null } | null = null;

    if (activeEquipmentId) {
      const { data } = await db
        .from('equipment_profiles')
        .select('machine_name, grinder_name')
        .eq('id', activeEquipmentId)
        .eq('user_id', user.id)
        .single();
      equipmentRow = data ?? null;
    }

    if (!equipmentRow) {
      const { data } = await db
        .from('equipment_profiles')
        .select('machine_name, grinder_name')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      equipmentRow = data ?? null;
    }

    const { data: beansData } = await db
      .from('beans')
      .select('roaster, origin, bag_name')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    userContext = {
      equipment:   equipmentRow ? [equipmentRow] : [],
      recentBeans: beansData ?? [],
    };
  } catch { /* context failure must not block the scan */ }

  try {
    const result = await orchestrateBagScan(images, userContext);
    return NextResponse.json(result);
  } catch (firstErr) {
    console.warn('[scan-bag] first attempt failed, retrying in 500ms…', firstErr);
    await new Promise((r) => setTimeout(r, 500));
    try {
      const result = await orchestrateBagScan(images, userContext);
      return NextResponse.json(result);
    } catch (err) {
      console.error('[scan-bag] retry also failed', err);
      return NextResponse.json({ error: 'Scan failed' }, { status: 500 });
    }
  }
}
