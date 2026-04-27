import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import fc from 'fast-check';
import { createApp } from '../../src/app.js';
import { openDb } from '../../src/db/connection.js';
import { roundHalfUp } from '../../src/util/money.js';

// ---------------------------------------------------------------------------
// Integration tests for GET /metrics/country (Task 15.1)
// ---------------------------------------------------------------------------

describe('GET /metrics/country — integration', () => {
  let db;
  let app;

  beforeEach(() => {
    db = openDb(':memory:');
    app = createApp({ db });
  });

  afterEach(() => {
    db.close();
  });

  it('returns aggregated metrics for a matching country', async () => {
    await request(app).post('/employees').send({
      full_name: 'Alice', job_title: 'Engineer', country: 'India', gross_salary: 50000,
    }).expect(201);
    await request(app).post('/employees').send({
      full_name: 'Bob', job_title: 'Designer', country: 'India', gross_salary: 70000,
    }).expect(201);
    await request(app).post('/employees').send({
      full_name: 'Charlie', job_title: 'Analyst', country: 'United States', gross_salary: 90000,
    }).expect(201);

    const res = await request(app).get('/metrics/country?country=India').expect(200);

    expect(res.body).toEqual({
      country: 'India',
      employee_count: 2,
      minimum_salary: 50000,
      maximum_salary: 70000,
      average_salary: 60000,
    });
  });

  it('returns count 0 and null salary fields for zero-match country', async () => {
    const res = await request(app).get('/metrics/country?country=Narnia').expect(200);

    expect(res.body).toEqual({
      country: 'Narnia',
      employee_count: 0,
      minimum_salary: null,
      maximum_salary: null,
      average_salary: null,
    });
  });

  it('returns 400 VALIDATION_ERROR when country param is missing', async () => {
    const res = await request(app).get('/metrics/country').expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toBeDefined();
  });

  it('returns 400 VALIDATION_ERROR when country param is empty', async () => {
    const res = await request(app).get('/metrics/country?country=').expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 VALIDATION_ERROR when country param is whitespace-only', async () => {
    const res = await request(app).get('/metrics/country?country=%20%20').expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('matches country case-insensitively', async () => {
    await request(app).post('/employees').send({
      full_name: 'Priya', job_title: 'Engineer', country: 'India', gross_salary: 80000,
    }).expect(201);

    const res = await request(app).get('/metrics/country?country=INDIA').expect(200);

    expect(res.body.employee_count).toBe(1);
    expect(res.body.minimum_salary).toBe(80000);
  });
});


// ---------------------------------------------------------------------------
// Shared arbitrary for valid employee payloads
// ---------------------------------------------------------------------------

const countryArb = fc.constantFrom('India', 'United States', 'Germany', 'France', 'Japan');

const validEmployeeArb = fc.record({
  full_name: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
  job_title: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
  country: countryArb,
  gross_salary: fc.integer({ min: 0, max: 100_000_000 }).map((n) => n / 100),
});

// ---------------------------------------------------------------------------
// Property 10: Metrics equal reference aggregation (country)
// Feature: salary-management-api, Property 10: Metrics equal reference aggregation (country)
// **Validates: Requirements 7.1, 7.2**
// ---------------------------------------------------------------------------

describe('Property 10: Metrics equal reference aggregation (country)', () => {
  it('endpoint response matches JS reference aggregation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(validEmployeeArb, { minLength: 1, maxLength: 8 }),
        countryArb,
        async (payloads, queryCountry) => {
          const db = openDb(':memory:');
          const app = createApp({ db });

          // Populate
          for (const p of payloads) {
            const r = await request(app).post('/employees').send(p);
            expect(r.status).toBe(201);
          }

          // Reference aggregation in JS
          const matched = payloads.filter(
            (p) => p.country.toLowerCase() === queryCountry.toLowerCase()
          );
          const expectedCount = matched.length;
          let expectedMin = null;
          let expectedMax = null;
          let expectedAvg = null;

          if (expectedCount > 0) {
            const salaries = matched.map((p) => roundHalfUp(p.gross_salary));
            expectedMin = Math.min(...salaries);
            expectedMax = Math.max(...salaries);
            const sum = salaries.reduce((a, b) => a + b, 0);
            expectedAvg = roundHalfUp(sum / expectedCount);
          }

          const res = await request(app)
            .get(`/metrics/country?country=${encodeURIComponent(queryCountry)}`)
            .expect(200);

          expect(res.body.country).toBe(queryCountry);
          expect(res.body.employee_count).toBe(expectedCount);
          expect(res.body.minimum_salary).toBe(expectedMin);
          expect(res.body.maximum_salary).toBe(expectedMax);
          expect(res.body.average_salary).toBe(expectedAvg);

          db.close();
        }
      ),
      { numRuns: 20 }
    );
  }, 60000);
});

