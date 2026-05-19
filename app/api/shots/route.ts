import { NextResponse } from 'next/server';
import { getRequestClient } from '@/lib/supabase';
import { checkNewBadges, updateStreak } from '@/lib/achievements';

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

    // ── 1: Insert shot ───────────────────────────────────────────────────────
    // AI analysis is decoupled — the client streams it via /api/shots/[id]/analyze.
    const { data: shot, error: insertError } = await db
      .from('shots')
      .insert({
        user_id:          user.id,
        dose:             body.dose,
        yield:            body.yield,
        extraction_time:  body.extraction_time  ?? null,
        steep_time_hours: body.steep_time_hours ?? null,
        brew_temp:        body.brew_temp        ?? null,
        flavor_tags:      body.flavor_tags      ?? [],
        overall_score:    body.overall_score    ?? null,
        notes:            body.notes            ?? null,
        bean_id:          body.bean_id          ?? null,
        equipment_id:     body.equipment_id     ?? null,
        grind_setting:    body.grind_setting    ?? null,
        brew_method:      body.brew_method      ?? 'Espresso',
        has_milk:         body.has_milk         ?? false,
        ambient_temp:     body.ambient_temp     ?? null,
        humidity:         body.humidity         ?? null,
        recommendation:   null,
      })
      .select()
      .single();

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

    // ── 2: Gamification ───────────────────────────────────────────────────────
    const [newBadges, streakResult] = await Promise.all([
      checkNewBadges(user.id, db),
      updateStreak(user.id, db),
    ]);

    return NextResponse.json(
      { shot, newBadges, streakResult },
      { status: 201 },
    );
  } catch (err) {
    console.error('[POST /api/shots]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
