import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import fc from 'fast-check';
import { createApp } from '../../src/app.js';
import { openDb } from '../../src/db/connection.js';
import { roundHalfUp } from '../../src/util/money.js';

// Arbitrary that generates a valid employee payload
const validEmployeeArb = fc.record({
  full_name: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
  job_title: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
  country: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
  gross_salary: fc
    .integer({ min: 0, max: 100_000_000 })
    .map((n) => n / 100),
});

// Feature: salary-management-api, Property 1: Create-then-read round-trip
// **Validates: Requirements 1.1, 2.1, 5.5**
describe('Property 1: Create-then-read round-trip', () => {
  let db;
  let app;

  beforeEach(() => {
    db = openDb(':memory:');
    app = createApp({ db });
  });

  afterEach(() => {
    db.close();
  });

  it('POST response matches input (trimmed, 2dp) with integer Employee_ID', async () => {
    await fc.assert(
      fc.asyncProperty(validEmployeeArb, async (payload) => {
        const res = await request(app).post('/employees').send(payload);

        expect(res.status).toBe(201);
        expect(Number.isInteger(res.body.Employee_ID)).toBe(true);
        expect(res.body.full_name).toBe(payload.full_name.trim());
        expect(res.body.job_title).toBe(payload.job_title.trim());
        expect(res.body.country).toBe(payload.country.trim());
        expect(res.body.gross_salary).toBe(roundHalfUp(payload.gross_salary));
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: salary-management-api, Property 2: Employee_ID uniqueness
// **Validates: Requirements 1.2**
describe('Property 2: Employee_ID uniqueness', () => {
  let db;
  let app;

  beforeEach(() => {
    db = openDb(':memory:');
    app = createApp({ db });
  });

  afterEach(() => {
    db.close();
  });

  it('N created employees yield N distinct Employee_IDs', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(validEmployeeArb, { minLength: 1, maxLength: 20 }),
        async (payloads) => {
          const ids = [];
          for (const payload of payloads) {
            const res = await request(app).post('/employees').send(payload);
            expect(res.status).toBe(201);
            ids.push(res.body.Employee_ID);
          }
          const uniqueIds = new Set(ids);
          expect(uniqueIds.size).toBe(payloads.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});
