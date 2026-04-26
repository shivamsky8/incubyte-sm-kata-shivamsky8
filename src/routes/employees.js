import { Router } from 'express';
import { createRepo } from '../repository/employeeRepo.js';
import { employeeController } from '../controllers/employeeController.js';

/**
 * Build the /employees router.
 *
 * @param {import('better-sqlite3').Database} db
 */
export function employeesRouter(db) {
  const router = Router();
  const repo = createRepo(db);
  const ctrl = employeeController(repo);

  router.post('/', ctrl.create);

  return router;
}
