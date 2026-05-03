import type { Shot, SuccessZone } from './types';

export const SCA_DEFAULTS: SuccessZone = {
  timeMin: 25,
  timeMax: 30,
  ratioMin: 1.8,
  ratioMax: 2.2,
  isCalibrated: false,
};

function mean(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stdDev(values: number[]): number {
  const m = mean(values);
  return Math.sqrt(values.reduce((sq, n) => sq + (n - m) ** 2, 0) / values.length);
}

export function computeSuccessZone(shots: Shot[]): SuccessZone {
  const balanced = shots.filter(
    (s) => s.flavor_tags.includes('Balanced') && (s.overall_score ?? 0) >= 7,
  );
  if (balanced.length < 3) return SCA_DEFAULTS;

  const times = balanced.map((s) => s.extraction_time);
  const ratios = balanced.map((s) => s.brew_ratio);

  return {
    timeMin: Math.max(15, mean(times) - stdDev(times)),
    timeMax: Math.min(45, mean(times) + stdDev(times)),
    ratioMin: Math.max(1.0, mean(ratios) - stdDev(ratios)),
    ratioMax: Math.min(3.0, mean(ratios) + stdDev(ratios)),
    isCalibrated: true,
  };
}

export function computeBrewRatio(dose: number, yieldG: number): number {
  if (!dose || !yieldG) return 0;
  return parseFloat((yieldG / dose).toFixed(2));
}

export function restDays(roastDateStr: string): number {
  const diff = Date.now() - new Date(roastDateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function computeCostPerShot(pricePaid: number, weightGrams: number, dose: number = 18): number {
  if (!pricePaid || !weightGrams || !dose) return 0;
  return parseFloat((pricePaid / (weightGrams / dose)).toFixed(2));
}

export function computeVFM(avgScore: number, pricePaid: number, weightGrams: number, dose: number = 18): number {
  const costPerShot = computeCostPerShot(pricePaid, weightGrams, dose);
  if (!costPerShot || !avgScore) return 0;
  return parseFloat((avgScore / costPerShot).toFixed(2));
}
