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

describe('POST /employees — validation errors', () => {
  let db;
  let app;

  beforeEach(() => {
    db = openDb(':memory:');
    app = createApp({ db });
  });

  afterEach(() => {
    db.close();
  });

  it('rejects a body with all fields missing', async () => {
    const res = await request(app).post('/employees').send({});

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'full_name' }),
        expect.objectContaining({ field: 'job_title' }),
        expect.objectContaining({ field: 'country' }),
        expect.objectContaining({ field: 'gross_salary' }),
      ])
    );
  });

  it('rejects whitespace-only string fields', async () => {
    const res = await request(app).post('/employees').send({
      full_name: '   ',
      job_title: '\t',
      country: ' \n ',
      gross_salary: 50000,
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'full_name' }),
        expect.objectContaining({ field: 'job_title' }),
        expect.objectContaining({ field: 'country' }),
      ])
    );
    // gross_salary is valid, so it should NOT appear in details
    expect(res.body.error.details).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'gross_salary' })])
    );
  });

  it('rejects negative gross_salary', async () => {
    const res = await request(app).post('/employees').send({
      full_name: 'Alice',
      job_title: 'Engineer',
      country: 'India',
      gross_salary: -100,
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'gross_salary' })])
    );
  });

  it('rejects non-number gross_salary', async () => {
    const res = await request(app).post('/employees').send({
      full_name: 'Alice',
      job_title: 'Engineer',
      country: 'India',
      gross_salary: 'not-a-number',
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'gross_salary' })])
    );
  });
});

describe('POST /employees — invalid JSON', () => {
  let db;
  let app;

  beforeEach(() => {
    db = openDb(':memory:');
    app = createApp({ db });
  });

  afterEach(() => {
    db.close();
  });

  it('rejects malformed JSON with 400 INVALID_JSON', async () => {
    const res = await request(app)
      .post('/employees')
      .set('Content-Type', 'application/json')
      .send('{ invalid json }');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_JSON');
    expect(res.body.error.message).toBeDefined();
  });
});
