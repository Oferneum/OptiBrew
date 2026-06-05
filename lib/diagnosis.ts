import type { Shot, GrindTarget, BrewParamTarget } from './types';

// ═══════════════════════════════════════════════════════════════════════════════
// Output
// ═══════════════════════════════════════════════════════════════════════════════

export type DiagnosisSeverity = 'catastrophic' | 'critical' | 'moderate' | 'minor' | 'excellent';

export interface DiagnosisResult {
  severity:   DiagnosisSeverity;
  problem:    string;
  rootCause:  string;
  fix:        string;
  escalated:  boolean;
  context?:   string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Inputs
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Structured history derived from recent shots for the same bean+equipment combo.
 * grindDelta is numeric (newest minus previous), enabling deterministic escalation.
 * Null when grind settings are non-numeric (e.g. "Fine", "2 clicks").
 */
export interface ShotHistory {
  shotCount:        number;
  grindDelta:       number | null;
  previousGrindDir: 'finer' | 'coarser' | null;
  timeDelta:        number | null;
  scoreTrajectory:  'up' | 'down' | 'flat' | null;
  persistentTags:   string[];
}

export interface Environment {
  ambientTemp?: number | null;
  humidity?:    number | null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Internal
// ═══════════════════════════════════════════════════════════════════════════════

interface TimeThresholds {
  catastrophic: number;
  alarmFast:    number;
  fast:         number;
  slow:         number;
}

const BASE: TimeThresholds = { catastrophic: 15, alarmFast: 20, fast: 25, slow: 32 };

const LIGHT_DOSE = 14;
const HEAVY_DOSE = 20;

const PRECISION_BASKET_RE = /ims|vst|pullman|pesado|weber|wafo/i;
const LIGHT_ROAST_ORIGIN_RE = /ethiopia|kenya|colombia|burundi|rwanda|yirgacheffe|washed/i;

// ═══════════════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════════════

/** Parse grind setting string to float. Returns null for non-numeric values. */
export function parseGrindNumeric(grind: string | null | undefined): number | null {
  if (!grind) return null;
  const n = parseFloat(grind.trim());
  return isNaN(n) ? null : n;
}

/** Build ShotHistory from raw shots list (newest-first, from context builder). */
export function parseShotHistory(shots: Shot[]): ShotHistory {
  const empty: ShotHistory = {
    shotCount: shots.length,
    grindDelta: null,
    previousGrindDir: null,
    timeDelta: null,
    scoreTrajectory: null,
    persistentTags: [],
  };

  if (shots.length < 2) return empty;

  const g0 = parseGrindNumeric(shots[0].grind_setting);
  const g1 = parseGrindNumeric(shots[1].grind_setting);
  const grindDelta = (g0 != null && g1 != null) ? g0 - g1 : null;
  const previousGrindDir: ShotHistory['previousGrindDir'] =
    grindDelta == null ? null : grindDelta < 0 ? 'finer' : grindDelta > 0 ? 'coarser' : null;

  const t0 = shots[0].extraction_time ?? null;
  const t1 = shots[1].extraction_time ?? null;
  const timeDelta = (t0 != null && t1 != null) ? t0 - t1 : null;

  const scores = shots.map(s => s.overall_score).filter((s): s is number => s != null);
  let scoreTrajectory: ShotHistory['scoreTrajectory'] = null;
  if (scores.length >= 2) {
    const priorAvg = scores.slice(1).reduce((a, b) => a + b, 0) / (scores.length - 1);
    const latest = scores[0];
    scoreTrajectory = latest > priorAvg + 0.5 ? 'up' : latest < priorAvg - 0.5 ? 'down' : 'flat';
  }

  const allTags = shots.flatMap(s => s.flavor_tags ?? []);
  const tagCounts = allTags.reduce<Record<string, number>>((acc, t) => {
    acc[t] = (acc[t] ?? 0) + 1;
    return acc;
  }, {});
  const persistentTags = Object.entries(tagCounts)
    .filter(([, count]) => count >= 2 && count > shots.length / 2)
    .map(([tag]) => tag);

  return { shotCount: shots.length, grindDelta, previousGrindDir, timeDelta, scoreTrajectory, persistentTags };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Layer 3 + 6: Threshold pipeline — basket first, env offset on top
// ═══════════════════════════════════════════════════════════════════════════════

function computeThresholds(basketName: string | null | undefined, env: Environment): TimeThresholds {
  // Layer 3: precision basket adjusts baseline (tighter tolerances → faster flow)
  const basketOffset = PRECISION_BASKET_RE.test(basketName ?? '') ? -3 : 0;

  // Layer 6: env offsets applied on top of Layer 3 baseline — never before
  let envOffset = 0;
  if ((env.humidity ?? 0) > 70) envOffset += 1;    // high humidity → puck swells → slower flow → relax thresholds up
  if ((env.ambientTemp ?? 0) > 28) envOffset -= 1; // hot ambient → faster extraction → tighten thresholds down

  const total = basketOffset + envOffset;
  return {
    catastrophic: BASE.catastrophic + total,
    alarmFast:    BASE.alarmFast    + total,
    fast:         BASE.fast         + total,
    slow:         BASE.slow         + total,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Fix-string helpers — personalise advice when targets are available
// ═══════════════════════════════════════════════════════════════════════════════

function grindFix(
  direction: 'finer' | 'coarser',
  genericMagnitude: string,
  currentGrind: string | null | undefined,
  target: GrindTarget | null | undefined,
): string {
  if (!target) return `Grind ${direction} — ${genericMagnitude}`;

  const current = parseGrindNumeric(currentGrind);
  const deltaStr = current != null ? `you're at ${current}, move to` : 'target:';
  const rangeNote = target.range[0] !== target.range[1]
    ? ` (range ${target.range[0]}–${target.range[1]} across ${target.sampleSize} shots)`
    : ` (${target.sampleSize} shot${target.sampleSize > 1 ? 's' : ''})`;
  const tierNote = target.tier === 'personal_origin' ? ' — estimated from similar beans' : '';

  return `${deltaStr} grind ${target.value}${rangeNote} based on ${target.context}${tierNote}`;
}

function brewTempFix(
  direction: 'raise' | 'lower',
  genericAdvice: string,
  currentTemp: number | null | undefined,
  target: BrewParamTarget | null | undefined,
): string {
  if (!target?.avgTemp) return genericAdvice;

  const fromStr = currentTemp != null ? ` from ${currentTemp}°C` : '';
  const communityNote = target.tier === 'community_bean' ? ' (community estimate — not your personal data)' : '';

  return `${direction === 'raise' ? 'Raise' : 'Lower'} brew temp to ${target.avgTemp}°C${fromStr} — based on ${target.context}${communityNote}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Layer 4: Modular cross-reference functions
// ═══════════════════════════════════════════════════════════════════════════════

function diagnoseSourFast(
  shot: Shot,
  history: ShotHistory,
  grindTarget?: GrindTarget | null,
  brewParamTarget?: BrewParamTarget | null,
): DiagnosisResult {
  const time = shot.extraction_time!;
  const temp = shot.brew_temp ?? null;
  const dose = shot.dose ?? null;

  // Went finer but shot is getting faster — check if personal target is coarser than current
  const currentGrind    = parseGrindNumeric(shot.grind_setting);
  const targetIsCoarser = grindTarget != null && currentGrind != null && grindTarget.value > currentGrind;
  const wentFinerGotFaster = history.previousGrindDir === 'finer' && history.timeDelta != null && history.timeDelta < -3;

  if (targetIsCoarser || (history.previousGrindDir === 'finer' && history.shotCount >= 2)) {
    // If target is coarser: user is going the wrong way, reverse toward best setting
    if (targetIsCoarser || wentFinerGotFaster) {
      return {
        severity:  'moderate',
        problem:   `Fast sour at ${time}s — getting worse after grinding finer`,
        rootCause: 'Finer grind is reducing puck resistance further, not increasing it — direction is wrong',
        fix:       grindTarget
          ? grindFix('coarser', '2–3 steps back toward your best setting', shot.grind_setting, grindTarget)
          : 'Reverse direction — go 2–3 steps coarser',
        escalated: true,
        context:   `Personal best on this bean is at a coarser setting than current ${currentGrind}.`,
      };
    }
    // No target data — generic puck prep escalation
    return {
      severity:  'moderate',
      problem:   `Still fast and sour at ${time}s after grinding finer`,
      rootCause: 'Grind adjustment is exhausted — puck prep or distribution failure is the remaining variable',
      fix:       'Stop adjusting grind; focus on WDT, even distribution, and consistent tamping pressure',
      escalated: true,
      context:   `Grind moved finer across ${history.shotCount} shots with no improvement.`,
    };
  }

  // Low brew temp is the more likely culprit than coarse grind when temp < 89°C
  if (temp != null && temp < 89) {
    return {
      severity:  'moderate',
      problem:   `Fast sour shot at ${time}s with low brew temp (${temp}°C)`,
      rootCause: 'Under-extraction is temperature-driven — water too cold to dissolve compounds at speed',
      fix:       brewTempFix('raise', 'Raise brew temp 2–3°C before adjusting grind', temp, brewParamTarget),
      escalated: false,
    };
  }

  // Light dose as alternative resistance variable
  if (dose != null && dose < LIGHT_DOSE) {
    return {
      severity:  'moderate',
      problem:   `Fast sour shot at ${time}s with light dose (${dose}g)`,
      rootCause: 'Low dose reduces puck resistance — shot runs fast regardless of grind',
      fix:       `Increase dose to 15–16g before adjusting grind — more puck mass adds resistance without risking over-correction`,
      escalated: false,
      context:   'Dose is a direct resistance variable; increasing it is more reversible than a grind jump.',
    };
  }

  return {
    severity:  'moderate',
    problem:   `Fast sour shot at ${time}s`,
    rootCause: 'Grind is too coarse — insufficient puck resistance',
    fix:       grindFix('finer', '2–3 steps', shot.grind_setting, grindTarget),
    escalated: false,
    context:   grindTarget?.tier === 'personal_origin' ? `Grind target based on similar origin beans — treat as a starting estimate.` : undefined,
  };
}

function diagnoseSourNormal(
  shot: Shot,
  history: ShotHistory,
  beanOrigin: string,
  brewParamTarget?: BrewParamTarget | null,
): DiagnosisResult {
  const temp = shot.brew_temp ?? null;
  const isLightRoast = LIGHT_ROAST_ORIGIN_RE.test(beanOrigin);

  if (temp != null && temp < 89) {
    return {
      severity:  'moderate',
      problem:   'Sour at normal extraction speed with low brew temp',
      rootCause: 'Under-extraction is temperature-driven at normal flow — not a grind issue',
      fix:       brewTempFix('raise', `Raise brew temp to ${isLightRoast ? '92–94' : '90–92'}°C`, temp, brewParamTarget),
      escalated: false,
    };
  }

  if (isLightRoast && (temp == null || temp < 92)) {
    return {
      severity:  'moderate',
      problem:   'Sour at normal speed — under-extracted for this origin',
      rootCause: 'Light/washed origins require higher brew temp to develop acidity into sweetness',
      fix:       brewTempFix('raise', 'Raise brew temp to 93–94°C', temp, brewParamTarget),
      escalated: false,
    };
  }

  if (history.persistentTags.includes('Sour') && history.shotCount >= 3) {
    return {
      severity:  'moderate',
      problem:   'Persistent sour extraction across multiple shots at normal speed',
      rootCause: 'Ongoing under-extraction not resolved by previous adjustments — puck prep is the remaining variable',
      fix:       'Focus on WDT and even distribution — persistent sour at normal speed with correct temp points to prep, not parameters',
      escalated: true,
    };
  }

  return {
    severity:  'moderate',
    problem:   'Sour at normal extraction speed',
    rootCause: 'Under-extraction despite acceptable flow — temperature or puck prep is the likely cause',
    fix:       brewTempFix('raise', 'Raise brew temp 1–2°C; if the problem persists, improve puck prep with WDT and even distribution', temp, brewParamTarget),
    escalated: false,
  };
}

function diagnoseBitterSlow(
  shot: Shot,
  history: ShotHistory,
  grindTarget?: GrindTarget | null,
  brewParamTarget?: BrewParamTarget | null,
): DiagnosisResult {
  const time = shot.extraction_time!;
  const temp = shot.brew_temp ?? null;
  const dose = shot.dose ?? null;

  // Grind already moved coarser but still bitter and slow → temperature is the remaining variable
  if (history.previousGrindDir === 'coarser' && history.shotCount >= 2) {
    return {
      severity:  'moderate',
      problem:   `Still slow and bitter at ${time}s after grinding coarser`,
      rootCause: 'Grind adjustment alone is not resolving this — brew temp is likely the remaining variable',
      fix:       brewTempFix('lower', temp != null ? `Lower brew temp by 2°C from ${temp}°C` : 'Lower brew temp by 1–2°C', temp, brewParamTarget),
      escalated: true,
    };
  }

  // High temp as primary cause when > 94°C
  if (temp != null && temp > 94) {
    return {
      severity:  'moderate',
      problem:   `Slow bitter shot at ${time}s with high brew temp (${temp}°C)`,
      rootCause: 'Over-extraction is temperature-driven — high heat increases extraction rate',
      fix:       brewTempFix('lower', 'Lower brew temp by 2°C before adjusting grind', temp, brewParamTarget),
      escalated: false,
    };
  }

  // Heavy dose as resistance variable before grind change
  if (dose != null && dose > HEAVY_DOSE) {
    return {
      severity:  'moderate',
      problem:   `Slow bitter shot at ${time}s with heavy dose (${dose}g)`,
      rootCause: 'High dose increases puck resistance — water over-extracts as it forces through the dense puck',
      fix:       `Reduce dose to 18–19g before going coarser — dose reduction lowers resistance and concentration simultaneously`,
      escalated: false,
      context:   'Reducing dose is more reversible than a grind change and avoids over-correcting flow.',
    };
  }

  return {
    severity:  'moderate',
    problem:   `Slow over-extracted shot at ${time}s`,
    rootCause: 'Grind is too fine — excessive puck resistance',
    fix:       grindFix('coarser', '2–3 steps', shot.grind_setting, grindTarget),
    escalated: false,
    context:   grindTarget?.tier === 'personal_origin' ? 'Grind target based on similar origin beans — treat as a starting estimate.' : undefined,
  };
}

function diagnoseBitterFastOrNormal(shot: Shot): DiagnosisResult {
  const ratio = (shot.dose && shot.yield) ? shot.yield / shot.dose : null;
  const dose  = shot.dose ?? null;

  // Tight ratio = too concentrated regardless of speed
  if (ratio != null && ratio < 1.5) {
    return {
      severity:  'moderate',
      problem:   `Bitter with tight ratio (1:${ratio.toFixed(2)})`,
      rootCause: 'Shot is too concentrated — high TDS produces bitterness without over-extraction',
      fix:       'Pull a longer yield to reach 1:2–1:2.5 ratio',
      escalated: false,
    };
  }

  if (dose != null && dose > HEAVY_DOSE) {
    return {
      severity:  'moderate',
      problem:   `Bitter at normal speed with heavy dose (${dose}g)`,
      rootCause: 'High dose produces over-concentrated espresso even at normal flow rate',
      fix:       'Reduce dose to 17–18g, or increase yield by 5g to balance concentration',
      escalated: false,
    };
  }

  return {
    severity:  'minor',
    problem:   'Bitter taste at normal extraction speed',
    rootCause: 'Likely slightly concentrated or marginally high brew temp',
    fix:       'Increase yield by 3–5g, or lower brew temp by 1°C',
    escalated: false,
  };
}

function diagnoseBothSourBitter(shot: Shot, history: ShotHistory): DiagnosisResult {
  const time = shot.extraction_time ?? null;
  const isPersistent =
    history.persistentTags.includes('Sour') && history.persistentTags.includes('Bitter');

  if (isPersistent) {
    return {
      severity:  'moderate',
      problem:   'Persistent sour and bitter notes across multiple shots',
      rootCause: 'Chronic channeling — water repeatedly finding paths of least resistance through the puck',
      fix:       'Focus entirely on puck prep: WDT to break clumps, even distribution, and a level tamp. Check basket for debris.',
      escalated: true,
      context:   'When both sour and bitter persist after puck prep improvements, water mineral content or bean age are the next suspects.',
    };
  }

  return {
    severity:  'moderate',
    problem:   `Sour and bitter together${time ? ` at ${time}s` : ''}`,
    rootCause: 'Channeling — over-extracted channels produce bitter while under-extracted channels produce sour simultaneously',
    fix:       'Improve puck prep before next shot: use WDT to break clumps, distribute evenly, and tamp level',
    escalated: false,
  };
}

function diagnoseDry(shot: Shot): DiagnosisResult {
  const time = shot.extraction_time ?? null;

  if (time != null && time > 32) {
    return {
      severity:  'moderate',
      problem:   'Dry, astringent shot with slow extraction',
      rootCause: 'Over-extracted — polyphenols and tannins leaching from coffee ground too fine',
      fix:       'Grind 3–4 steps coarser',
      escalated: false,
    };
  }

  return {
    severity:  'moderate',
    problem:   'Dry, astringent finish at normal extraction speed',
    rootCause: 'Too concentrated — high TDS produces astringency before over-extraction time signals appear',
    fix:       'Increase yield by 5–8g to dilute concentration',
    escalated: false,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main export
// ═══════════════════════════════════════════════════════════════════════════════

export function buildDiagnosis(
  shot: Shot,
  history: ShotHistory,
  env: Environment,
  basketName: string | null | undefined,
  beanOrigin?: string | null,
  grindTarget?: GrindTarget | null,
  brewParamTarget?: BrewParamTarget | null,
): DiagnosisResult {
  const score  = shot.overall_score ?? null;
  const tags   = new Set(shot.flavor_tags ?? []);
  const time   = shot.extraction_time ?? null;
  const notes  = (shot.notes ?? '').toLowerCase();
  const origin = beanOrigin ?? shot.beans?.origin ?? '';
  const isEspresso = shot.brew_method === 'Espresso' || shot.brew_method === 'MokaPot';

  const hasSour    = tags.has('Sour');
  const hasBitter  = tags.has('Bitter');
  const hasDry     = tags.has('Dry');
  const hasBalanced = tags.has('Balanced');
  const hasNegativeTag = hasSour || hasBitter || hasDry;
  const notesDescribeProblem = /sour|bitter|acid|astrin|dry|watery|flat|bland|channel/.test(notes);

  // ── Layer 0: Excellent / good paths ──────────────────────────────────────
  if (score != null && score >= 9 && !hasNegativeTag && !notesDescribeProblem) {
    return {
      severity:  'excellent',
      problem:   'Excellent shot',
      rootCause: 'Parameters are dialled in well for this bean and equipment combination',
      fix:       'Log these parameters as your reference for this bean',
      escalated: false,
    };
  }

  if (score != null && score === 8 && !hasNegativeTag && !notesDescribeProblem) {
    return {
      severity:  'minor',
      problem:   'Good shot — close but not fully dialled',
      rootCause: 'Parameters are near-optimal but sweetness and body can still be increased',
      fix:       'Try 1 step finer to increase sweetness and body',
      escalated: false,
    };
  }

  // ── Compute effective thresholds: Layer 3 basket first, Layer 6 env on top ─
  const t = computeThresholds(basketName, env);

  // ── Layer 1: Alarm states ─────────────────────────────────────────────────
  if (isEspresso && time != null) {
    // Requirement: total collapse threshold — overrides all grind recommendations
    if (time < t.catastrophic) {
      return {
        severity:  'catastrophic',
        problem:   `Catastrophic collapse — shot ran in ${time}s`,
        rootCause: 'Not a grind issue — puck integrity has failed: channeling, cracked puck, or near-empty basket',
        fix:       'Do not adjust grind; redistribute, check dose, and tamp level before pulling again',
        escalated: false,
        context:   'At under 15s no grind adjustment explains this flow rate. Puck prep is the only variable.',
      };
    }

    if (time < t.alarmFast) {
      const currentGrind      = parseGrindNumeric(shot.grind_setting);
      const targetIsCoarser   = grindTarget != null && currentGrind != null && grindTarget.value > currentGrind;
      const wentFinerGotFaster = history.previousGrindDir === 'finer' && history.timeDelta != null && history.timeDelta < -3;

      // Wrong-direction trap: user went finer but shot got faster — personal target confirms reversal
      if (targetIsCoarser || wentFinerGotFaster) {
        return {
          severity:  'critical',
          problem:   `Critical: shot ran ${time}s and is getting faster despite grinding finer`,
          rootCause: 'You have been moving in the wrong direction — finer grind is reducing puck resistance, not increasing it',
          fix:       grindTarget
            ? grindFix('coarser', '3–5 steps back toward your best setting', shot.grind_setting, grindTarget)
            : `Stop going finer — reverse 3–5 steps coarser`,
          escalated: true,
          context:   `Shot time dropped ${history.timeDelta != null ? Math.abs(history.timeDelta) + 's' : 'significantly'} after going finer. Your best shots on this bean were at a coarser setting.`,
        };
      }

      return {
        severity:  'critical',
        problem:   `Critical: shot ran ${time}s — alarm-level speed`,
        rootCause: 'Grind is drastically too coarse or dose is far too low for this basket',
        fix:       grindFix('finer', '5+ steps — also verify dose is appropriate for your basket size', shot.grind_setting, grindTarget),
        escalated: false,
      };
    }

    if (time > 45) {
      return {
        severity:  'critical',
        problem:   `Critical: shot ran ${time}s — severe restriction`,
        rootCause: 'Extreme over-restriction — grind far too fine, overdosed, or clogged basket',
        fix:       'Grind significantly coarser and check portafilter basket for debris',
        escalated: false,
      };
    }
  }

  // ── Non-espresso: simplified path (no espresso rules apply) ──────────────
  if (!isEspresso) {
    const method = shot.brew_method ?? 'this brew method';
    return {
      severity:  (score != null && score >= 7) ? 'minor' : 'moderate',
      problem:   hasNegativeTag
        ? `${[...tags].filter(tag => tag !== 'Balanced').join(' and ')} — ${method} extraction issue`
        : 'Shot quality could be improved',
      rootCause: hasSour ? 'Under-extraction for this brew method'
               : hasBitter ? 'Over-extraction for this brew method'
               : 'Parameters need adjustment',
      fix:       hasSour ? 'Use hotter water or a finer grind for this method'
               : hasBitter ? 'Use cooler water or a coarser grind for this method'
               : 'Review brew ratio and contact time for this method',
      escalated: false,
    };
  }

  // ── Layer 4: Multi-variable cross-reference ───────────────────────────────
  if (hasSour && hasBitter) return diagnoseBothSourBitter(shot, history);

  if (hasSour && time != null) {
    if (time < t.fast) return diagnoseSourFast(shot, history, grindTarget, brewParamTarget);
    return diagnoseSourNormal(shot, history, origin, brewParamTarget);
  }

  if (hasBitter && time != null) {
    if (time > t.slow) return diagnoseBitterSlow(shot, history, grindTarget, brewParamTarget);
    return diagnoseBitterFastOrNormal(shot);
  }

  if (hasDry) return diagnoseDry(shot);

  // Balanced tag with low score → flat / bland
  if (hasBalanced && score != null && score <= 5) {
    return {
      severity:  'moderate',
      problem:   'Shot tastes balanced but flat or underwhelming',
      rootCause: 'Likely stale beans or under-dosed — balance without complexity signals low extraction intensity',
      fix:       'Check roast date first; if beans are fresh, try increasing dose by 1g',
      escalated: false,
    };
  }

  // ── Layer 5: Trend-aware score decline ───────────────────────────────────
  if (history.scoreTrajectory === 'down' && history.shotCount >= 3) {
    return {
      severity:  'moderate',
      problem:   'Score trending downward across recent shots',
      rootCause: 'Recent adjustments are moving in the wrong direction',
      fix:       history.previousGrindDir === 'finer'
        ? 'Stop going finer — score is declining. Reverse 1–2 steps coarser'
        : history.previousGrindDir === 'coarser'
        ? 'Stop going coarser — score is declining. Reverse 1–2 steps finer'
        : 'Revert to your last known good parameters and adjust one variable at a time',
      escalated: true,
      context:   `Score declining over ${history.shotCount} shots.`,
    };
  }

  // Low score, no tags
  if (score != null && score <= 5) {
    return {
      severity:  'moderate',
      problem:   'Low-scoring shot with no flavor tags',
      rootCause: notesDescribeProblem ? 'Issue described in notes' : 'Parameters off but problem untagged',
      fix:       'Add flavor tags when logging — without them a precise diagnosis is not possible',
      escalated: false,
    };
  }

  return {
    severity:  'minor',
    problem:   'Shot quality below target',
    rootCause: 'Parameters need fine-tuning',
    fix:       'Tag flavor notes on your next shot for a precise diagnosis',
    escalated: false,
  };
}
