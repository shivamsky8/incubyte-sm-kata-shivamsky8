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

    getById(req, res, next) {
      try {
        const employee = repo.findById(Number(req.params.id));
        res.json(employee);
      } catch (err) {
        next(err);
      }
    },

    list(_req, res, next) {
      try {
        const employees = repo.findAll();
        res.json(employees);
      } catch (err) {
        next(err);
      }
    },

    update(req, res, next) {
      try {
        validateEmployeeBody(req.body);
        const employee = repo.update(Number(req.params.id), req.body);
        res.json(employee);
      } catch (err) {
        next(err);
      }
    },
  };
}
