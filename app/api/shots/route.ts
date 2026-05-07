import { NextResponse } from 'next/server';
import { getRequestClient } from '@/lib/supabase';
import { analyzeShot } from '@/lib/recommendations';
import { getShotContext } from '@/lib/context-builder';
import type { Shot } from '@/lib/types';

export async function GET(req: Request) {
  const db = getRequestClient(req);
  const { data: { user } } = await db.auth.getUser();

  const baseQ = db
    .from('shots')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  const { data, error } = await (user ? baseQ.eq('user_id', user.id) : baseQ);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  try {
    const db = getRequestClient(req);
    const body = await req.json();

    const { data: { user }, error: authError } = await db.auth.getUser();
    if (!user || authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // getShotContext returns a ShotContext object — extract the string summary only
    const { trendSummary } = await getShotContext(body.bean_id, body.equipment_id);

    // Build relative weather context for AI by comparing to last good shot's recorded conditions
    let weatherContext: string | undefined;
    if (body.bean_id && body.humidity != null && body.ambient_temp != null) {
      const { data: baselineRows } = await db
        .from('shots')
        .select('humidity, ambient_temp')
        .eq('bean_id', body.bean_id)
        .gte('overall_score', 7)
        .not('humidity', 'is', null)
        .not('ambient_temp', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1);
      const baseline = baselineRows?.[0];
      if (baseline) {
        const dH = Math.round(body.humidity - (baseline.humidity as number));
        const dT = Math.round((body.ambient_temp - (baseline.ambient_temp as number)) * 10) / 10;
        const parts: string[] = [];
        if (Math.abs(dH) > 15)
          parts.push(`humidity is ${Math.abs(dH)}% ${dH > 0 ? 'higher' : 'lower'} than their last good shot on this bean (${baseline.humidity}% → ${body.humidity}%)`);
        if (Math.abs(dT) > 7)
          parts.push(`temperature is ${Math.abs(dT)}°C ${dT > 0 ? 'warmer' : 'cooler'} than their last good shot (${baseline.ambient_temp}°C → ${body.ambient_temp}°C)`);
        if (parts.length > 0)
          weatherContext = `Weather delta since last good shot: ${parts.join('; ')}. Translate this into extraction impact (moisture absorption, faster/slower flow, etc.) without quoting the numbers verbatim.`;
      }
    }

    const recommendation = await analyzeShot(body as Shot, trendSummary ?? '', weatherContext);

    const { data: shot, error } = await db
      .from('shots')
      .insert({
        user_id:         user.id,
        dose:            body.dose,
        yield:           body.yield,
        extraction_time: body.extraction_time,
        brew_temp:       body.brew_temp     ?? null,
        flavor_tags:     body.flavor_tags   ?? [],
        overall_score:   body.overall_score ?? null,
        notes:           body.notes         ?? null,
        bean_id:         body.bean_id       ?? null,
        equipment_id:    body.equipment_id  ?? null,
        grind_setting:   body.grind_setting ?? null,
        brew_method:     body.brew_method   ?? 'Espresso',
        has_milk:        body.has_milk      ?? false,
        ambient_temp:    body.ambient_temp  ?? null,
        humidity:        body.humidity      ?? null,
        recommendation,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Return recommendation separately so ShotForm can display it immediately
    return NextResponse.json({ shot, recommendation }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/shots]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
