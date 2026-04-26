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
  }, 60000);
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
  }, 60000);
});

// Feature: salary-management-api, Property 3: Invalid body rejected on write routes
// **Validates: Requirements 1.3, 1.4, 1.5, 3.3**
describe('Property 3: Invalid body rejected on write routes', () => {
  let db;
  let app;

  beforeEach(() => {
    db = openDb(':memory:');
    app = createApp({ db });
  });

  afterEach(() => {
    db.close();
  });

  // Arbitrary that produces a field value that is either missing (undefined) or whitespace-only
  const badStringArb = fc.oneof(
    fc.constant(undefined),
    fc.constant(null),
    fc.array(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 0, maxLength: 5 }).map((a) => a.join(''))
  );

  // Arbitrary that produces a bad gross_salary: missing, non-number, or negative
  const badSalaryArb = fc.oneof(
    fc.constant(undefined),
    fc.constant(null),
    fc.constant('not-a-number'),
    fc.constant(true),
    fc.integer({ min: -1_000_000, max: -1 }).map((n) => n / 100)
  );

  // Generate a body where at least one field is invalid.
  // We pick each field from either a valid or bad arbitrary, then filter
  // to ensure at least one field is actually bad.
  const STRING_FIELDS = ['full_name', 'job_title', 'country'];

  const validStringArb = fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0);
  const validSalaryArb = fc.integer({ min: 0, max: 100_000_000 }).map((n) => n / 100);

  const invalidBodyArb = fc
    .record({
      full_name: fc.oneof(validStringArb, badStringArb),
      job_title: fc.oneof(validStringArb, badStringArb),
      country: fc.oneof(validStringArb, badStringArb),
      gross_salary: fc.oneof(validSalaryArb, badSalaryArb),
    })
    .filter((body) => {
      // At least one field must be invalid
      const stringBad = STRING_FIELDS.some((f) => {
        const v = body[f];
        return v === undefined || v === null || typeof v !== 'string' || v.trim() === '';
      });
      const salaryBad = (() => {
        const v = body.gross_salary;
        return (
          v === undefined ||
          v === null ||
          typeof v !== 'number' ||
          !Number.isFinite(v) ||
          v < 0
        );
      })();
      return stringBad || salaryBad;
    });

  // Helper: compute which fields are expected to be flagged
  function expectedBadFields(body) {
    const fields = [];
    for (const f of STRING_FIELDS) {
      const v = body[f];
      if (v === undefined || v === null || typeof v !== 'string' || v.trim() === '') {
        fields.push(f);
      }
    }
    const sv = body.gross_salary;
    if (
      sv === undefined ||
      sv === null ||
      typeof sv !== 'number' ||
      !Number.isFinite(sv) ||
      sv < 0
    ) {
      fields.push('gross_salary');
    }
    return fields;
  }

  it('POST returns 400 with details enumerating every offending field', async () => {
    await fc.assert(
      fc.asyncProperty(invalidBodyArb, async (body) => {
        // Build a clean payload (strip undefined keys so JSON.stringify omits them)
        const payload = {};
        for (const [k, v] of Object.entries(body)) {
          if (v !== undefined) payload[k] = v;
        }

        const res = await request(app).post('/employees').send(payload);

        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe('VALIDATION_ERROR');

        const expected = expectedBadFields(body);
        const actualFields = res.body.error.details.map((d) => d.field);

        for (const f of expected) {
          expect(actualFields).toContain(f);
        }
        expect(actualFields).toHaveLength(expected.length);
      }),
      { numRuns: 100 }
    );
  }, 60000);
});

// Feature: salary-management-api, Property 4: 404 for unknown Employee_ID
// **Validates: Requirements 2.2, 3.2, 4.2, 6.5**
describe('Property 4: 404 for unknown Employee_ID', () => {
  let db;
  let app;

  beforeEach(() => {
    db = openDb(':memory:');
    app = createApp({ db });
  });

  afterEach(() => {
    db.close();
  });

  it('GET /employees/:id returns 404 NOT_FOUND for any non-existent id', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1_000_000 }),
        async (id) => {
          const res = await request(app).get(`/employees/${id}`);

          expect(res.status).toBe(404);
          expect(res.body.error.code).toBe('NOT_FOUND');
          expect(res.body.error.message).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  }, 60000);
});

// Feature: salary-management-api, Property 5: List returns the full persisted set
// **Validates: Requirements 2.3**
describe('Property 5: List returns the full persisted set', () => {
  it('GET /employees returns exactly the set of created employees', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(validEmployeeArb, { minLength: 0, maxLength: 10 }),
        async (payloads) => {
          // Fresh DB per iteration so previous runs don't leak
          const db = openDb(':memory:');
          const app = createApp({ db });

          const createdIds = [];
          for (const payload of payloads) {
            const res = await request(app).post('/employees').send(payload);
            expect(res.status).toBe(201);
            createdIds.push(res.body.Employee_ID);
          }

          const listRes = await request(app).get('/employees');
          expect(listRes.status).toBe(200);
          expect(Array.isArray(listRes.body)).toBe(true);

          const listedIds = listRes.body.map((e) => e.Employee_ID);
          expect(listedIds.sort()).toEqual(createdIds.sort());

          db.close();
        }
      ),
      { numRuns: 100 }
    );
  }, 60000);
});

// Feature: salary-management-api, Property 6: Update round-trip preserves Employee_ID
// **Validates: Requirements 3.1, 3.4**
describe('Property 6: Update round-trip preserves Employee_ID', () => {
  let db;
  let app;

  beforeEach(() => {
    db = openDb(':memory:');
    app = createApp({ db });
  });

  afterEach(() => {
    db.close();
  });

  it('PUT then GET returns same Employee_ID with updated fields (trimmed, 2dp)', async () => {
    await fc.assert(
      fc.asyncProperty(validEmployeeArb, validEmployeeArb, async (original, updated) => {
        // Create the employee
        const createRes = await request(app).post('/employees').send(original);
        expect(createRes.status).toBe(201);
        const id = createRes.body.Employee_ID;

        // Update the employee
        const putRes = await request(app).put(`/employees/${id}`).send(updated);
        expect(putRes.status).toBe(200);
        expect(putRes.body.Employee_ID).toBe(id);

        // Read back and verify
        const getRes = await request(app).get(`/employees/${id}`);
        expect(getRes.status).toBe(200);
        expect(getRes.body.Employee_ID).toBe(id);
        expect(getRes.body.full_name).toBe(updated.full_name.trim());
        expect(getRes.body.job_title).toBe(updated.job_title.trim());
        expect(getRes.body.country).toBe(updated.country.trim());
        expect(getRes.body.gross_salary).toBe(roundHalfUp(updated.gross_salary));
      }),
      { numRuns: 100 }
    );
  }, 60000);
});
