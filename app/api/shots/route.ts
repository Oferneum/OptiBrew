import { NextResponse } from 'next/server';
import { getRequestClient } from '@/lib/supabase';
import { analyzeShot } from '@/lib/recommendations';
import { getShotContext } from '@/lib/context-builder';
import type { Shot } from '@/lib/types';

export async function GET(req: Request) {
  const db = getRequestClient(req);
  const { data, error } = await db
    .from('shots')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

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
    const recommendation = await analyzeShot(body as Shot, trendSummary ?? '');

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
