import type { Shot, Recommendation } from './types';

function trending(shots: Shot[], check: (s: Shot) => boolean): boolean {
  return shots.length >= 2 && shots.slice(0, 2).every(check);
}

export function analyzeShot(shot: Shot, recentShots: Shot[]): Recommendation {
  const { extraction_time, brew_ratio, flavor_tags, overall_score } = shot;

  const sour = flavor_tags.includes('Sour');
  const bitter = flavor_tags.includes('Bitter');
  const astringent = flavor_tags.includes('Dry') || (flavor_tags as string[]).includes('Astringent');
  const balanced = flavor_tags.includes('Balanced');

  const underExtracted = sour || extraction_time < 25 || brew_ratio < 1.8;
  const overExtracted =
    bitter || astringent || extraction_time > 30 || brew_ratio > 2.2;

  if (underExtracted) {
    const isTrend = trending(
      recentShots,
      (s) => s.flavor_tags.includes('Sour') || s.extraction_time < 25,
    );
    const adjustments = ['Grind 2 steps finer'];
    if (sour) adjustments.push('Raise brew temperature by 1°C');
    if (extraction_time < 20) adjustments.push('Check distribution — channeling is likely');

    return {
      type: 'under-extracted',
      title: isTrend ? '3 shots trending under-extracted' : 'Under-Extracted Shot',
      adjustments,
      isTrend,
    };
  }

  if (overExtracted) {
    const isTrend = trending(
      recentShots,
      (s) =>
        s.flavor_tags.includes('Bitter') ||
        s.flavor_tags.includes('Dry') ||
        (s.flavor_tags as string[]).includes('Astringent') ||
        s.extraction_time > 30,
    );
    const adjustments = ['Grind 1–2 steps coarser'];
    if (bitter) adjustments.push('Lower brew temperature by 1°C');
    if (astringent) adjustments.push('Review WDT / distribution technique');

    return {
      type: 'over-extracted',
      title: isTrend ? '3 shots trending over-extracted' : 'Over-Extracted Shot',
      adjustments,
      isTrend,
    };
  }

  if (balanced && (overall_score ?? 0) >= 7) {
    return {
      type: 'balanced',
      title: 'Dialled In!',
      adjustments: ['Lock in these parameters and enjoy.'],
      isTrend: false,
    };
  }

  return {
    type: 'neutral',
    title: 'Shot Logged',
    adjustments: ['Log more shots to refine recommendations.'],
    isTrend: false,
  };
}
