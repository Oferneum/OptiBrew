import { NextResponse } from 'next/server';
import { lookupEquipment }   from '@/lib/agents/equipment-lookup-agent';
import { getRequestClient }  from '@/lib/supabase';
import { aiLimiter, isRateLimited } from '@/lib/rate-limit';

export async function GET(req: Request) {
  // H2-fix: require authentication
  const db = getRequestClient(req);
  const { data: { user }, error: authError } = await db.auth.getUser();
  if (!user || authError) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // H3-fix: per-user rate limit (shared AI quota: 10 req / 10 min)
  if (await isRateLimited(aiLimiter, `ai:${user.id}`)) {
    return NextResponse.json(
      { error: 'Too many requests — please wait a few minutes before trying again.' },
      { status: 429 },
    );
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) return NextResponse.json({ error: 'Query too short' }, { status: 400 });

  const result = await lookupEquipment(q);
  if (!result) return NextResponse.json({ error: 'Lookup failed' }, { status: 500 });
  return NextResponse.json(result);
}
