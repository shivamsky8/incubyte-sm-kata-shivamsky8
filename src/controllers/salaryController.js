import { calculate } from '../services/salaryCalculator.js';

/**
 * Create the salary controller handler bound to the given repo.
 *
 * @param {ReturnType<import('../repository/employeeRepo.js').createRepo>} repo
 */
export function salaryController(repo) {
  return {
    getSalary(req, res, next) {
      try {
        const employee = repo.findById(Number(req.params.id));
        const { deductions, net_salary } = calculate(employee.gross_salary, employee.country);

        res.json({
          Employee_ID: employee.Employee_ID,
          gross_salary: employee.gross_salary,
          deductions,
          net_salary,
        });
      } catch (err) {
        next(err);
      }
    },
  };
}
