import { describe, it, expect } from 'vitest';
import { openDb } from '../../src/db/connection.js';
import { createSchema } from '../../src/db/schema.js';

describe('DB schema bootstrap', () => {
  it('creates the employees table with expected columns', () => {
    const db = openDb(':memory:');
    createSchema(db);

    const info = db.pragma('table_info(employees)');
    const columns = info.map((col) => col.name);

    expect(columns).toEqual(['id', 'full_name', 'job_title', 'country', 'gross_salary']);
    db.close();
  });

  it('is idempotent — calling createSchema twice does not throw', () => {
    const db = openDb(':memory:');
    createSchema(db);
    createSchema(db);

    const rows = db.prepare('SELECT count(*) AS cnt FROM employees').get();
    expect(rows.cnt).toBe(0);
    db.close();
  });

  it('creates indexes on country and job_title', () => {
    const db = openDb(':memory:');
    createSchema(db);

    const indexes = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = 'employees'")
      .all()
      .map((r) => r.name);

    expect(indexes).toContain('idx_employees_country');
    expect(indexes).toContain('idx_employees_job_title');
    db.close();
  });

  it('enforces CHECK constraint on empty full_name', () => {
    const db = openDb(':memory:');
    createSchema(db);

    expect(() => {
      db.prepare(
        'INSERT INTO employees (full_name, job_title, country, gross_salary) VALUES (?, ?, ?, ?)'
      ).run('   ', 'Dev', 'India', 50000);
    }).toThrow();
    db.close();
  });

  it('enforces CHECK constraint on negative gross_salary', () => {
    const db = openDb(':memory:');
    createSchema(db);

    expect(() => {
      db.prepare(
        'INSERT INTO employees (full_name, job_title, country, gross_salary) VALUES (?, ?, ?, ?)'
      ).run('Alice', 'Dev', 'India', -1);
    }).toThrow();
    db.close();
  });
});
