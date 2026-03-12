/**
 * @organizoptera/types - Branded Types Tests
 */

import { describe, it, expect } from 'vitest';
import {
  schoolNetworkId,
  schoolId,
  schoolYearId,
  gradeId,
  classroomId,
  studentId,
  teacherId,
  enrollmentId,
  userId,
  roleId,
  permissionId,
  isValidUuid,
  assertValidUuid,
} from '../branded';

describe('Branded Types', () => {
  describe('ID Factory Functions', () => {
    it('should create valid SchoolNetworkId', () => {
      const id = schoolNetworkId('test-network-123');
      expect(id).toBe('test-network-123');
    });

    it('should create valid SchoolId', () => {
      const id = schoolId('test-school-456');
      expect(id).toBe('test-school-456');
    });

    it('should create valid SchoolYearId', () => {
      const id = schoolYearId('test-year-2025');
      expect(id).toBe('test-year-2025');
    });

    it('should create valid UserId', () => {
      const id = userId('test-user-789');
      expect(id).toBe('test-user-789');
    });

    it('should create valid RoleId', () => {
      const id = roleId('test-role-abc');
      expect(id).toBe('test-role-abc');
    });

    it('should create valid PermissionId', () => {
      const id = permissionId('test-permission-def');
      expect(id).toBe('test-permission-def');
    });

    it('should create valid TeacherId', () => {
      const id = teacherId('test-teacher-ghi');
      expect(id).toBe('test-teacher-ghi');
    });

    it('should create valid StudentId', () => {
      const id = studentId('test-student-xyz');
      expect(id).toBe('test-student-xyz');
    });

    it('should create valid ClassroomId', () => {
      const id = classroomId('test-classroom-jkl');
      expect(id).toBe('test-classroom-jkl');
    });

    it('should create valid EnrollmentId', () => {
      const id = enrollmentId('test-enrollment-mno');
      expect(id).toBe('test-enrollment-mno');
    });

    it('should create valid GradeId', () => {
      const id = gradeId('test-grade-stu');
      expect(id).toBe('test-grade-stu');
    });
  });

  describe('UUID Validation', () => {
    it('should validate correct UUIDs', () => {
      expect(isValidUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      expect(isValidUuid('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
    });

    it('should reject invalid UUIDs', () => {
      expect(isValidUuid('')).toBe(false);
      expect(isValidUuid('not-a-uuid')).toBe(false);
      expect(isValidUuid('550e8400-e29b-41d4-a716-44665544000')).toBe(false); // Too short
      expect(isValidUuid('550e8400-e29b-61d4-a716-446655440000')).toBe(false); // Invalid version
    });

    it('should reject non-string values', () => {
      expect(isValidUuid(123 as any)).toBe(false);
      expect(isValidUuid(null as any)).toBe(false);
      expect(isValidUuid(undefined as any)).toBe(false);
      expect(isValidUuid({} as any)).toBe(false);
    });
  });

  describe('assertValidUuid', () => {
    it('should not throw for valid UUIDs', () => {
      expect(() => assertValidUuid('550e8400-e29b-41d4-a716-446655440000', 'testId')).not.toThrow();
    });

    it('should throw for invalid UUIDs', () => {
      expect(() => assertValidUuid('invalid', 'testId')).toThrow('Invalid testId: expected UUID');
      expect(() => assertValidUuid(123 as any, 'testId')).toThrow('Invalid testId: expected UUID');
    });
  });
});
