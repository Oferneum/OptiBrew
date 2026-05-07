export interface GrindPrediction {
  grindSetting: number;
  targetTime:   number;
  basedOn:      Array<{ grind: number; time: number }>;
}

/**
 * Linear interpolation to predict the grind setting that targets a given
 * extraction time, from the 2 most recent shots with numeric grind data.
 *
 * Formula: g_target = g1 + ((target - t1) / (t2 - t1)) * (g2 - g1)
 * Requires: different grind settings AND different extraction times.
 */
export function predictGrind(
  shots: Array<{
    grind_setting:  string | null | undefined;
    extraction_time: number | null | undefined;
  }>,
  targetTime = 28,
): GrindPrediction | null {
  const valid = shots
    .filter(s => s.grind_setting != null && s.extraction_time != null && s.extraction_time > 0)
    .map(s => ({ grind: parseFloat(s.grind_setting!), time: s.extraction_time! }))
    .filter(s => !isNaN(s.grind) && s.grind > 0)
    .slice(0, 2); // take the 2 most recent (caller must sort desc)

  if (valid.length < 2) return null;

  const [p1, p2] = valid;

  // Prevent division by zero and degenerate cases
  if (p1.time === p2.time || p1.grind === p2.grind) return null;

  const gTarget = p1.grind + ((targetTime - p1.time) / (p2.time - p1.time)) * (p2.grind - p1.grind);

  // Sanity: reject wild extrapolations beyond 1× the data range
  const lo   = Math.min(p1.grind, p2.grind);
  const hi   = Math.max(p1.grind, p2.grind);
  const span = hi - lo || 1;
  if (gTarget <= 0 || gTarget < lo - span || gTarget > hi + span) return null;

  return {
    grindSetting: Math.round(gTarget * 10) / 10,
    targetTime,
    basedOn: [p1, p2],
  };
}
