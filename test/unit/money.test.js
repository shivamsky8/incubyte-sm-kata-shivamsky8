import { describe, it, expect } from 'vitest';
import { roundHalfUp } from '../../src/util/money.js';

describe('roundHalfUp', () => {
  it('rounds .5 up (half-up rule)', () => {
    expect(roundHalfUp(2.345)).toBe(2.35);
    expect(roundHalfUp(2.335)).toBe(2.34);
    expect(roundHalfUp(1.005)).toBe(1.01);
    expect(roundHalfUp(0.005)).toBe(0.01);
    expect(roundHalfUp(2.125)).toBe(2.13);
  });

  it('leaves already-2dp values unchanged', () => {
    expect(roundHalfUp(1.23)).toBe(1.23);
    expect(roundHalfUp(100.00)).toBe(100);
    expect(roundHalfUp(0.10)).toBe(0.1);
  });

  it('rounds large values correctly', () => {
    expect(roundHalfUp(123456789.125)).toBe(123456789.13);
    expect(roundHalfUp(999999.995)).toBe(1000000.00);
  });

  it('returns 0 for negative zero (not -0)', () => {
    expect(Object.is(roundHalfUp(-0), 0)).toBe(true);
    expect(Object.is(roundHalfUp(-0.001), 0)).toBe(true);
  });

  it('rounds to 0 decimal places when dp = 0', () => {
    expect(roundHalfUp(2.5, 0)).toBe(3);
    expect(roundHalfUp(2.4, 0)).toBe(2);
  });

  it('rounds to custom dp', () => {
    expect(roundHalfUp(1.2345, 3)).toBe(1.235);
    expect(roundHalfUp(1.2344, 3)).toBe(1.234);
  });

  it('handles zero', () => {
    expect(roundHalfUp(0)).toBe(0);
  });

  it('handles whole numbers', () => {
    expect(roundHalfUp(5)).toBe(5);
    expect(roundHalfUp(100)).toBe(100);
  });
});
