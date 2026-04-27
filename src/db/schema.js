/**
 * Bootstrap the employees table and indexes.
 * Safe to call repeatedly — uses IF NOT EXISTS.
 *
 * @param {import('better-sqlite3').Database} db
 */
export function createSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS employees (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name    TEXT    NOT NULL CHECK (length(trim(full_name)) > 0),
      job_title    TEXT    NOT NULL CHECK (length(trim(job_title)) > 0),
      country      TEXT    NOT NULL CHECK (length(trim(country))   > 0),
      gross_salary REAL    NOT NULL CHECK (gross_salary >= 0)
    );

    CREATE INDEX IF NOT EXISTS idx_employees_country   ON employees(country   COLLATE NOCASE);
    CREATE INDEX IF NOT EXISTS idx_employees_job_title ON employees(job_title COLLATE NOCASE);
  `);
}
