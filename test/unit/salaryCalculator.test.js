import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { calculate, RATES } from '../../src/services/salaryCalculator.js';
import { roundHalfUp } from '../../src/util/money.js';

// --- Task 12.1: Unit tests for India and United States ---

describe('salaryCalculator', () => {
  describe('known countries', () => {
    it('calculates TDS at 10% for India with half-up rounding', () => {
      const result = calculate(1000, 'India');
      expect(result.deductions.TDS).toBe(100);
      expect(result.net_salary).toBe(900);
    });

    it('calculates TDS at 10% for India (case-insensitive)', () => {
      const result = calculate(1000, '  INDIA  ');
      expect(result.deductions.TDS).toBe(100);
      expect(result.net_salary).toBe(900);
    });

    it('calculates TDS at 12% for United States with half-up rounding', () => {
      const result = calculate(1000, 'United States');
      expect(result.deductions.TDS).toBe(120);
      expect(result.net_salary).toBe(880);
    });

    it('calculates TDS at 12% for United States (case-insensitive)', () => {
      const result = calculate(1000, '  united states  ');
      expect(result.deductions.TDS).toBe(120);
      expect(result.net_salary).toBe(880);
    });

    it('applies half-up rounding to TDS and net_salary', () => {
      // 33.33 * 0.10 = 3.333 → rounds to 3.33
      const result = calculate(33.33, 'India');
      expect(result.deductions.TDS).toBe(3.33);
      expect(result.net_salary).toBe(30);

      // 33.35 * 0.12 = 4.002 → rounds to 4.00
      const result2 = calculate(33.35, 'United States');
      expect(result2.deductions.TDS).toBe(4);
      expect(result2.net_salary).toBe(29.35);
    });
  });

  // --- Task 12.3: Unknown country → empty deductions ---

  describe('unknown country', () => {
    it('returns empty deductions and net_salary = gross for unknown country', () => {
      const result = calculate(5000, 'Germany');
      expect(result.deductions).toEqual({});
      expect(result.net_salary).toBe(5000);
    });

    it('returns empty deductions for unknown country (case-insensitive, trimmed)', () => {
      const result = calculate(1234.56, '  BRAZIL  ');
      expect(result.deductions).toEqual({});
      expect(result.net_salary).toBe(1234.56);
    });

    it('rounds net_salary half-up for unknown country', () => {
      const result = calculate(33.335, 'France');
      expect(result.deductions).toEqual({});
      expect(result.net_salary).toBe(33.34);
    });
  });

  // --- Task 12.5: Property 8 ---

  // Feature: salary-management-api, Property 8: Salary calculator — known country TDS
  // **Validates: Requirements 6.1, 6.2, 6.4**
  describe('Property 8: known-country TDS', () => {
    const knownCountries = Object.keys(RATES);

    it('TDS = roundHalfUp(gross * rate) and net = roundHalfUp(gross - TDS) for any non-negative gross and known country', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0, max: 1_000_000, noNaN: true, noDefaultInfinity: true }),
          fc.constantFrom(...knownCountries),
          (gross, country) => {
            const rate = RATES[country];
            const result = calculate(gross, country);
            const expectedTDS = roundHalfUp(gross * rate);
            const expectedNet = roundHalfUp(gross - expectedTDS);

            expect(result.deductions.TDS).toBe(expectedTDS);
            expect(result.net_salary).toBe(expectedNet);
          },
        ),
      );
    });
  });

  // --- Task 12.6: Property 9 ---

  // Feature: salary-management-api, Property 9: Salary calculator — unknown country yields no deduction
  // **Validates: Requirements 6.3**
  describe('Property 9: unknown-country no deduction', () => {
    const knownSet = new Set(Object.keys(RATES));

    it('deductions = {} and net = roundHalfUp(gross) for any non-negative gross and unknown country', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0, max: 1_000_000, noNaN: true, noDefaultInfinity: true }),
          fc.string({ minLength: 1 }).filter((s) => !knownSet.has(s.trim().toLowerCase())),
          (gross, country) => {
            const result = calculate(gross, country);

            expect(result.deductions).toEqual({});
            expect(result.net_salary).toBe(roundHalfUp(gross));
          },
        ),
      );
    });
  });
});
