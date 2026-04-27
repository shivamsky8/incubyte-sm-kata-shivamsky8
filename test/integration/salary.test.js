import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { openDb } from '../../src/db/connection.js';

describe('GET /employees/:id/salary', () => {
  let db;
  let app;

  beforeEach(() => {
    db = openDb(':memory:');
    app = createApp({ db });
  });

  afterEach(() => {
    db.close();
  });

  it('returns salary with TDS for India (10%)', async () => {
    const createRes = await request(app).post('/employees').send({
      full_name: 'Priya Sharma',
      job_title: 'Engineer',
      country: 'India',
      gross_salary: 100000,
    }).expect(201);

    const id = createRes.body.Employee_ID;
    const res = await request(app).get(`/employees/${id}/salary`).expect(200);

    expect(res.body).toEqual({
      Employee_ID: id,
      gross_salary: 100000,
      deductions: { TDS: 10000 },
      net_salary: 90000,
    });
  });

  it('returns salary with TDS for United States (12%)', async () => {
    const createRes = await request(app).post('/employees').send({
      full_name: 'John Doe',
      job_title: 'Designer',
      country: 'United States',
      gross_salary: 50000,
    }).expect(201);

    const id = createRes.body.Employee_ID;
    const res = await request(app).get(`/employees/${id}/salary`).expect(200);

    expect(res.body).toEqual({
      Employee_ID: id,
      gross_salary: 50000,
      deductions: { TDS: 6000 },
      net_salary: 44000,
    });
  });

  it('returns empty deductions for unknown country', async () => {
    const createRes = await request(app).post('/employees').send({
      full_name: 'Hans Müller',
      job_title: 'Analyst',
      country: 'Germany',
      gross_salary: 80000,
    }).expect(201);

    const id = createRes.body.Employee_ID;
    const res = await request(app).get(`/employees/${id}/salary`).expect(200);

    expect(res.body).toEqual({
      Employee_ID: id,
      gross_salary: 80000,
      deductions: {},
      net_salary: 80000,
    });
  });

  it('returns 404 NOT_FOUND for non-existent employee id', async () => {
    const res = await request(app).get('/employees/999/salary').expect(404);

    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(res.body.error.message).toBeDefined();
  });

  it('response shape includes Employee_ID, gross_salary, deductions, net_salary', async () => {
    const createRes = await request(app).post('/employees').send({
      full_name: 'Test User',
      job_title: 'Tester',
      country: 'India',
      gross_salary: 75000.55,
    }).expect(201);

    const id = createRes.body.Employee_ID;
    const res = await request(app).get(`/employees/${id}/salary`).expect(200);

    expect(res.body).toHaveProperty('Employee_ID');
    expect(res.body).toHaveProperty('gross_salary');
    expect(res.body).toHaveProperty('deductions');
    expect(res.body).toHaveProperty('net_salary');
    expect(typeof res.body.Employee_ID).toBe('number');
    expect(typeof res.body.gross_salary).toBe('number');
    expect(typeof res.body.deductions).toBe('object');
    expect(typeof res.body.net_salary).toBe('number');
  });
});
