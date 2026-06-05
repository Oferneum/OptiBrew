import { NextResponse } from 'next/server';
import { getRequestClient } from '@/lib/supabase';
import { analyzeShot } from '@/lib/recommendations';
import { getShotContext } from '@/lib/context-builder';
import { aiLimiter, isRateLimited } from '@/lib/rate-limit';
import type { Shot } from '@/lib/types';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
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

    const { data: shot, error: fetchErr } = await db
      .from('shots').select('*, beans(roaster, origin, bag_name)').eq('id', id).eq('user_id', user.id).single();
    if (!shot || fetchErr) return NextResponse.json({ error: 'Shot not found' }, { status: 404 });

    const { recentShots, trendSummary } = await getShotContext(shot.bean_id, shot.equipment_id);

    // Rebuild relative weather delta from stored conditions
    let weatherContext: string | undefined;
    if (shot.bean_id && shot.humidity != null && shot.ambient_temp != null) {
      const { data: rows } = await db
        .from('shots')
        .select('humidity, ambient_temp')
        .eq('bean_id', shot.bean_id)
        .gte('overall_score', 7)
        .not('humidity', 'is', null)
        .not('ambient_temp', 'is', null)
        .neq('id', id)
        .order('created_at', { ascending: false })
        .limit(1);
      const baseline = rows?.[0];
      if (baseline) {
        const dH = Math.round((shot.humidity as number) - (baseline.humidity as number));
        const dT = Math.round(((shot.ambient_temp as number) - (baseline.ambient_temp as number)) * 10) / 10;
        const parts: string[] = [];
        if (Math.abs(dH) > 15)
          parts.push(`humidity is ${Math.abs(dH)}% ${dH > 0 ? 'higher' : 'lower'} than their last good shot`);
        if (Math.abs(dT) > 7)
          parts.push(`temperature is ${Math.abs(dT)}°C ${dT > 0 ? 'warmer' : 'cooler'} than their last good shot`);
        if (parts.length)
          weatherContext = `Weather delta: ${parts.join('; ')}. Translate into extraction impact.`;
      }
    }

    const recommendation = await analyzeShot(shot as Shot, recentShots, trendSummary ?? '', weatherContext);
    await db.from('shots').update({ recommendation }).eq('id', id).eq('user_id', user.id);

    return NextResponse.json({ recommendation });
  } catch (err) {
    console.error('[POST /api/shots/[id]/reanalyze]', err);
    return NextResponse.json({ error: 'Reanalysis failed' }, { status: 500 });
  }
}
