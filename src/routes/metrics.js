import { Router } from 'express';
import { createRepo } from '../repository/employeeRepo.js';
import { createMetricsService } from '../services/metricsService.js';
import { metricsController } from '../controllers/metricsController.js';

/**
 * Build the /metrics router.
 *
 * @param {import('better-sqlite3').Database} db
 */
export function metricsRouter(db) {
  const router = Router();
  const repo = createRepo(db);
  const service = createMetricsService(repo);
  const ctrl = metricsController(service);

  router.get('/country', ctrl.getCountryMetrics);

  return router;
}
