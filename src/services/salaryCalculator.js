import { roundHalfUp } from '../util/money.js';

export const RATES = {
  india: 0.10,
  'united states': 0.12,
};

/**
 * Calculate net salary and deductions for a given gross salary and country.
 * @param {number} grossSalary
 * @param {string} country
 * @returns {{ deductions: { TDS?: number }, net_salary: number }}
 */
export function calculate(grossSalary, country) {
  const key = country.trim().toLowerCase();
  const rate = RATES[key];

  if (rate !== undefined) {
    const tds = roundHalfUp(grossSalary * rate);
    const netSalary = roundHalfUp(grossSalary - tds);
    return { deductions: { TDS: tds }, net_salary: netSalary };
  }

  return { deductions: {}, net_salary: roundHalfUp(grossSalary) };
}
