import { employeesRouter } from './employees.js';
import { metricsRouter } from './metrics.js';

/**
 * Mount all route groups on the given Express app.
 *
 * @param {import('express').Express} app
 * @param {import('better-sqlite3').Database} db
 */
export function mountRoutes(app, db) {
  app.use('/employees', employeesRouter(db));
  app.use('/metrics', metricsRouter(db));
}
