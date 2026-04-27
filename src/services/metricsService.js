/**
 * Thin wrapper around repo metrics methods.
 * Keeps the controller free of direct repo coupling.
 *
 * @param {ReturnType<import('../repository/employeeRepo.js').createRepo>} repo
 */
export function createMetricsService(repo) {
  return {
    countryMetrics(country) {
      return repo.countryMetrics(country);
    },
  };
}
