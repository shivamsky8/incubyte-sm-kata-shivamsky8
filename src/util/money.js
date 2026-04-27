/**
 * Round a number to `dp` decimal places using half-up rounding.
 * Uses exponential notation to avoid floating-point drift
 * (e.g. 1.005 * 100 !== 100.5 in IEEE 754, but Number('1.005e2') === 100.5).
 * Returns 0 (not -0) for values that round to zero.
 *
 * @param {number} value
 * @param {number} dp - decimal places (default 2)
 * @returns {number}
 */
export function roundHalfUp(value, dp = 2) {
  const shifted = Number(value + 'e' + dp);
  const rounded = Math.round(shifted);
  const result = Number(rounded + 'e-' + dp);
  return result === 0 ? 0 : result;
}
