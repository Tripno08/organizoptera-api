/**
 * @organizoptera/core - Organization Validator Tests
 */

import { describe, it, expect } from 'vitest';
import {
  validateCreateSchoolNetwork,
  validateUpdateSchoolNetwork,
  validateCreateSchool,
  validateUpdateSchool,
  validateCreateStudent,
  validateUpdateStudent,
  validateCreateTeacher,
  validateUpdateTeacher,
} from '../validation/organization-validator';

describe('Organization Validator', () => {
  describe('validateCreateSchoolNetwork', () => {
    it('should pass for valid data', () => {
      const result = validateCreateSchoolNetwork({
        name: 'Test Network',
        slug: 'test-network',
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail for missing name', () => {
      const result = validateCreateSchoolNetwork({
        name: '',
        slug: 'test-network',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'name' && e.code === 'REQUIRED')).toBe(true);
    });

    it('should fail for missing slug', () => {
      const result = validateCreateSchoolNetwork({
        name: 'Test Network',
        slug: '',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'slug' && e.code === 'REQUIRED')).toBe(true);
    });

    it('should fail for name too short', () => {
      const result = validateCreateSchoolNetwork({
        name: 'A',
        slug: 'test-network',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'name' && e.code === 'MIN_LENGTH')).toBe(true);
    });

    it('should fail for name too long', () => {
      const result = validateCreateSchoolNetwork({
        name: 'A'.repeat(201),
        slug: 'test-network',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'name' && e.code === 'MAX_LENGTH')).toBe(true);
    });

    it('should fail for invalid slug format', () => {
      const result = validateCreateSchoolNetwork({
        name: 'Test Network',
        slug: 'Invalid Slug!',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'slug' && e.code === 'INVALID_FORMAT')).toBe(true);
    });

    it('should fail for slug too long', () => {
      const result = validateCreateSchoolNetwork({
        name: 'Test Network',
        slug: 'a'.repeat(101),
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'slug' && e.code === 'MAX_LENGTH')).toBe(true);
    });

    it('should accept valid slug formats', () => {
      const validSlugs = ['test', 'test-network', 'test-123', 'a-b-c'];
      for (const slug of validSlugs) {
        const result = validateCreateSchoolNetwork({ name: 'Test', slug });
        expect(result.valid).toBe(true);
      }
    });
  });

  describe('validateUpdateSchoolNetwork', () => {
    it('should pass for valid update', () => {
      const result = validateUpdateSchoolNetwork({
        name: 'Updated Network',
      });
      expect(result.valid).toBe(true);
    });

    it('should pass for empty update', () => {
      const result = validateUpdateSchoolNetwork({});
      expect(result.valid).toBe(true);
    });

    it('should fail for name too short', () => {
      const result = validateUpdateSchoolNetwork({
        name: 'A',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'name' && e.code === 'MIN_LENGTH')).toBe(true);
    });

    it('should fail for invalid slug format', () => {
      const result = validateUpdateSchoolNetwork({
        slug: 'Invalid!',
      });
      expect(result.valid).toBe(false);
    });
  });

  describe('validateCreateSchool', () => {
    it('should pass for valid data', () => {
      const result = validateCreateSchool({
        networkId: 'network-1',
        name: 'Test School',
        slug: 'test-school',
      });
      expect(result.valid).toBe(true);
    });

    it('should fail for missing networkId', () => {
      const result = validateCreateSchool({
        networkId: '',
        name: 'Test School',
        slug: 'test-school',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'networkId' && e.code === 'REQUIRED')).toBe(true);
    });

    it('should fail for missing name', () => {
      const result = validateCreateSchool({
        networkId: 'network-1',
        name: '',
        slug: 'test-school',
      });
      expect(result.valid).toBe(false);
    });

    it('should fail for missing slug', () => {
      const result = validateCreateSchool({
        networkId: 'network-1',
        name: 'Test School',
        slug: '',
      });
      expect(result.valid).toBe(false);
    });

    it('should fail for invalid email', () => {
      const result = validateCreateSchool({
        networkId: 'network-1',
        name: 'Test School',
        slug: 'test-school',
        email: 'invalid-email',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'email' && e.code === 'INVALID_EMAIL')).toBe(true);
    });

    it('should pass for valid email', () => {
      const result = validateCreateSchool({
        networkId: 'network-1',
        name: 'Test School',
        slug: 'test-school',
        email: 'school@example.com',
      });
      expect(result.valid).toBe(true);
    });

    it('should fail for invalid phone', () => {
      const result = validateCreateSchool({
        networkId: 'network-1',
        name: 'Test School',
        slug: 'test-school',
        phone: 'not a phone!@#',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'phone' && e.code === 'INVALID_PHONE')).toBe(true);
    });

    it('should pass for valid phone formats', () => {
      const validPhones = ['+55 11 98765-4321', '(11) 98765-4321', '11987654321'];
      for (const phone of validPhones) {
        const result = validateCreateSchool({
          networkId: 'network-1',
          name: 'Test School',
          slug: 'test-school',
          phone,
        });
        expect(result.valid).toBe(true);
      }
    });
  });

  describe('validateUpdateSchool', () => {
    it('should pass for valid update', () => {
      const result = validateUpdateSchool({
        name: 'Updated School',
      });
      expect(result.valid).toBe(true);
    });

    it('should pass for empty update', () => {
      const result = validateUpdateSchool({});
      expect(result.valid).toBe(true);
    });

    it('should fail for invalid email', () => {
      const result = validateUpdateSchool({
        email: 'invalid',
      });
      expect(result.valid).toBe(false);
    });

    it('should fail for invalid phone', () => {
      const result = validateUpdateSchool({
        phone: 'invalid!@#',
      });
      expect(result.valid).toBe(false);
    });
  });

  describe('validateCreateStudent', () => {
    it('should pass for valid data', () => {
      const result = validateCreateStudent({
        schoolId: 'school-1',
        firstName: 'John',
        lastName: 'Doe',
      });
      expect(result.valid).toBe(true);
    });

    it('should fail for missing schoolId', () => {
      const result = validateCreateStudent({
        schoolId: '',
        firstName: 'John',
        lastName: 'Doe',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'schoolId')).toBe(true);
    });

    it('should fail for missing firstName', () => {
      const result = validateCreateStudent({
        schoolId: 'school-1',
        firstName: '',
        lastName: 'Doe',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'firstName')).toBe(true);
    });

    it('should fail for missing lastName', () => {
      const result = validateCreateStudent({
        schoolId: 'school-1',
        firstName: 'John',
        lastName: '',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'lastName')).toBe(true);
    });

    it('should fail for firstName too long', () => {
      const result = validateCreateStudent({
        schoolId: 'school-1',
        firstName: 'A'.repeat(101),
        lastName: 'Doe',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'firstName' && e.code === 'MAX_LENGTH')).toBe(true);
    });

    it('should fail for invalid email', () => {
      const result = validateCreateStudent({
        schoolId: 'school-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'invalid-email',
      });
      expect(result.valid).toBe(false);
    });

    it('should pass for valid email', () => {
      const result = validateCreateStudent({
        schoolId: 'school-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
      });
      expect(result.valid).toBe(true);
    });

    it('should fail for invalid guardian email', () => {
      const result = validateCreateStudent({
        schoolId: 'school-1',
        firstName: 'John',
        lastName: 'Doe',
        guardianEmail: 'invalid',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'guardianEmail')).toBe(true);
    });

    it('should fail for invalid guardian phone', () => {
      const result = validateCreateStudent({
        schoolId: 'school-1',
        firstName: 'John',
        lastName: 'Doe',
        guardianPhone: 'invalid!@#',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'guardianPhone')).toBe(true);
    });

    it('should fail for invalid birth date', () => {
      const result = validateCreateStudent({
        schoolId: 'school-1',
        firstName: 'John',
        lastName: 'Doe',
        birthDate: 'not-a-date',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'birthDate')).toBe(true);
    });

    it('should pass for valid birth date', () => {
      const result = validateCreateStudent({
        schoolId: 'school-1',
        firstName: 'John',
        lastName: 'Doe',
        birthDate: '2010-05-15',
      });
      expect(result.valid).toBe(true);
    });

    it('should pass for Date object birth date', () => {
      const result = validateCreateStudent({
        schoolId: 'school-1',
        firstName: 'John',
        lastName: 'Doe',
        birthDate: new Date('2010-05-15'),
      });
      expect(result.valid).toBe(true);
    });
  });

  describe('validateUpdateStudent', () => {
    it('should pass for valid update', () => {
      const result = validateUpdateStudent({
        firstName: 'Jane',
      });
      expect(result.valid).toBe(true);
    });

    it('should pass for empty update', () => {
      const result = validateUpdateStudent({});
      expect(result.valid).toBe(true);
    });

    it('should fail for firstName too long', () => {
      const result = validateUpdateStudent({
        firstName: 'A'.repeat(101),
      });
      expect(result.valid).toBe(false);
    });

    it('should fail for invalid email', () => {
      const result = validateUpdateStudent({
        email: 'invalid',
      });
      expect(result.valid).toBe(false);
    });

    it('should pass for null email (clearing field)', () => {
      const result = validateUpdateStudent({
        email: null as any,
      });
      expect(result.valid).toBe(true);
    });
  });

  describe('validateCreateTeacher', () => {
    it('should pass for valid data', () => {
      const result = validateCreateTeacher({
        schoolId: 'school-1',
        firstName: 'Maria',
        lastName: 'Silva',
      });
      expect(result.valid).toBe(true);
    });

    it('should fail for missing schoolId', () => {
      const result = validateCreateTeacher({
        schoolId: '',
        firstName: 'Maria',
        lastName: 'Silva',
      });
      expect(result.valid).toBe(false);
    });

    it('should fail for missing firstName', () => {
      const result = validateCreateTeacher({
        schoolId: 'school-1',
        firstName: '',
        lastName: 'Silva',
      });
      expect(result.valid).toBe(false);
    });

    it('should fail for missing lastName', () => {
      const result = validateCreateTeacher({
        schoolId: 'school-1',
        firstName: 'Maria',
        lastName: '',
      });
      expect(result.valid).toBe(false);
    });

    it('should fail for invalid email', () => {
      const result = validateCreateTeacher({
        schoolId: 'school-1',
        firstName: 'Maria',
        lastName: 'Silva',
        email: 'invalid',
      });
      expect(result.valid).toBe(false);
    });

    it('should fail for invalid phone', () => {
      const result = validateCreateTeacher({
        schoolId: 'school-1',
        firstName: 'Maria',
        lastName: 'Silva',
        phone: 'invalid!@#',
      });
      expect(result.valid).toBe(false);
    });

    it('should pass with all optional fields', () => {
      const result = validateCreateTeacher({
        schoolId: 'school-1',
        firstName: 'Maria',
        lastName: 'Silva',
        email: 'maria@school.com',
        phone: '+55 11 98765-4321',
        specialization: 'Mathematics',
        employmentType: 'FULL_TIME',
      });
      expect(result.valid).toBe(true);
    });
  });

  describe('validateUpdateTeacher', () => {
    it('should pass for valid update', () => {
      const result = validateUpdateTeacher({
        firstName: 'Updated',
      });
      expect(result.valid).toBe(true);
    });

    it('should pass for empty update', () => {
      const result = validateUpdateTeacher({});
      expect(result.valid).toBe(true);
    });

    it('should fail for firstName too long', () => {
      const result = validateUpdateTeacher({
        firstName: 'A'.repeat(101),
      });
      expect(result.valid).toBe(false);
    });

    it('should fail for invalid email', () => {
      const result = validateUpdateTeacher({
        email: 'invalid',
      });
      expect(result.valid).toBe(false);
    });

    it('should pass for null email (clearing field)', () => {
      const result = validateUpdateTeacher({
        email: null as any,
      });
      expect(result.valid).toBe(true);
    });

    it('should fail for invalid phone', () => {
      const result = validateUpdateTeacher({
        phone: 'invalid!@#',
      });
      expect(result.valid).toBe(false);
    });

    it('should pass for null phone (clearing field)', () => {
      const result = validateUpdateTeacher({
        phone: null as any,
      });
      expect(result.valid).toBe(true);
    });
  });

  describe('Multiple Errors', () => {
    it('should collect all validation errors', () => {
      const result = validateCreateStudent({
        schoolId: '',
        firstName: '',
        lastName: '',
        email: 'invalid',
        guardianEmail: 'invalid',
      });

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(3);
    });

    it('should have unique error codes', () => {
      const result = validateCreateSchoolNetwork({
        name: '',
        slug: '',
      });

      const errorFields = result.errors.map((e) => e.field);
      expect(errorFields).toContain('name');
      expect(errorFields).toContain('slug');
    });
  });
});
