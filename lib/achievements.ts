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

  // Three parallel fetches cover all six badge conditions
  const [
    { data: shotRows },
    { data: beanShotRows },
    { data: originRows },
  ] = await Promise.all([
    db.from('shots')
      .select('bean_id, overall_score, dose, yield, created_at')
      .eq('user_id', userId),
    db.from('shots')
      .select('bean_id')
      .eq('user_id', userId)
      .not('bean_id', 'is', null),
    db.from('shots')
      .select('beans(origin)')
      .eq('user_id', userId)
      .not('bean_id', 'is', null),
  ]);

  type ShotRow = {
    bean_id:       string | null;
    overall_score: number | null;
    dose:          number | null;
    yield:         number | null;
    created_at:    string;
  };

  const shots = (shotRows ?? []) as ShotRow[];
  const earned: string[] = [];

  const check = (id: string, cond: boolean) => {
    if (!heldSet.has(id) && cond) earned.push(id);
  };

  // Globetrotter: 5 distinct origins
  const origins = new Set(
    (originRows ?? [])
      .map((s: { beans: { origin: string } | { origin: string }[] | null }) => {
        const b = s.beans;
        if (!b) return undefined;
        return Array.isArray(b) ? b[0]?.origin : b.origin;
      })
      .filter(Boolean),
  );
  check('globetrotter', origins.size >= 5);

  // The Scientist: 10 shots on the same bean
  const beanCounts: Record<string, number> = {};
  for (const s of (beanShotRows ?? []) as { bean_id: string }[]) {
    beanCounts[s.bean_id] = (beanCounts[s.bean_id] ?? 0) + 1;
  }
  check('scientist', Math.max(0, ...Object.values(beanCounts)) >= 10);

  // Golden Ratio: 1:2–1:2.25 with score ≥ 8
  check(
    'golden-ratio',
    shots.some((s) => {
      if (!s.dose || !s.yield || (s.overall_score ?? 0) < 8) return false;
      const r = s.yield / s.dose;
      return r >= 2.0 && r <= 2.25;
    }),
  );

  // The Dialer: 5+ shots in one UTC calendar day
  const dayCounts: Record<string, number> = {};
  for (const s of shots) {
    const day = s.created_at.slice(0, 10);
    dayCounts[day] = (dayCounts[day] ?? 0) + 1;
  }
  check('dialer', Math.max(0, ...Object.values(dayCounts)) >= 5);

  // Ristretto Rex: 0.85–1.15 ratio with score ≥ 7
  check(
    'ristretto-rex',
    shots.some((s) => {
      if (!s.dose || !s.yield || (s.overall_score ?? 0) < 7) return false;
      const r = s.yield / s.dose;
      return r >= 0.85 && r <= 1.15;
    }),
  );

  // The Perfectionist: any shot with overall_score 10
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
