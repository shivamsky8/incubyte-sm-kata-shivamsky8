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

describe('GET /employees/:id', () => {
  let db;
  let app;

  beforeEach(() => {
    db = openDb(':memory:');
    app = createApp({ db });
  });

  afterEach(() => {
    db.close();
  });

  it('returns 200 with the employee for an existing id', async () => {
    const payload = {
      full_name: 'Alice Smith',
      job_title: 'Engineer',
      country: 'India',
      gross_salary: 75000.50,
    };

    const createRes = await request(app).post('/employees').send(payload).expect(201);
    const id = createRes.body.Employee_ID;

    const res = await request(app).get(`/employees/${id}`).expect(200);

    expect(res.body).toMatchObject({
      Employee_ID: id,
      full_name: 'Alice Smith',
      job_title: 'Engineer',
      country: 'India',
      gross_salary: 75000.50,
    });
  });

  it('returns 404 with NOT_FOUND for a non-existent id', async () => {
    const res = await request(app).get('/employees/999').expect(404);

    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(res.body.error.message).toBeDefined();
  });
});

describe('GET /employees', () => {
  let db;
  let app;

  beforeEach(() => {
    db = openDb(':memory:');
    app = createApp({ db });
  });

  afterEach(() => {
    db.close();
  });

  it('returns 200 with array of all employees', async () => {
    const p1 = { full_name: 'Alice', job_title: 'Engineer', country: 'India', gross_salary: 50000 };
    const p2 = { full_name: 'Bob', job_title: 'Designer', country: 'United States', gross_salary: 60000 };

    const r1 = await request(app).post('/employees').send(p1).expect(201);
    const r2 = await request(app).post('/employees').send(p2).expect(201);

    const res = await request(app).get('/employees').expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(2);
    expect(res.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ Employee_ID: r1.body.Employee_ID }),
        expect.objectContaining({ Employee_ID: r2.body.Employee_ID }),
      ])
    );
  });

  it('returns 200 with empty array when no employees exist', async () => {
    const res = await request(app).get('/employees').expect(200);

    expect(res.body).toEqual([]);
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
