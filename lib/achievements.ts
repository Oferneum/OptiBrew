import type { SupabaseClient } from '@supabase/supabase-js';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BadgeDef {
  id: string;
  name: string;
  description: string;
  flavor: string;
}

export interface StreakResult {
  current: number;
  longest: number;
  isNew3:  boolean;
  isNew7:  boolean;
  isNew30: boolean;
}

// ── Badge catalogue ───────────────────────────────────────────────────────────

export const BADGE_DEFS: BadgeDef[] = [
  {
    id:          'globetrotter',
    name:        'Globetrotter',
    description: 'Brewed beans from 5 different origins.',
    flavor:      'The world is your cup.',
  },
  {
    id:          'scientist',
    name:        'The Scientist',
    description: 'Logged 10 shots on the same bag of beans.',
    flavor:      'Data. Not guesses.',
  },
  {
    id:          'golden-ratio',
    name:        'Golden Ratio',
    description: 'Hit a 1:2–1:2.25 brew ratio with a score of 8 or higher.',
    flavor:      'Mathematics in the cup.',
  },
  {
    id:          'dialer',
    name:        'The Dialer',
    description: 'Logged 5 shots in a single day.',
    flavor:      'Obsession is the only method.',
  },
  {
    id:          'ristretto-rex',
    name:        'Ristretto Rex',
    description: 'Pulled a near-1:1 ratio shot and scored it 7 or higher.',
    flavor:      'Small. Powerful. Perfect.',
  },
  {
    id:          'perfectionist',
    name:        'The Perfectionist',
    description: 'Scored a perfect 10 on any shot.',
    flavor:      'The holy grail.',
  },
  {
    id:          'first-drip',
    name:        'First Drip',
    description: 'Logged your very first shot.',
    flavor:      'Every legend starts somewhere.',
  },
  {
    id:          'bean-counter',
    name:        'Bean Counter',
    description: 'Logged 50 shots total.',
    flavor:      'Fifty shots in, still obsessing. Good.',
  },
  {
    id:          'century-mark',
    name:        'Century Mark',
    description: 'Logged 100 shots total.',
    flavor:      'Triple digits. No going back.',
  },
  {
    id:          'dawn-patrol',
    name:        'Dawn Patrol',
    description: 'Logged a shot before 6 AM.',
    flavor:      'The grind never sleeps.',
  },
  {
    id:          'night-owl',
    name:        'Night Owl',
    description: 'Logged a shot after 9 PM.',
    flavor:      'Caffeine is a lifestyle.',
  },
  {
    id:          'method-actor',
    name:        'Method Actor',
    description: 'Brewed using 4 different methods.',
    flavor:      'One coffee. Infinite expressions.',
  },
  {
    id:          'roasters-dozen',
    name:        "Roaster's Dozen",
    description: 'Logged shots from 12 different roasters.',
    flavor:      'Every roaster tells a different story.',
  },
  {
    id:          'terroir-hunter',
    name:        'Terroir Hunter',
    description: 'Brewed beans from 10 different origins.',
    flavor:      'The soil is in the cup.',
  },
  {
    id:          'cold-front',
    name:        'Cold Front',
    description: 'Logged 5 cold brew steeps.',
    flavor:      'Patience is an extraction method.',
  },
];

// ── Badge checking ────────────────────────────────────────────────────────────

