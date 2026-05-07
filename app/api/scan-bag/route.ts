import { NextResponse } from 'next/server';
import { orchestrateBagScan } from '@/lib/agents/orchestrator';
import { getRequestClient }   from '@/lib/supabase';
import type { ImageInput }    from '@/lib/agents/vision-agent';
import type { UserContext }   from '@/lib/types';

export async function POST(req: Request) {
  const formData     = await req.formData();
  const files        = formData.getAll('image') as File[];
  const weatherCtx   = (formData.get('weather') as string | null) ?? undefined;
  if (files.length === 0) return NextResponse.json({ error: 'No images provided' }, { status: 400 });

  const images: ImageInput[] = await Promise.all(
    files.map(async (file) => ({
      data:     Buffer.from(await file.arrayBuffer()).toString('base64'),
      mimeType: file.type || 'image/jpeg',
    })),
  );

  // Fetch user context for personalised recommendation (best-effort — never blocks the scan)
  let userContext: UserContext | undefined;
  try {
    const db = getRequestClient(req);
    const { data: { user } } = await db.auth.getUser();
    if (user) {
      const [equipRes, beansRes] = await Promise.all([
        db.from('equipment_profiles').select('machine_name, grinder_name'),
        db.from('beans')
          .select('roaster, origin, bag_name')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5),
      ]);
      userContext = {
        equipment:   equipRes.data  ?? [],
        recentBeans: beansRes.data  ?? [],
      };
    }
  } catch { /* context failure must not block the scan */ }

  try {
    const result = await orchestrateBagScan(images, userContext, weatherCtx);
    return NextResponse.json(result);
  } catch (firstErr) {
    console.warn('[scan-bag] first attempt failed, retrying in 500ms…', firstErr);
    await new Promise((r) => setTimeout(r, 500));
    try {
      const result = await orchestrateBagScan(images, userContext, weatherCtx);
      return NextResponse.json(result);
    } catch (err) {
      console.error('[scan-bag] retry also failed', err);
      return NextResponse.json({ error: 'Scan failed' }, { status: 500 });
    }
  }
}
