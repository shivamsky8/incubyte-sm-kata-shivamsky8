import { Router } from 'express';
import { createRepo } from '../repository/employeeRepo.js';
import { employeeController } from '../controllers/employeeController.js';
import { salaryController } from '../controllers/salaryController.js';

/**
 * Build the /employees router.
 *
 * @param {import('better-sqlite3').Database} db
 */
export function employeesRouter(db) {
  const router = Router();
  const repo = createRepo(db);
  const ctrl = employeeController(repo);
  const salaryCtrl = salaryController(repo);

  router.post('/', ctrl.create);
  router.get('/', ctrl.list);
  router.get('/:id/salary', salaryCtrl.getSalary);
  router.get('/:id', ctrl.getById);
  router.put('/:id', ctrl.update);
  router.delete('/:id', ctrl.remove);

  return router;
}
