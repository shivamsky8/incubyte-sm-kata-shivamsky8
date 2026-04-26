import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { openDb } from '../../src/db/connection.js';

describe('POST /employees', () => {
  let db;
  let app;

  beforeEach(() => {
    db = openDb(':memory:');
    app = createApp({ db });
  });

  afterEach(() => {
    db.close();
  });

  it('returns 201 with Employee_ID and all input fields', async () => {
    const payload = {
      full_name: 'Alice Smith',
      job_title: 'Engineer',
      country: 'India',
      gross_salary: 75000.50,
    };

    const res = await request(app).post('/employees').send(payload).expect(201);

    expect(res.body).toMatchObject({
      full_name: 'Alice Smith',
      job_title: 'Engineer',
      country: 'India',
      gross_salary: 75000.50,
    });
    expect(res.body.Employee_ID).toEqual(expect.any(Number));
    expect(Number.isInteger(res.body.Employee_ID)).toBe(true);
  });

  it('assigns unique Employee_IDs to different employees', async () => {
    const payload = {
      full_name: 'Bob Jones',
      job_title: 'Designer',
      country: 'United States',
      gross_salary: 60000,
    };

    const res1 = await request(app).post('/employees').send(payload).expect(201);
    const res2 = await request(app).post('/employees').send(payload).expect(201);

    expect(res1.body.Employee_ID).not.toBe(res2.body.Employee_ID);
  });
});
