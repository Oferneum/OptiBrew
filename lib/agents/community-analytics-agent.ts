import { supabase } from '../supabase';
import type { BrewMethod, CommunityMethodResult } from '../types';

type ShotRow = { brew_method: string | null; overall_score: number | null };

export async function getBestBrewMethod(beanId: string): Promise<CommunityMethodResult | null> {
  const { data, error } = await supabase
    .from('shots')
    .select('brew_method, overall_score')
    .eq('bean_id', beanId)
    .not('brew_method', 'is', null)
    .not('overall_score', 'is', null);

  if (error || !data) return null;

  const grouped = new Map<string, number[]>();
  for (const row of data as ShotRow[]) {
    if (!row.brew_method || row.overall_score == null) continue;
    const arr = grouped.get(row.brew_method) ?? [];
    arr.push(row.overall_score);
    grouped.set(row.brew_method, arr);
  }

  let best: CommunityMethodResult | null = null;
  for (const [method, scores] of grouped) {
    if (scores.length < 2) continue;
    const avg = scores.reduce((s, v) => s + v, 0) / scores.length;
    if (!best || avg > best.avg_score) {
      best = {
        brew_method: method as BrewMethod,
        avg_score:   avg,
        shot_count:  scores.length,
      };
    }
  }
  return best;
}

/** Compute best brew method from an already-loaded shot list (avoids extra DB round-trip). */
export function computeBestBrewMethod(
  shots: { brew_method: string | null; overall_score: number | null }[],
): CommunityMethodResult | null {
  const grouped = new Map<string, number[]>();
  for (const s of shots) {
    if (!s.brew_method || s.overall_score == null) continue;
    const arr = grouped.get(s.brew_method) ?? [];
    arr.push(s.overall_score);
    grouped.set(s.brew_method, arr);
  }

  let best: CommunityMethodResult | null = null;
  for (const [method, scores] of grouped) {
    if (scores.length < 2) continue;
    const avg = scores.reduce((s, v) => s + v, 0) / scores.length;
    if (!best || avg > best.avg_score) {
      best = {
        brew_method: method as BrewMethod,
        avg_score:   avg,
        shot_count:  scores.length,
      };
    }
  }
  return best;
}