export async function checkNewBadges(
  userId: string,
  db: SupabaseClient,
): Promise<string[]> {
  // Badges the user already holds
  const { data: held } = await db
    .from('user_badges')
    .select('badge_id')
    .eq('user_id', userId);

  const heldSet = new Set(
    (held ?? []).map((b: { badge_id: string }) => b.badge_id),
  );

  // Two parallel fetches cover all badge conditions
  const [
    { data: shotRows },
    { data: joinRows },
  ] = await Promise.all([
    db.from('shots')
      .select('bean_id, overall_score, dose, yield, created_at, brew_method')
      .eq('user_id', userId),
    db.from('shots')
      .select('beans(origin, roaster)')
      .eq('user_id', userId)
      .not('bean_id', 'is', null),
  ]);

  type ShotRow = {
    bean_id:       string | null;
    overall_score: number | null;
    dose:          number | null;
    yield:         number | null;
    created_at:    string;
    brew_method:   string | null;
  };

  type BeanJoin = { origin: string; roaster: string | null };
  type BeanJoinRow = { beans: BeanJoin | BeanJoin[] | null };

  const shots = (shotRows ?? []) as ShotRow[];
  const beanJoinRows = (joinRows ?? []) as BeanJoinRow[];
  const earned: string[] = [];

  const check = (id: string, cond: boolean) => {
    if (!heldSet.has(id) && cond) earned.push(id);
  };

  // ── origin + roaster sets (from bean join) ──────────────────────────────────
  const origins = new Set<string>();
  const roasters = new Set<string>();
  for (const s of beanJoinRows) {
    const b = s.beans;
    if (!b) continue;
    const bean = Array.isArray(b) ? b[0] : b;
    if (!bean) continue;
    if (bean.origin) origins.add(bean.origin);
    if (bean.roaster) roasters.add(bean.roaster);
  }

  // ── brew method set ─────────────────────────────────────────────────────────
  const brewMethods = new Set<string>();
  for (const s of shots) {
    if (s.brew_method) brewMethods.add(s.brew_method);
  }

  // ── bean shot counts (for Scientist) ───────────────────────────────────────
  const beanCounts: Record<string, number> = {};
  for (const s of shots) {
    if (!s.bean_id) continue;
    beanCounts[s.bean_id] = (beanCounts[s.bean_id] ?? 0) + 1;
  }

  // ── day counts (for Dialer) ─────────────────────────────────────────────────
  const dayCounts: Record<string, number> = {};
  for (const s of shots) {
    const day = s.created_at.slice(0, 10);
    dayCounts[day] = (dayCounts[day] ?? 0) + 1;
  }

  // ── checks ──────────────────────────────────────────────────────────────────
  check('first-drip',    shots.length >= 1);
  check('bean-counter',  shots.length >= 50);
  check('century-mark',  shots.length >= 100);
  check('globetrotter',  origins.size >= 5);
  check('terroir-hunter', origins.size >= 10);
  check('roasters-dozen', roasters.size >= 12);
  check('method-actor',  brewMethods.size >= 4);
  check('scientist',     Math.max(0, ...Object.values(beanCounts)) >= 10);
  check('dialer',        Math.max(0, ...Object.values(dayCounts)) >= 5);

  check('dawn-patrol', shots.some((s) => new Date(s.created_at).getUTCHours() < 6));
  check('night-owl',   shots.some((s) => new Date(s.created_at).getUTCHours() >= 21));

  const coldBrewCount = shots.filter((s) => s.brew_method === 'ColdBrew').length;
  check('cold-front', coldBrewCount >= 5);

  check(
    'golden-ratio',
    shots.some((s) => {
      if (!s.dose || !s.yield || (s.overall_score ?? 0) < 8) return false;
      const r = s.yield / s.dose;
      return r >= 2.0 && r <= 2.25;
    }),
  );

  check(
    'ristretto-rex',
    shots.some((s) => {
      if (!s.dose || !s.yield || (s.overall_score ?? 0) < 7) return false;
      const r = s.yield / s.dose;
      return r >= 0.85 && r <= 1.15;
    }),
  );

  check('perfectionist', shots.some((s) => s.overall_score === 10));

  if (earned.length > 0) {
    await db
      .from('user_badges')
      .insert(earned.map((badge_id) => ({ user_id: userId, badge_id })));
  }

  return earned;
}

// ── Streak update ─────────────────────────────────────────────────────────────

export async function updateStreak(
  userId: string,
  db: SupabaseClient,
): Promise<StreakResult> {
  const today     = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);

  const { data: stats } = await db
    .from('user_stats')
    .select('current_streak, longest_streak, last_shot_date')
    .eq('user_id', userId)
    .maybeSingle() as { data: { current_streak: number; longest_streak: number; last_shot_date: string | null } | null };

  let current = stats?.current_streak ?? 0;
  let longest  = stats?.longest_streak ?? 0;
  const last   = stats?.last_shot_date ?? null;

  if (last === today) {
    // already logged today — streak unchanged
  } else if (last === yesterday) {
    current += 1;
  } else {
    current = 1;
  }

  if (current > longest) longest = current;

  await db.from('user_stats').upsert(
    {
      user_id:        userId,
      current_streak: current,
      longest_streak: longest,
      last_shot_date: today,
      updated_at:     new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );

  return {
    current,
    longest,
    isNew3:  current === 3,
    isNew7:  current === 7,
    isNew30: current === 30,
  };
}
