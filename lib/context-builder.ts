import { supabase as anonClient } from '@/lib/supabase';
import type { Shot } from '@/lib/types';

export interface ShotContext {
  recentShots: Shot[];
  trendSummary: string | null;
}

/**
 * Fetches the last 3–5 shots for a specific bean + equipment combination.
 * Pass userId to scope results to the requesting user's own shots only —
 * prevents cross-user context leakage. Falls back to community-wide when
 * userId is omitted (backward-compatible anon usage).
 */
export async function getShotContext(
  beanId: string | null | undefined,
  equipmentId: string | null | undefined,
  userId?: string | null,
): Promise<ShotContext> {
  if (!beanId && !equipmentId) {
    return { recentShots: [], trendSummary: null };
  }

  let query = anonClient
    .from('shots')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (beanId)      query = query.eq('bean_id', beanId);
  if (equipmentId) query = query.eq('equipment_id', equipmentId);
  if (userId)      query = query.eq('user_id', userId);

  const { data, error } = await query;

  if (error || !data?.length) {
    return { recentShots: [], trendSummary: null };
  }

  const shots = data as Shot[];
  const trendSummary = buildTrendSummary(shots);

  return { recentShots: shots, trendSummary };
}

/**
 * Produces a short human-readable description of what the user has been
 * adjusting across recent shots — grind direction, dose changes, score
 * trajectory. Returned as a plain string for inclusion in an AI prompt.
 */
function buildTrendSummary(shots: Shot[]): string | null {
  if (shots.length < 2) return null;

  const lines: string[] = [];

  // Grind direction
  const grinds = shots
    .map((s) => s.grind_setting)
    .filter((g): g is string => g != null && g.trim() !== '');

  if (grinds.length >= 2) {
    const numeric = grinds.map(Number).filter((n) => !isNaN(n));
    if (numeric.length >= 2) {
      const delta = numeric[0] - numeric[1]; // newest minus previous
      if (delta < 0) lines.push(`Grind moved finer over last ${numeric.length} shots (${numeric[1]} → ${numeric[0]}).`);
      if (delta > 0) lines.push(`Grind moved coarser over last ${numeric.length} shots (${numeric[1]} → ${numeric[0]}).`);
      if (delta === 0) lines.push(`Grind has been stable at ${numeric[0]} for last ${numeric.length} shots.`);
    }
  }

  // Extraction time direction
  const times = shots
    .map((s) => s.extraction_time)
    .filter((t): t is number => t != null);

  if (times.length >= 2) {
    const delta = times[0] - times[1];
    if (Math.abs(delta) >= 3) {
      lines.push(
        `Extraction time ${delta > 0 ? 'increased' : 'decreased'} by ${Math.abs(delta)}s (${times[1]}s → ${times[0]}s).`,
      );
    }
  }

  // Score trajectory
  const scores = shots
    .map((s) => s.overall_score)
    .filter((s): s is number => s != null);

  if (scores.length >= 2) {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const latest = scores[0];
    if (latest > avg + 0.5) lines.push(`Score trending up (latest ${latest}/10, avg ${avg.toFixed(1)}).`);
    if (latest < avg - 0.5) lines.push(`Score trending down (latest ${latest}/10, avg ${avg.toFixed(1)}).`);
    if (Math.abs(latest - avg) <= 0.5) lines.push(`Score stable around ${avg.toFixed(1)}/10.`);
  }

  // Recurring flavour issues
  const allTags = shots.flatMap((s) => s.flavor_tags ?? []);
  const tagCounts = allTags.reduce<Record<string, number>>((acc, t) => {
    acc[t] = (acc[t] ?? 0) + 1;
    return acc;
  }, {});
  const persistent = Object.entries(tagCounts)
    .filter(([, count]) => count >= 2 && count > shots.length / 2)
    .map(([tag]) => tag);
  if (persistent.length) {
    lines.push(`Recurring flavour${persistent.length > 1 ? 's' : ''}: ${persistent.join(', ')}.`);
  }

  return lines.length ? lines.join(' ') : null;
}
