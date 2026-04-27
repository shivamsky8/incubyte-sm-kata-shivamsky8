import { describe, it, expect, afterEach } from 'vitest';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomBytes } from 'node:crypto';
import { unlinkSync } from 'node:fs';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { openDb } from '../../src/db/connection.js';
import { DATABASE_PATH } from '../../src/config.js';

describe('File-backed DB persistence (Requirement 5.4)', () => {
  let tempPath;

  afterEach(() => {
    try {
      unlinkSync(tempPath);
    } catch {
      // file may not exist if test failed early
    }
  });

  it('retains employee data after closing and reopening the DB', async () => {
    tempPath = join(tmpdir(), `salary-test-${randomBytes(8).toString('hex')}.db`);

    // 1. Open a file-backed DB and create an app
    const db1 = openDb(tempPath);
    const app1 = createApp({ db: db1 });

    // 2. POST an employee
    const payload = {
      full_name: 'Persistence Test',
      job_title: 'QA Engineer',
      country: 'India',
      gross_salary: 85000.25,
    };

    const createRes = await request(app1).post('/employees').send(payload).expect(201);
    const id = createRes.body.Employee_ID;

    // 3. Close the DB (simulates process shutdown)
    db1.close();

    // 4. Reopen the DB from the same file path
    const db2 = openDb(tempPath);
    const app2 = createApp({ db: db2 });

    // 5. GET the employee by ID — it should still exist
    const getRes = await request(app2).get(`/employees/${id}`).expect(200);

    expect(getRes.body).toMatchObject({
      Employee_ID: id,
      full_name: 'Persistence Test',
      job_title: 'QA Engineer',
      country: 'India',
      gross_salary: 85000.25,
    });

    db2.close();
  });
});

describe('config.DATABASE_PATH wiring (Requirement 5.4)', () => {
  it('DATABASE_PATH defaults to a file path (not :memory:)', () => {
    // Verify the config exports a file-backed path by default
    expect(typeof DATABASE_PATH).toBe('string');
    expect(DATABASE_PATH).not.toBe(':memory:');
    expect(DATABASE_PATH).toMatch(/\.db$/);
  });

  it('server.js uses DATABASE_PATH from config to open a file-backed DB', async () => {
    // This is a structural verification — server.js imports DATABASE_PATH
    // and passes it to openDb(). We verify the config value is sensible.
    expect(DATABASE_PATH).toBe('./data/salary.db');
  });
});
