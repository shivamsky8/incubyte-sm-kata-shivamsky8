import { ValidationError } from '../errors/index.js';

const STRING_FIELDS = ['full_name', 'job_title', 'country'];

/**
 * Validate a POST/PUT employee body.
 * Throws ValidationError with a details array listing each offending field.
 *
 * @param {Record<string, unknown>} body
 */
export function validateEmployeeBody(body) {
  const details = [];

  for (const field of STRING_FIELDS) {
    if (body[field] === undefined || body[field] === null) {
      details.push({ field, message: `${field} is required` });
    } else if (typeof body[field] !== 'string' || body[field].trim() === '') {
      details.push({ field, message: `${field} must be a non-empty string` });
    }
  }

  if (body.gross_salary === undefined || body.gross_salary === null) {
    details.push({ field: 'gross_salary', message: 'gross_salary is required' });
  } else if (typeof body.gross_salary !== 'number' || !Number.isFinite(body.gross_salary) || body.gross_salary < 0) {
    details.push({ field: 'gross_salary', message: 'gross_salary must be a non-negative number' });
  }

  if (details.length > 0) {
    throw new ValidationError('Validation failed', details);
  }
}