// ---------------------------------------------------------------------------
// Property 11: Zero-match metrics shape (country)
// Feature: salary-management-api, Property 11: Zero-match metrics shape (country)
// **Validates: Requirements 7.3**
// ---------------------------------------------------------------------------

describe('Property 11: Zero-match metrics shape (country)', () => {
  it('non-existent country returns count 0 and null salary fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        async (country) => {
          const db = openDb(':memory:');
          const app = createApp({ db });

          const res = await request(app)
            .get(`/metrics/country?country=${encodeURIComponent(country)}`)
            .expect(200);

          expect(res.body.country).toBe(country.trim());
          expect(res.body.employee_count).toBe(0);
          expect(res.body.minimum_salary).toBeNull();
          expect(res.body.maximum_salary).toBeNull();
          expect(res.body.average_salary).toBeNull();

          db.close();
        }
      ),
      { numRuns: 20 }
    );
  }, 60000);
});

// ---------------------------------------------------------------------------
// Property 12: Metamorphic ordering of country metrics
// Feature: salary-management-api, Property 12: Metamorphic ordering of country metrics
// **Validates: Requirements 7.5**
// ---------------------------------------------------------------------------

describe('Property 12: Metamorphic ordering of country metrics', () => {
  it('for any non-empty matched set, min ≤ avg ≤ max', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(validEmployeeArb, { minLength: 1, maxLength: 8 }),
        async (payloads) => {
          const db = openDb(':memory:');
          const app = createApp({ db });

          for (const p of payloads) {
            await request(app).post('/employees').send(p).expect(201);
          }

          // Pick the country of the first employee — guaranteed at least one match
          const queryCountry = payloads[0].country;

          const res = await request(app)
            .get(`/metrics/country?country=${encodeURIComponent(queryCountry)}`)
            .expect(200);

          expect(res.body.employee_count).toBeGreaterThanOrEqual(1);
          expect(res.body.minimum_salary).toBeLessThanOrEqual(res.body.average_salary);
          expect(res.body.average_salary).toBeLessThanOrEqual(res.body.maximum_salary);

          db.close();
        }
      ),
      { numRuns: 20 }
    );
  }, 60000);
});

// ---------------------------------------------------------------------------
// Property 13: Required non-empty query parameter (country)
// Feature: salary-management-api, Property 13: Required non-empty query parameter (country)
// **Validates: Requirements 7.4**
// ---------------------------------------------------------------------------

describe('Property 13: Required non-empty query parameter (country)', () => {
  it('omitting or sending empty country param returns 400 VALIDATION_ERROR', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          // No country param at all
          fc.constant('/metrics/country'),
          // Empty string
          fc.constant('/metrics/country?country='),
          // Whitespace-only
          fc.array(fc.constantFrom(' ', '\t'), { minLength: 1, maxLength: 5 })
            .map((a) => `/metrics/country?country=${encodeURIComponent(a.join(''))}`)
        ),
        async (url) => {
          const db = openDb(':memory:');
          const app = createApp({ db });

          const res = await request(app).get(url);

          expect(res.status).toBe(400);
          expect(res.body.error.code).toBe('VALIDATION_ERROR');

          db.close();
        }
      ),
      { numRuns: 20 }
    );
  }, 60000);
});
