import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import fc from 'fast-check';
import { createTestApp } from '../helpers.js';

// Feature: salary-management-api, Property 14: Uniform error envelope
// **Validates: Requirements 9.1, 9.2**
describe('Property 14: Uniform error envelope', () => {
  let db;
  let app;

  beforeEach(() => {
    ({ db, app } = createTestApp());
  });

  afterEach(() => {
    db.close();
  });

  // Each entry is a function that returns { method, url, body?, contentType? }
  const errorRequests = [
    // POST /employees with empty body → 400
    { method: 'post', url: '/employees', body: {}, label: 'POST /employees empty body' },
    // POST /employees with invalid JSON → 400
    { method: 'post', url: '/employees', rawBody: '{bad json', contentType: 'application/json', label: 'POST /employees invalid JSON' },
    // GET /employees/999999 → 404
    { method: 'get', url: '/employees/999999', label: 'GET /employees/999999' },
    // PUT /employees/999999 with valid body → 404
    { method: 'put', url: '/employees/999999', body: { full_name: 'A', job_title: 'B', country: 'C', gross_salary: 100 }, label: 'PUT /employees/999999' },
    // DELETE /employees/999999 → 404
    { method: 'delete', url: '/employees/999999', label: 'DELETE /employees/999999' },
    // GET /employees/999999/salary → 404
    { method: 'get', url: '/employees/999999/salary', label: 'GET /employees/999999/salary' },
    // GET /metrics/country without param → 400
    { method: 'get', url: '/metrics/country', label: 'GET /metrics/country missing param' },
    // GET /metrics/job-title without param → 400
    { method: 'get', url: '/metrics/job-title', label: 'GET /metrics/job-title missing param' },
  ];

  const errorRequestArb = fc.constantFrom(...errorRequests);

  it('every error-producing request returns application/json with { error: { code, message, details? } }', async () => {
    await fc.assert(
      fc.asyncProperty(errorRequestArb, async (reqDef) => {
        let res;

        if (reqDef.rawBody) {
          // Send raw string body for invalid JSON test
          res = await request(app)
            [reqDef.method](reqDef.url)
            .set('Content-Type', reqDef.contentType)
            .send(reqDef.rawBody);
        } else if (reqDef.body) {
          res = await request(app)
            [reqDef.method](reqDef.url)
            .send(reqDef.body);
        } else {
          res = await request(app)
            [reqDef.method](reqDef.url);
        }

        // Status must be 4xx or 5xx
        expect(res.status).toBeGreaterThanOrEqual(400);
        expect(res.status).toBeLessThan(600);

        // Content-Type must be application/json
        expect(res.headers['content-type']).toMatch(/application\/json/);

        // Body must have error object
        expect(res.body).toHaveProperty('error');
        expect(typeof res.body.error).toBe('object');
        expect(res.body.error).not.toBeNull();

        // error.code must be a string
        expect(typeof res.body.error.code).toBe('string');
        expect(res.body.error.code.length).toBeGreaterThan(0);

        // error.message must be a string
        expect(typeof res.body.error.message).toBe('string');
        expect(res.body.error.message.length).toBeGreaterThan(0);

        // If details is present, it must be an array
        if (res.body.error.details !== undefined) {
          expect(Array.isArray(res.body.error.details)).toBe(true);
        }
      }),
      { numRuns: 10 }
    );
  }, 60000);
});
