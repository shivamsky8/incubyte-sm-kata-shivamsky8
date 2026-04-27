import { describe, it, expect } from 'vitest';
import { validateEmployeeBody } from '../../src/validation/employeeSchema.js';
import { ValidationError } from '../../src/errors/index.js';

describe('validateEmployeeBody', () => {
  const validBody = {
    full_name: 'Alice Smith',
    job_title: 'Engineer',
    country: 'India',
    gross_salary: 50000,
  };

  it('does not throw for a valid body', () => {
    expect(() => validateEmployeeBody(validBody)).not.toThrow();
  });

  it('throws ValidationError when full_name is missing', () => {
    const { full_name, ...body } = validBody;
    expect(() => validateEmployeeBody(body)).toThrow(ValidationError);
    try {
      validateEmployeeBody(body);
    } catch (err) {
      expect(err.details).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'full_name' })])
      );
    }
  });

  it('throws ValidationError when job_title is missing', () => {
    const { job_title, ...body } = validBody;
    expect(() => validateEmployeeBody(body)).toThrow(ValidationError);
    try {
      validateEmployeeBody(body);
    } catch (err) {
      expect(err.details).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'job_title' })])
      );
    }
  });

  it('throws ValidationError when country is missing', () => {
    const { country, ...body } = validBody;
    expect(() => validateEmployeeBody(body)).toThrow(ValidationError);
    try {
      validateEmployeeBody(body);
    } catch (err) {
      expect(err.details).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'country' })])
      );
    }
  });

  it('throws ValidationError when gross_salary is missing', () => {
    const { gross_salary, ...body } = validBody;
    expect(() => validateEmployeeBody(body)).toThrow(ValidationError);
    try {
      validateEmployeeBody(body);
    } catch (err) {
      expect(err.details).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'gross_salary' })])
      );
    }
  });

  it('rejects whitespace-only full_name', () => {
    try {
      validateEmployeeBody({ ...validBody, full_name: '   ' });
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError);
      expect(err.details).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'full_name' })])
      );
    }
  });

  it('rejects whitespace-only job_title', () => {
    try {
      validateEmployeeBody({ ...validBody, job_title: '\t' });
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError);
      expect(err.details).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'job_title' })])
      );
    }
  });

  it('rejects whitespace-only country', () => {
    try {
      validateEmployeeBody({ ...validBody, country: ' \n ' });
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError);
      expect(err.details).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'country' })])
      );
    }
  });

  it('rejects negative gross_salary', () => {
    try {
      validateEmployeeBody({ ...validBody, gross_salary: -1 });
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError);
      expect(err.details).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'gross_salary' })])
      );
    }
  });

  it('rejects non-number gross_salary (string)', () => {
    try {
      validateEmployeeBody({ ...validBody, gross_salary: 'abc' });
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError);
      expect(err.details).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'gross_salary' })])
      );
    }
  });

  it('rejects NaN gross_salary', () => {
    try {
      validateEmployeeBody({ ...validBody, gross_salary: NaN });
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError);
      expect(err.details).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'gross_salary' })])
      );
    }
  });

  it('collects all errors when multiple fields are invalid', () => {
    try {
      validateEmployeeBody({});
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError);
      expect(err.details).toHaveLength(4);
      const fields = err.details.map((d) => d.field);
      expect(fields).toEqual(
        expect.arrayContaining(['full_name', 'job_title', 'country', 'gross_salary'])
      );
    }
  });

  it('accepts zero gross_salary', () => {
    expect(() =>
      validateEmployeeBody({ ...validBody, gross_salary: 0 })
    ).not.toThrow();
  });
});
