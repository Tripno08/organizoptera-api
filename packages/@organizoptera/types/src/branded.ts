/**
 * @module @organizoptera/types/branded
 * @description Branded types for type-safe IDs
 *
 * Branded types prevent mixing up IDs of different entity types.
 * Example: Cannot pass a StudentId where a TeacherId is expected.
 */

// Brand symbol for unique type discrimination
declare const brand: unique symbol;

/**
 * Branded type helper
 */
export type Branded<T, B extends string> = T & { readonly [brand]: B };

// ============================================================================
// Entity IDs
// ============================================================================

/** UUID for SchoolNetwork entity */
export type SchoolNetworkId = Branded<string, 'SchoolNetworkId'>;

/** UUID for School entity */
export type SchoolId = Branded<string, 'SchoolId'>;

/** UUID for SchoolYear entity */
export type SchoolYearId = Branded<string, 'SchoolYearId'>;

/** UUID for Grade entity */
export type GradeId = Branded<string, 'GradeId'>;

/** UUID for Classroom entity */
export type ClassroomId = Branded<string, 'ClassroomId'>;

/** UUID for Student entity */
export type StudentId = Branded<string, 'StudentId'>;

/** UUID for Teacher entity */
export type TeacherId = Branded<string, 'TeacherId'>;

/** UUID for Enrollment entity */
export type EnrollmentId = Branded<string, 'EnrollmentId'>;

/** UUID for User entity (from auth system) */
export type UserId = Branded<string, 'UserId'>;

/** UUID for Role entity */
export type RoleId = Branded<string, 'RoleId'>;

/** UUID for Permission entity */
export type PermissionId = Branded<string, 'PermissionId'>;

// ============================================================================
// ID Creation Helpers
// ============================================================================

/**
 * Create a SchoolNetworkId from a string
 */
export function schoolNetworkId(id: string): SchoolNetworkId {
  return id as SchoolNetworkId;
}

/**
 * Create a SchoolId from a string
 */
export function schoolId(id: string): SchoolId {
  return id as SchoolId;
}

/**
 * Create a SchoolYearId from a string
 */
export function schoolYearId(id: string): SchoolYearId {
  return id as SchoolYearId;
}

/**
 * Create a GradeId from a string
 */
export function gradeId(id: string): GradeId {
  return id as GradeId;
}

/**
 * Create a ClassroomId from a string
 */
export function classroomId(id: string): ClassroomId {
  return id as ClassroomId;
}

/**
 * Create a StudentId from a string
 */
export function studentId(id: string): StudentId {
  return id as StudentId;
}

/**
 * Create a TeacherId from a string
 */
export function teacherId(id: string): TeacherId {
  return id as TeacherId;
}

/**
 * Create an EnrollmentId from a string
 */
export function enrollmentId(id: string): EnrollmentId {
  return id as EnrollmentId;
}

/**
 * Create a UserId from a string
 */
export function userId(id: string): UserId {
  return id as UserId;
}

/**
 * Create a RoleId from a string
 */
export function roleId(id: string): RoleId {
  return id as RoleId;
}

/**
 * Create a PermissionId from a string
 */
export function permissionId(id: string): PermissionId {
  return id as PermissionId;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if a value is a valid UUID
 */
export function isValidUuid(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * Assert that a value is a valid UUID
 */
export function assertValidUuid(value: unknown, name: string): asserts value is string {
  if (!isValidUuid(value)) {
    throw new Error(`Invalid ${name}: expected UUID, got ${typeof value}`);
  }
}
