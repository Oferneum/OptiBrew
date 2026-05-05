import { scanBagImage, type ImageInput } from './vision-agent';
import { getStartupRecommendation }      from './brew-recommendation-agent';
import { analyzeShot }                   from './diagnostics-agent';
import { getBestBrewMethod }             from './community-analytics-agent';
import type { BagScanResult, Shot, UserContext } from '../types';

export interface BagScanOutput {
  scan:           BagScanResult;
  recommendation: string;
}

/**
 * Scan flow: VisionAgent extracts bean details from one or more bag photos,
 * then BrewRecommendationAgent generates personalised first-shot parameters.
 */
export async function orchestrateBagScan(
  images:      ImageInput[],
  userContext?: UserContext,
): Promise<BagScanOutput> {
  const scan           = await scanBagImage(images);
  const recommendation = await getStartupRecommendation(scan, userContext);
  return { scan, recommendation };
}

/**
 * Shot analysis flow: delegates to DiagnosticsAgent.
 */
export async function orchestrateShotAnalysis(
  shot:          Shot,
  trendSummary?: string,
): Promise<string> {
  return analyzeShot(shot, trendSummary);
}

export { getBestBrewMethod };
