import { scanBagImage }            from './vision-agent';
import { getStartupRecommendation } from './brew-recommendation-agent';
import { analyzeShot }              from './diagnostics-agent';
import { getBestBrewMethod }        from './community-analytics-agent';
import type { BagScanResult, Shot } from '../types';

export interface BagScanOutput {
  scan:           BagScanResult;
  recommendation: string;
}

/**
 * Scan flow: VisionAgent extracts bean details from photo,
 * then BrewRecommendationAgent generates first-shot parameters.
 */
export async function orchestrateBagScan(
  imageBase64: string,
  mimeType:    string,
): Promise<BagScanOutput> {
  const scan           = await scanBagImage(imageBase64, mimeType);
  const recommendation = await getStartupRecommendation(scan);
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
