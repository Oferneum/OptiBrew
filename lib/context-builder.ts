import { supabase as anonClient } from '@/lib/supabase';
import type { Shot, GrindTarget, BrewParamTarget } from './types';
import { resolveEquipmentFeatures, getMachinesByFeature } from './knowledge-graph';

export interface ShotContext {
  recentShots:     Shot[];
  trendSummary:    string | null;
  grindTarget:     GrindTarget | null;
  brewParamTarget: BrewParamTarget | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseGrindNum(grind: string | null | undefined): number | null {
  if (!grind) return null;
  const n = parseFloat(grind.trim());
  return isNaN(n) ? null : n;
}

function computeGrindStats(
  shots: { grind_setting: string | null }[],
): { value: number; range: [number, number]; sampleSize: number } | null {
  const nums = shots
    .map(s => parseGrindNum(s.grind_setting))
    .filter((n): n is number => n !== null);
  if (!nums.length) return null;
  const sorted = [...nums].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  return { value: median, range: [sorted[0], sorted[sorted.length - 1]], sampleSize: nums.length };
}

function computeBrewStats(shots: {
  brew_temp:       number | null;
  dose:            number | null;
  yield:           number | null;
  extraction_time: number | null;
}[]): { avgTemp: number | null; avgRatio: number | null; avgExtractionTime: number | null; sampleSize: number } {
  const avg = (arr: number[]) =>
    arr.length ? Math.round((arr.reduce((a, b) => a + b) / arr.length) * 10) / 10 : null;

  return {
    avgTemp: avg(shots.map(s => s.brew_temp).filter((t): t is number => t !== null)),
    avgRatio: avg(
      shots
        .filter(s => s.dose && s.yield)
        .map(s => Math.round(((s.yield as number) / (s.dose as number)) * 100) / 100),
    ),
    avgExtractionTime: avg(shots.map(s => s.extraction_time).filter((t): t is number => t !== null)),
    sampleSize: shots.length,
  };
}

function extractOriginKeyword(origin: string | null | undefined): string | null {
  if (!origin) return null;
  const word = origin.trim().split(/[\s,\/]+/)[0];
  return word.length >= 3 ? word : null;
}

// ── Tier queries ──────────────────────────────────────────────────────────────

async function fetchSimilarEquipmentIds(machineName: string | null | undefined): Promise<string[]> {
  if (!machineName) return [];
  const { equipmentTypes } = await resolveEquipmentFeatures(machineName, '');
  if (!equipmentTypes.length) return [];

  const similarNames = [...new Set(equipmentTypes.flatMap(f => getMachinesByFeature(f)))];
  if (!similarNames.length) return [];

  const { data } = await anonClient
    .from('equipment_profiles')
    .select('id')
    .in('machine_name', similarNames);

  return data?.map((e: { id: string }) => e.id) ?? [];
}

// Grind Tier 1: personal best on this exact bean + equipment
async function fetchPersonalBestGrind(
  beanId: string,
  equipmentId: string,
  userId: string,
): Promise<GrindTarget | null> {
  const { data } = await anonClient
    .from('shots')
    .select('grind_setting, overall_score')
    .eq('bean_id', beanId)
    .eq('equipment_id', equipmentId)
    .eq('user_id', userId)
    .gte('overall_score', 8)
    .not('grind_setting', 'is', null)
    .order('overall_score', { ascending: false })
    .limit(10);

  if (!data?.length) return null;
  const stats = computeGrindStats(data);
  if (!stats) return null;

  return {
    ...stats,
    tier: 'personal_bean',
    context: `your best shots on this bean (${stats.sampleSize} shot${stats.sampleSize > 1 ? 's' : ''} scored 8+)`,
  };
}

// Grind Tier 2: personal best on same-origin beans, same grinder
// "Same origin" = first word of origin field (country/region) + same user + same equipment
async function fetchOriginBestGrind(
  originKeyword: string,
  equipmentId: string,
  userId: string,
  excludeBeanId: string,
): Promise<GrindTarget | null> {
  const { data: similarBeans } = await anonClient
    .from('beans')
    .select('id')
    .ilike('origin', `${originKeyword}%`)
    .eq('user_id', userId)
    .neq('id', excludeBeanId);

  if (!similarBeans?.length) return null;
  const beanIds = similarBeans.map((b: { id: string }) => b.id);

  const { data } = await anonClient
    .from('shots')
    .select('grind_setting, overall_score')
    .in('bean_id', beanIds)
    .eq('equipment_id', equipmentId)
    .eq('user_id', userId)
    .gte('overall_score', 8)
    .not('grind_setting', 'is', null)
    .order('overall_score', { ascending: false })
    .limit(10);

  if (!data?.length) return null;
  const stats = computeGrindStats(data);
  if (!stats) return null;

  return {
    ...stats,
    tier: 'personal_origin',
    context: `your best ${originKeyword} shots on this grinder (${stats.sampleSize} shot${stats.sampleSize > 1 ? 's' : ''}, different bean)`,
  };
}

// Brew Tier 1: personal best on this exact bean
async function fetchPersonalBestBrewParams(
  beanId: string,
  userId: string,
): Promise<BrewParamTarget | null> {
  const { data } = await anonClient
    .from('shots')
    .select('brew_temp, dose, yield, extraction_time')
    .eq('bean_id', beanId)
    .eq('user_id', userId)
    .gte('overall_score', 8)
    .not('brew_temp', 'is', null)
    .order('overall_score', { ascending: false })
    .limit(10);

  if (!data?.length) return null;
  const stats = computeBrewStats(data);
  if (!stats.avgTemp && !stats.avgRatio) return null;

  return {
    ...stats,
    tier: 'personal_bean',
    context: `your personal best on this bean (${stats.sampleSize} shot${stats.sampleSize > 1 ? 's' : ''} scored 8+)`,
  };
}

// Brew Tier 2: community best on this bean, filtered to similar machines (same thermal/pressure profile)
// Requires ≥3 samples to be statistically meaningful
async function fetchCommunityBestBrewParams(
  beanId: string,
  userId: string,
  similarEquipmentIds: string[],
): Promise<BrewParamTarget | null> {
  let query = anonClient
    .from('shots')
    .select('brew_temp, dose, yield, extraction_time')
    .eq('bean_id', beanId)
    .neq('user_id', userId)
    .gte('overall_score', 8)
    .not('brew_temp', 'is', null)
    .order('overall_score', { ascending: false })
    .limit(30);

  if (similarEquipmentIds.length > 0) {
    query = query.in('equipment_id', similarEquipmentIds);
  }

  const { data } = await query;
  if (!data || data.length < 3) return null;

  const stats = computeBrewStats(data);
  if (!stats.avgTemp && !stats.avgRatio) return null;

  const equipNote = similarEquipmentIds.length > 0 ? 'on similar machines' : '';
  return {
    ...stats,
    tier: 'community_bean',
    context: `community estimate from ${stats.sampleSize} shots scored 8+${equipNote ? ' ' + equipNote : ''} — not your personal data`,
  };
}

// ── Trend summary ─────────────────────────────────────────────────────────────

function buildTrendSummary(shots: Shot[]): string | null {
  if (shots.length < 2) return null;

  const lines: string[] = [];

  const grinds = shots
    .map(s => s.grind_setting)
    .filter((g): g is string => g != null && g.trim() !== '');

  if (grinds.length >= 2) {
    const numeric = grinds.map(Number).filter(n => !isNaN(n));
    if (numeric.length >= 2) {
      const delta = numeric[0] - numeric[1];
      if (delta < 0) lines.push(`Grind moved finer over last ${numeric.length} shots (${numeric[1]} → ${numeric[0]}).`);
      if (delta > 0) lines.push(`Grind moved coarser over last ${numeric.length} shots (${numeric[1]} → ${numeric[0]}).`);
      if (delta === 0) lines.push(`Grind stable at ${numeric[0]} for last ${numeric.length} shots.`);
    }
  }

  const times = shots.map(s => s.extraction_time).filter((t): t is number => t != null);
  if (times.length >= 2) {
    const delta = times[0] - times[1];
    if (Math.abs(delta) >= 3) {
      lines.push(`Extraction time ${delta > 0 ? 'increased' : 'decreased'} by ${Math.abs(delta)}s (${times[1]}s → ${times[0]}s).`);
    }
  }

  const scores = shots.map(s => s.overall_score).filter((s): s is number => s != null);
  if (scores.length >= 2) {
    const avg = scores.reduce((a, b) => a + b) / scores.length;
    const latest = scores[0];
    if (latest > avg + 0.5)          lines.push(`Score trending up (latest ${latest}/10, avg ${avg.toFixed(1)}).`);
    else if (latest < avg - 0.5)     lines.push(`Score trending down (latest ${latest}/10, avg ${avg.toFixed(1)}).`);
    else                              lines.push(`Score stable around ${avg.toFixed(1)}/10.`);
  }

  const allTags = shots.flatMap(s => s.flavor_tags ?? []);
  const tagCounts = allTags.reduce<Record<string, number>>((acc, t) => {
    acc[t] = (acc[t] ?? 0) + 1; return acc;
  }, {});
  const persistent = Object.entries(tagCounts)
    .filter(([, count]) => count >= 2 && count > shots.length / 2)
    .map(([tag]) => tag);
  if (persistent.length) lines.push(`Recurring flavour${persistent.length > 1 ? 's' : ''}: ${persistent.join(', ')}.`);

  return lines.length ? lines.join(' ') : null;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Fetch shot context for AI analysis.
 * Pass `tiered: true` to enable personalised grind/brew param targets (adds 5–8 extra queries).
 * Keep `tiered: false` (default) for lightweight calls such as the chat route.
 */
export async function getShotContext(
  beanId:      string | null | undefined,
  equipmentId: string | null | undefined,
  userId?:     string | null,
  options?:    { tiered?: boolean },
): Promise<ShotContext> {
  const empty: ShotContext = { recentShots: [], trendSummary: null, grindTarget: null, brewParamTarget: null };
  if (!beanId && !equipmentId) return empty;

  // ── Recent shots ─────────────────────────────────────────────────────────
  let query = anonClient
    .from('shots')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (beanId)      query = query.eq('bean_id', beanId);
  if (equipmentId) query = query.eq('equipment_id', equipmentId);
  if (userId)      query = query.eq('user_id', userId);

  const { data, error } = await query;
  const shots = (!error && data?.length) ? (data as Shot[]) : [];
  const trendSummary = shots.length >= 2 ? buildTrendSummary(shots) : null;

  if (!options?.tiered || !beanId || !equipmentId || !userId) {
    return { recentShots: shots, trendSummary, grindTarget: null, brewParamTarget: null };
  }

  // ── Step 1: fetch bean + equipment metadata in parallel ───────────────────
  const [beanResult, equipResult] = await Promise.all([
    anonClient.from('beans').select('origin, roaster').eq('id', beanId).single(),
    anonClient.from('equipment_profiles').select('machine_name').eq('id', equipmentId).single(),
  ]);

  const originKeyword = extractOriginKeyword(beanResult.data?.origin);
  const machineName   = equipResult.data?.machine_name ?? null;

  // ── Step 2: similar equipment IDs + Tier 1 queries in parallel ────────────
  const [similarEquipmentIds, grindTier1, brewTier1] = await Promise.all([
    fetchSimilarEquipmentIds(machineName),
    fetchPersonalBestGrind(beanId, equipmentId, userId),
    fetchPersonalBestBrewParams(beanId, userId),
  ]);

  // ── Step 3: Tier 2 queries — only run if Tier 1 missed ───────────────────
  const [grindTier2, brewTier2] = await Promise.all([
    (!grindTier1 && originKeyword)
      ? fetchOriginBestGrind(originKeyword, equipmentId, userId, beanId)
      : Promise.resolve(null),
    !brewTier1
      ? fetchCommunityBestBrewParams(beanId, userId, similarEquipmentIds)
      : Promise.resolve(null),
  ]);

  return {
    recentShots:     shots,
    trendSummary,
    grindTarget:     grindTier1 ?? grindTier2,
    brewParamTarget: brewTier1  ?? brewTier2,
  };
}
