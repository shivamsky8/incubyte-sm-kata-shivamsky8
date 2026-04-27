import { ValidationError } from '../errors/index.js';

/**
 * Validate that a required query parameter is present and non-empty after trimming.
 * Throws ValidationError if the parameter is missing or empty.
 *
 * @param {import('express').Request} req
 * @param {string} name — the query parameter name
 * @returns {string} the trimmed value
 */
export function requireNonEmptyQueryParam(req, name) {
  const raw = req.query[name];
  if (raw === undefined || raw === null || typeof raw !== 'string' || raw.trim() === '') {
    throw new ValidationError(`${name} is required`, [
      { field: name, message: `${name} is required` },
    ]);
  }
  return raw.trim();
}
