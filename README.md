# Salary Management API

REST API for managing employee records and computing salary metrics. Built with Node.js (ESM), Express 5, and SQLite.

## Setup

```bash
pnpm install
```

Copy `.env.example` to `.env` and adjust if needed:

```
PORT=3000
DATABASE_PATH=./data/salary.db
```

## Run

```bash
pnpm start
```

The server listens on `PORT` (default `3000`). The SQLite database file is created automatically on first start.

## Test

```bash
pnpm test
```

Runs the full test suite via `vitest --run` (unit + integration + property-based tests). All tests use in-memory SQLite — no external services required.

## API Endpoints

All responses use `Content-Type: application/json`. Error responses follow a uniform envelope:

```json
{ "error": { "code": "ERROR_CODE", "message": "Human-readable message", "details": [] } }
```

Error codes: `VALIDATION_ERROR` (400), `INVALID_JSON` (400), `NOT_FOUND` (404), `INTERNAL_ERROR` (500).

---

### POST /employees

Create a new employee.

**Request body:**

```json
{
  "full_name": "Jane Doe",
  "job_title": "Engineer",
  "country": "India",
  "gross_salary": 75000.50
}
```

All fields required. `full_name`, `job_title`, `country` must be non-empty strings. `gross_salary` must be a non-negative number.

**Response:** `201 Created`

```json
{
  "Employee_ID": 1,
  "full_name": "Jane Doe",
  "job_title": "Engineer",
  "country": "India",
  "gross_salary": 75000.50
}
```

---

### GET /employees/:id

Retrieve a single employee by ID.

**Response:** `200 OK`

```json
{
  "Employee_ID": 1,
  "full_name": "Jane Doe",
  "job_title": "Engineer",
  "country": "India",
  "gross_salary": 75000.50
}
```

Returns `404` if the employee does not exist.

---

### GET /employees

List all employees.

**Response:** `200 OK`

```json
[
  { "Employee_ID": 1, "full_name": "Jane Doe", "job_title": "Engineer", "country": "India", "gross_salary": 75000.50 }
]
```

Returns an empty array `[]` when no employees exist.

---

### PUT /employees/:id

Update an existing employee. Request body is the same shape as POST.

**Request body:**

```json
{
  "full_name": "Jane Smith",
  "job_title": "Senior Engineer",
  "country": "United States",
  "gross_salary": 95000.00
}
```

**Response:** `200 OK` — returns the updated employee record.

Returns `404` if the employee does not exist. Returns `400` for validation errors.

---

### DELETE /employees/:id

Delete an employee.

**Response:** `204 No Content` (empty body).

Returns `404` if the employee does not exist.

---

### GET /employees/:id/salary

Calculate net salary with country-specific tax deductions.

**Response:** `200 OK`

```json
{
  "Employee_ID": 1,
  "gross_salary": 75000.50,
  "deductions": {
    "TDS": 7500.05
  },
  "net_salary": 67500.45
}
```

Known TDS rates: India = 10%, United States = 12%. Unknown countries return empty `deductions` and `net_salary` equal to `gross_salary`. All monetary values are rounded half-up to 2 decimal places.

Returns `404` if the employee does not exist.

---

### GET /metrics/country?country=...

Salary metrics aggregated by country (case-insensitive match).

**Response:** `200 OK`

```json
{
  "country": "India",
  "employee_count": 3,
  "minimum_salary": 50000.00,
  "maximum_salary": 90000.00,
  "average_salary": 70000.00
}
```

When no employees match: `employee_count` is `0`, salary fields are `null`.

Returns `400` if `country` query parameter is missing or empty.

---

### GET /metrics/job-title?job_title=...

Salary metrics aggregated by job title (case-insensitive match).

**Response:** `200 OK`

```json
{
  "job_title": "Engineer",
  "employee_count": 5,
  "average_salary": 72000.00
}
```

When no employees match: `employee_count` is `0`, `average_salary` is `null`.

Returns `400` if `job_title` query parameter is missing or empty.

## AI Usage

This project was built with **Kiro**, an AI assistant for spec-driven development.

### Tools Used

- **Kiro AI Assistant** — spec authoring, code generation, test writing, and iterative refinement
- **fast-check** — property-based testing library, used to verify universal correctness properties across randomized inputs

### How AI Was Used

**Spec-driven development:** The requirements document, design document, and implementation task list following a structured workflow (requirements → design → tasks). Each task mapped to a specific TDD red/green/refactor cycle.

**Representative prompts:**

1. *"Create a spec for a salary management REST API based on the Incubyte hiring kata requirements"* — Generated the full requirements and design documents with acceptance criteria, API contracts, data models, and 14 correctness properties.

2. *"Execute: Implement POST /employees"* — Kiro wrote the employee repository, validation logic, controller, route wiring, and integration tests in a single TDD cycle.

3. *"Execute Task 12: Implement salary calculator service"* — Generated the salary calculator with country-specific TDS rates, half-up rounding, and both unit tests and property-based tests validating the calculation invariants.

4. *"Execute: Implement GET /metrics/country endpoint"* — Built the metrics aggregation query, service layer, controller, and property tests including metamorphic ordering verification (min ≤ avg ≤ max).

### Rationale

- **Spec-first approach** ensured requirements were captured before any code was written, reducing rework
- **Property-based testing** caught edge cases that example-based tests would miss (rounding boundaries, empty sets, case sensitivity)
- **TDD workflow** with AI assistance maintained discipline: every feature started with a failing test
- **Incremental task execution** kept changes small and reviewable, matching the kata's commit-history expectations
