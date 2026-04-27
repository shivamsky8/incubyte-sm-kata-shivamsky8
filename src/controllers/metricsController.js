import { requireNonEmptyQueryParam } from '../validation/queryParams.js';

/**
 * Create the metrics controller handlers bound to the given metrics service.
 *
 * @param {ReturnType<import('../services/metricsService.js').createMetricsService>} metricsService
 */
export function metricsController(metricsService) {
  return {
    getCountryMetrics(req, res, next) {
      try {
        const country = requireNonEmptyQueryParam(req, 'country');
        const metrics = metricsService.countryMetrics(country);
        res.json(metrics);
      } catch (err) {
        next(err);
      }
    },
  };
}
