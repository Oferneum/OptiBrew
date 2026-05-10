import { describe, it, expect } from 'vitest';
import { predictGrind } from '@/lib/grind-predictor';

describe('predictGrind', () => {
  const twoShots = [
    { grind_setting: '20', extraction_time: 25 },
    { grind_setting: '18', extraction_time: 35 },
  ];

  it('interpolates correctly between two data points', () => {
    // g = 20 + (28-25)/(35-25) * (18-20) = 20 - 0.6 = 19.4
    const result = predictGrind(twoShots, 28);
    expect(result?.grindSetting).toBe(19.4);
    expect(result?.targetTime).toBe(28);
    expect(result?.basedOn).toHaveLength(2);
  });

  it('defaults to a target time of 28 seconds', () => {
    expect(predictGrind(twoShots)?.targetTime).toBe(28);
  });

  it('allows extrapolation within one data-span of the range', () => {
    // target=22: g = 20 + (22-25)/(35-25) * (18-20) = 20.6; hi+span = 22 → inside
    expect(predictGrind(twoShots, 22)).not.toBeNull();
  });

  it('rejects wild extrapolation beyond one data-span', () => {
    const shots = [
      { grind_setting: '20', extraction_time: 25 },
      { grind_setting: '22', extraction_time: 27 },
    ];
    // g = 20 + (50-25)/(27-25) * 2 = 45; hi+span = 24 → rejected
    expect(predictGrind(shots, 50)).toBeNull();
  });

  it('returns null with fewer than 2 valid shots', () => {
    expect(predictGrind([], 28)).toBeNull();
    expect(predictGrind([{ grind_setting: '20', extraction_time: 28 }], 28)).toBeNull();
  });

  it('returns null when both shots share the same extraction time', () => {
    const shots = [
      { grind_setting: '20', extraction_time: 28 },
      { grind_setting: '22', extraction_time: 28 },
    ];
    expect(predictGrind(shots, 28)).toBeNull();
  });

  it('returns null when both shots share the same grind setting', () => {
    const shots = [
      { grind_setting: '20', extraction_time: 25 },
      { grind_setting: '20', extraction_time: 35 },
    ];
    expect(predictGrind(shots, 28)).toBeNull();
  });

  it('skips shots with null or non-numeric grind settings', () => {
    const shots = [
      { grind_setting: null,   extraction_time: 20 },
      { grind_setting: 'fine', extraction_time: 22 },
      { grind_setting: '20',   extraction_time: 25 },
      { grind_setting: '18',   extraction_time: 35 },
    ];
    const result = predictGrind(shots, 28);
    expect(result).not.toBeNull();
    expect(result?.basedOn).toHaveLength(2);
  });

  it('skips shots with zero or negative extraction times', () => {
    const shots = [
      { grind_setting: '15', extraction_time: 0  },
      { grind_setting: '20', extraction_time: 25 },
      { grind_setting: '18', extraction_time: 35 },
    ];
    expect(predictGrind(shots, 28)?.basedOn[0].grind).toBe(20);
  });

  it('uses only the 2 most recent shots (first 2 entries in the input array)', () => {
    const shots = [
      { grind_setting: '20', extraction_time: 25 },
      { grind_setting: '18', extraction_time: 35 },
      { grind_setting: '10', extraction_time: 50 }, // must be ignored
    ];
    const result = predictGrind(shots, 28);
    expect(result?.basedOn[0].grind).toBe(20);
    expect(result?.basedOn[1].grind).toBe(18);
  });
});
