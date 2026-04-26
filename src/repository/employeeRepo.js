import { roundHalfUp } from '../util/money.js';

/**
 * Map a SQLite row (with `id`) to the API shape (with `Employee_ID`).
 */
function toApi(row) {
  if (!row) return undefined;
  const { id, ...rest } = row;
  return { Employee_ID: id, ...rest };
}

/**
 * Create an employee repository bound to the given better-sqlite3 instance.
 *
 * @param {import('better-sqlite3').Database} db
 */
export function createRepo(db) {
  const insertStmt = db.prepare(
    'INSERT INTO employees (full_name, job_title, country, gross_salary) VALUES (?, ?, ?, ?)'
  );

  return {
    create(data) {
      const full_name = data.full_name.trim();
      const job_title = data.job_title.trim();
      const country = data.country.trim();
      const gross_salary = roundHalfUp(data.gross_salary);

      const info = insertStmt.run(full_name, job_title, country, gross_salary);
      return toApi({
        id: Number(info.lastInsertRowid),
        full_name,
        job_title,
        country,
        gross_salary,
      });
    },
  };
}
