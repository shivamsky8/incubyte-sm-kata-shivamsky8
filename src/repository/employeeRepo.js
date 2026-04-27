import { roundHalfUp } from '../util/money.js';
import { NotFoundError } from '../errors/index.js';

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
  const selectByIdStmt = db.prepare('SELECT * FROM employees WHERE id = ?');
  const selectAllStmt = db.prepare('SELECT * FROM employees');
  const updateStmt = db.prepare(
    'UPDATE employees SET full_name = ?, job_title = ?, country = ?, gross_salary = ? WHERE id = ?'
  );
  const deleteStmt = db.prepare('DELETE FROM employees WHERE id = ?');

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

    findById(id) {
      const row = selectByIdStmt.get(id);
      if (!row) {
        throw new NotFoundError(`Employee ${id} not found`);
      }
      return toApi(row);
    },

    findAll() {
      return selectAllStmt.all().map(toApi);
    },

    update(id, data) {
      const existing = selectByIdStmt.get(id);
      if (!existing) {
        throw new NotFoundError(`Employee ${id} not found`);
      }

      const full_name = data.full_name.trim();
      const job_title = data.job_title.trim();
      const country = data.country.trim();
      const gross_salary = roundHalfUp(data.gross_salary);

      updateStmt.run(full_name, job_title, country, gross_salary, id);
      return toApi({ id, full_name, job_title, country, gross_salary });
    },

    remove(id) {
      const existing = selectByIdStmt.get(id);
      if (!existing) {
        throw new NotFoundError(`Employee ${id} not found`);
      }
      deleteStmt.run(id);
    },

    countryMetrics(country) {
      const stmt = db.prepare(
        `SELECT
           COUNT(*) AS employee_count,
           MIN(gross_salary) AS minimum_salary,
           MAX(gross_salary) AS maximum_salary,
           AVG(gross_salary) AS average_salary
         FROM employees
         WHERE country = ? COLLATE NOCASE`
      );
      const row = stmt.get(country);
      return {
        country,
        employee_count: row.employee_count,
        minimum_salary: row.employee_count === 0 ? null : row.minimum_salary,
        maximum_salary: row.employee_count === 0 ? null : row.maximum_salary,
        average_salary: row.employee_count === 0 ? null : roundHalfUp(row.average_salary),
      };
    },
  };
}
