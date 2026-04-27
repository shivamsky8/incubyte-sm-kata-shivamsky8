/**
 * Shared test helpers and fast-check arbitraries.
 *
 * Consolidates generators that were duplicated across
 * employees.property.test.js and metrics.test.js.
 */
import fc from 'fast-check';
import { openDb } from '../src/db/connection.js';
import { createApp } from '../src/app.js';

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** Safe alphanumeric string starting with a letter (avoids prototype-pollution edge cases). */
export const safeStringArb = fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9 ]{0,19}$/);

/** Country drawn from a fixed set (useful for metrics tests). */
export const countryArb = fc.constantFrom('India', 'United States', 'Germany', 'France', 'Japan');

/** Job title drawn from a fixed set (useful for metrics tests). */
export const jobTitleArb = fc.constantFrom('Engineer', 'Designer', 'Analyst', 'Manager', 'Intern');

/** Valid employee payload with a free-form country string. */
export const validEmployeeArb = fc.record({
  full_name: safeStringArb,
  job_title: safeStringArb,
  country: safeStringArb,
  gross_salary: fc.integer({ min: 0, max: 100_000_000 }).map((n) => n / 100),
}).map((r) => ({
  full_name: r.full_name,
  job_title: r.job_title,
  country: r.country,
  gross_salary: r.gross_salary,
}));

/** Valid employee payload with country drawn from the fixed country set. */
export const validEmployeeWithCountryArb = fc.record({
  full_name: safeStringArb,
  job_title: safeStringArb,
  country: countryArb,
  gross_salary: fc.integer({ min: 0, max: 100_000_000 }).map((n) => n / 100),
}).map((r) => ({
  full_name: r.full_name,
  job_title: r.job_title,
  country: r.country,
  gross_salary: r.gross_salary,
}));

/** Valid employee payload with job title drawn from the fixed job title set. */
export const validEmployeeWithJobTitleArb = fc.record({
  full_name: safeStringArb,
  job_title: jobTitleArb,
  country: countryArb,
  gross_salary: fc.integer({ min: 0, max: 100_000_000 }).map((n) => n / 100),
}).map((r) => ({
  full_name: r.full_name,
  job_title: r.job_title,
  country: r.country,
  gross_salary: r.gross_salary,
}));

// ---------------------------------------------------------------------------
// App setup helper
// ---------------------------------------------------------------------------

/**
 * Create an in-memory DB + Express app pair for integration tests.
 * @returns {{ db: import('better-sqlite3').Database, app: import('express').Express }}
 */
export function createTestApp() {
  const db = openDb(':memory:');
  const app = createApp({ db });
  return { db, app };
}
