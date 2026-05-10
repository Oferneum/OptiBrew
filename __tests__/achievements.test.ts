import { describe, it, expect } from 'vitest';
import {
  computeEarnedBadges,
  type ShotRow,
  type BeanJoinRow,
} from '@/lib/achievements';

function makeShot(overrides: Partial<ShotRow> = {}): ShotRow {
  return {
    bean_id:       null,
    overall_score: 7,
    dose:          18,
    yield:         36,
    created_at:    '2026-01-15T10:00:00.000Z',
    brew_method:   'Espresso',
    ...overrides,
  };
}

function makeBeanJoin(origin: string, roaster: string): BeanJoinRow {
  return { beans: { origin, roaster } };
}

describe('computeEarnedBadges', () => {
  describe('milestone badges', () => {
    it('awards first-drip on the very first logged shot', () => {
      expect(computeEarnedBadges([makeShot()], [], new Set())).toContain('first-drip');
    });

    it('awards bean-counter at exactly 50 shots (not century-mark yet)', () => {
      const shots = Array.from({ length: 50 }, () => makeShot());
      const earned = computeEarnedBadges(shots, [], new Set());
      expect(earned).toContain('bean-counter');
      expect(earned).not.toContain('century-mark');
    });

    it('does not award bean-counter with only 49 shots', () => {
      const shots = Array.from({ length: 49 }, () => makeShot());
      expect(computeEarnedBadges(shots, [], new Set())).not.toContain('bean-counter');
    });

    it('awards century-mark and bean-counter at 100 shots', () => {
      const shots = Array.from({ length: 100 }, () => makeShot());
      const earned = computeEarnedBadges(shots, [], new Set());
      expect(earned).toContain('century-mark');
      expect(earned).toContain('bean-counter');
    });
  });

  describe('idempotency', () => {
    it('does not re-award badges already in the held set', () => {
      const shots = Array.from({ length: 100 }, () => makeShot());
      const held = new Set(['first-drip', 'bean-counter', 'century-mark']);
      const earned = computeEarnedBadges(shots, [], held);
      expect(earned).not.toContain('first-drip');
      expect(earned).not.toContain('bean-counter');
      expect(earned).not.toContain('century-mark');
    });
  });

  describe('time-based badges', () => {
    it('awards dawn-patrol for a shot logged before 06:00 UTC', () => {
      const shots = [makeShot({ created_at: '2026-01-15T04:30:00.000Z' })];
      expect(computeEarnedBadges(shots, [], new Set())).toContain('dawn-patrol');
    });

    it('does not award dawn-patrol at exactly 06:00 UTC', () => {
      const shots = [makeShot({ created_at: '2026-01-15T06:00:00.000Z' })];
      expect(computeEarnedBadges(shots, [], new Set())).not.toContain('dawn-patrol');
    });

    it('awards night-owl for a shot logged at or after 21:00 UTC', () => {
      const shots = [makeShot({ created_at: '2026-01-15T21:00:00.000Z' })];
      expect(computeEarnedBadges(shots, [], new Set())).toContain('night-owl');
    });

    it('does not award night-owl before 21:00 UTC', () => {
      const shots = [makeShot({ created_at: '2026-01-15T20:59:00.000Z' })];
      expect(computeEarnedBadges(shots, [], new Set())).not.toContain('night-owl');
    });
  });

  describe('volume badges (dialer, scientist)', () => {
    it('awards dialer for 5 or more shots in the same UTC calendar day', () => {
      const shots = Array.from({ length: 5 }, () =>
        makeShot({ created_at: '2026-01-15T10:00:00.000Z' }));
      expect(computeEarnedBadges(shots, [], new Set())).toContain('dialer');
    });

    it('does not award dialer when shots are spread across different days', () => {
      const shots = Array.from({ length: 5 }, (_, i) =>
        makeShot({ created_at: `2026-01-${String(i + 1).padStart(2, '0')}T10:00:00.000Z` }));
      expect(computeEarnedBadges(shots, [], new Set())).not.toContain('dialer');
    });

    it('awards scientist for 10 shots on the same bean', () => {
      const shots = Array.from({ length: 10 }, () =>
        makeShot({ bean_id: 'test-bean-uuid' }));
      expect(computeEarnedBadges(shots, [], new Set())).toContain('scientist');
    });

    it('does not award scientist when shots are spread across different beans', () => {
      const shots = Array.from({ length: 10 }, (_, i) =>
        makeShot({ bean_id: `bean-${i}` }));
      expect(computeEarnedBadges(shots, [], new Set())).not.toContain('scientist');
    });
  });

  describe('ratio badges (golden-ratio, ristretto-rex, perfectionist)', () => {
    it('awards golden-ratio for a 1:2 ratio shot scored 8+', () => {
      // dose=18, yield=36 → ratio=2.0 (lower boundary), score=8
      const shots = [makeShot({ dose: 18, yield: 36, overall_score: 8 })];
      expect(computeEarnedBadges(shots, [], new Set())).toContain('golden-ratio');
    });

    it('does not award golden-ratio when score is below 8', () => {
      const shots = [makeShot({ dose: 18, yield: 36, overall_score: 7 })];
      expect(computeEarnedBadges(shots, [], new Set())).not.toContain('golden-ratio');
    });

    it('does not award golden-ratio outside the 1:2–1:2.25 ratio window', () => {
      // dose=18, yield=42 → ratio≈2.33, above the 2.25 ceiling
      const shots = [makeShot({ dose: 18, yield: 42, overall_score: 9 })];
      expect(computeEarnedBadges(shots, [], new Set())).not.toContain('golden-ratio');
    });

    it('awards ristretto-rex for a near-1:1 ratio shot scored 7+', () => {
      // dose=18, yield=18 → ratio=1.0, score=7
      const shots = [makeShot({ dose: 18, yield: 18, overall_score: 7 })];
      expect(computeEarnedBadges(shots, [], new Set())).toContain('ristretto-rex');
    });

    it('does not award ristretto-rex when score is below 7', () => {
      const shots = [makeShot({ dose: 18, yield: 18, overall_score: 6 })];
      expect(computeEarnedBadges(shots, [], new Set())).not.toContain('ristretto-rex');
    });

    it('awards perfectionist for a perfect score of 10', () => {
      const shots = [makeShot({ overall_score: 10 })];
      expect(computeEarnedBadges(shots, [], new Set())).toContain('perfectionist');
    });
  });

  describe('exploration badges (globetrotter, terroir-hunter, roasters-dozen)', () => {
    it('awards globetrotter for beans from 5 distinct origins', () => {
      const joins = ['Ethiopia', 'Colombia', 'Brazil', 'Guatemala', 'Kenya']
        .map((o) => makeBeanJoin(o, 'Any Roaster'));
      expect(computeEarnedBadges([makeShot()], joins, new Set())).toContain('globetrotter');
    });

    it('does not award globetrotter for 5 shots on the same origin', () => {
      const joins = Array.from({ length: 5 }, () => makeBeanJoin('Ethiopia', 'Any Roaster'));
      expect(computeEarnedBadges([makeShot()], joins, new Set())).not.toContain('globetrotter');
    });

    it('awards terroir-hunter for 10 distinct origins (and also globetrotter)', () => {
      const joins = [
        'Ethiopia', 'Colombia', 'Brazil', 'Guatemala', 'Kenya',
        'Rwanda', 'Honduras', 'El Salvador', 'Panama', 'Peru',
      ].map((o) => makeBeanJoin(o, 'Any Roaster'));
      const earned = computeEarnedBadges([makeShot()], joins, new Set());
      expect(earned).toContain('terroir-hunter');
      expect(earned).toContain('globetrotter');
    });

    it('awards roasters-dozen for 12 distinct roasters', () => {
      const joins = Array.from({ length: 12 }, (_, i) =>
        makeBeanJoin('Ethiopia', `Roaster ${i}`));
      expect(computeEarnedBadges([makeShot()], joins, new Set())).toContain('roasters-dozen');
    });

    it('does not award roasters-dozen for fewer than 12 roasters', () => {
      const joins = Array.from({ length: 11 }, (_, i) =>
        makeBeanJoin('Ethiopia', `Roaster ${i}`));
      expect(computeEarnedBadges([makeShot()], joins, new Set())).not.toContain('roasters-dozen');
    });
  });

  describe('brew method badges (method-actor, cold-front)', () => {
    it('awards method-actor for 4 or more distinct brew methods', () => {
      const shots = [
        makeShot({ brew_method: 'Espresso' }),
        makeShot({ brew_method: 'MokaPot' }),
        makeShot({ brew_method: 'FrenchPress' }),
        makeShot({ brew_method: 'ColdBrew' }),
      ];
      expect(computeEarnedBadges(shots, [], new Set())).toContain('method-actor');
    });

    it('does not award method-actor for only 3 distinct brew methods', () => {
      const shots = [
        makeShot({ brew_method: 'Espresso' }),
        makeShot({ brew_method: 'MokaPot' }),
        makeShot({ brew_method: 'FrenchPress' }),
      ];
      expect(computeEarnedBadges(shots, [], new Set())).not.toContain('method-actor');
    });

    it('awards cold-front for 5 or more cold brew steeps', () => {
      const shots = Array.from({ length: 5 }, () =>
        makeShot({ brew_method: 'ColdBrew' }));
      expect(computeEarnedBadges(shots, [], new Set())).toContain('cold-front');
    });

    it('does not award cold-front for fewer than 5 cold brew shots', () => {
      const shots = Array.from({ length: 4 }, () =>
        makeShot({ brew_method: 'ColdBrew' }));
      expect(computeEarnedBadges(shots, [], new Set())).not.toContain('cold-front');
    });
  });
});
