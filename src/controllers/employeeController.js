import { validateEmployeeBody } from '../validation/employeeSchema.js';

/**
 * Create the employee controller handlers bound to the given repo.
 *
 * @param {ReturnType<import('../repository/employeeRepo.js').createRepo>} repo
 */
export function employeeController(repo) {
  return {
    create(req, res, next) {
      try {
        validateEmployeeBody(req.body);
        const employee = repo.create(req.body);
        res.status(201).json(employee);
      } catch (err) {
        next(err);
      }
    },
  };
}
