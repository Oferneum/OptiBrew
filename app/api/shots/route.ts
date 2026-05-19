import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getRequestClient } from '@/lib/supabase';
import { checkNewBadges, updateStreak } from '@/lib/achievements';

const BREW_METHODS = ['Espresso', 'V60', 'MokaPot', 'FrenchPress', 'ColdBrew'] as const;
const FLAVOR_TAGS  = ['Sour', 'Bitter', 'Balanced', 'Dry'] as const;

const ShotInsertSchema = z.object({
  dose:             z.number().positive().max(50),
  yield:            z.number().positive().max(200),
  extraction_time:  z.number().int().min(0).max(600).optional().nullable(),
  steep_time_hours: z.number().min(0).max(72).optional().nullable(),
  brew_temp:        z.number().min(50).max(115).optional().nullable(),
  flavor_tags:      z.array(z.enum(FLAVOR_TAGS)).max(10).default([]),
  overall_score:    z.number().int().min(1).max(10).optional().nullable(),
  notes:            z.string().max(1000).optional().nullable(),
  bean_id:          z.string().uuid().optional().nullable(),
  equipment_id:     z.string().uuid().optional().nullable(),
  grind_setting:    z.string().max(100).optional().nullable(),
  brew_method:      z.enum(BREW_METHODS).default('Espresso'),
  has_milk:         z.boolean().default(false),
  ambient_temp:     z.number().min(-20).max(60).optional().nullable(),
  humidity:         z.number().min(0).max(100).optional().nullable(),
});

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
    const raw = await req.json();

    const parsed = ShotInsertSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const body = parsed.data;

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
        flavor_tags:      body.flavor_tags,
        overall_score:    body.overall_score    ?? null,
        notes:            body.notes            ?? null,
        bean_id:          body.bean_id          ?? null,
        equipment_id:     body.equipment_id     ?? null,
        grind_setting:    body.grind_setting    ?? null,
        brew_method:      body.brew_method,
        has_milk:         body.has_milk,
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
