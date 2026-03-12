/**
 * @module @organizoptera/types/dto
 * @description Data Transfer Objects for API operations
 */

import type {
  NetworkStatus,
  SchoolStatus,
  YearStatus,
  ClassroomStatus,
  Shift,
  Gender,
  StudentStatus,
  EmploymentType,
  TeacherStatus,
  EnrollmentStatus,
} from './entities.js';

// ============================================================================
// SchoolNetwork DTOs
// ============================================================================

export interface CreateSchoolNetworkDto {
  name: string;
  slug: string;
  domain?: string;
  status?: NetworkStatus;
  settings?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface UpdateSchoolNetworkDto {
  name?: string;
  slug?: string;
  domain?: string;
  status?: NetworkStatus;
  settings?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// School DTOs
// ============================================================================

export interface CreateSchoolDto {
  networkId: string;
  name: string;
  slug: string;
  code?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  phone?: string;
  email?: string;
  principalName?: string;
  status?: SchoolStatus;
  settings?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface UpdateSchoolDto {
  name?: string;
  slug?: string;
  code?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  phone?: string;
  email?: string;
  principalName?: string;
  status?: SchoolStatus;
  settings?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// SchoolYear DTOs
// ============================================================================

export interface CreateSchoolYearDto {
  schoolId: string;
  year: number;
  name: string;
  startDate: Date | string;
  endDate: Date | string;
  isCurrent?: boolean;
  status?: YearStatus;
}

export interface UpdateSchoolYearDto {
  year?: number;
  name?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  isCurrent?: boolean;
  status?: YearStatus;
}

// ============================================================================
// Grade DTOs
// ============================================================================

export interface CreateGradeDto {
  schoolId: string;
  name: string;
  code: string;
  sequenceOrder: number;
  educationLevel?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateGradeDto {
  name?: string;
  code?: string;
  sequenceOrder?: number;
  educationLevel?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Classroom DTOs
// ============================================================================

export interface CreateClassroomDto {
  schoolId: string;
  gradeId: string;
  schoolYearId: string;
  name: string;
  code: string;
  shift?: Shift;
  capacity?: number;
  room?: string;
  status?: ClassroomStatus;
  metadata?: Record<string, unknown>;
}

export interface UpdateClassroomDto {
  name?: string;
  code?: string;
  shift?: Shift;
  capacity?: number;
  room?: string;
  status?: ClassroomStatus;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Student DTOs
// ============================================================================

export interface CreateStudentDto {
  schoolId: string;
  firstName: string;
  lastName: string;
  email?: string;
  birthDate?: Date | string;
  gender?: Gender;
  studentCode?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianEmail?: string;
  address?: string;
  status?: StudentStatus;
  metadata?: Record<string, unknown>;
}

export interface UpdateStudentDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  birthDate?: Date | string;
  gender?: Gender;
  studentCode?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianEmail?: string;
  address?: string;
  status?: StudentStatus;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Teacher DTOs
// ============================================================================

export interface CreateTeacherDto {
  schoolId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  specialization?: string;
  employmentType?: EmploymentType;
  status?: TeacherStatus;
  metadata?: Record<string, unknown>;
}

export interface UpdateTeacherDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  specialization?: string;
  employmentType?: EmploymentType;
  status?: TeacherStatus;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Enrollment DTOs
// ============================================================================

export interface CreateEnrollmentDto {
  studentId: string;
  classroomId: string;
  schoolYearId: string;
  enrollmentDate?: Date | string;
  status?: EnrollmentStatus;
  metadata?: Record<string, unknown>;
}

export interface UpdateEnrollmentDto {
  status?: EnrollmentStatus;
  metadata?: Record<string, unknown>;
}

export interface BulkEnrollmentDto {
  studentIds: string[];
  classroomId: string;
  schoolYearId: string;
}

// ============================================================================
// Teacher Assignment DTOs
// ============================================================================

export interface AssignTeacherDto {
  teacherId: string;
  classroomId: string;
  subject?: string;
  isMainTeacher?: boolean;
}

export interface UpdateTeacherAssignmentDto {
  subject?: string;
  isMainTeacher?: boolean;
}

// ============================================================================
// Query/Filter DTOs
// ============================================================================

export interface PaginationDto {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SchoolFilterDto extends PaginationDto {
  networkId?: string;
  status?: SchoolStatus;
  search?: string;
}

export interface StudentFilterDto extends PaginationDto {
  schoolId?: string;
  classroomId?: string;
  gradeId?: string;
  status?: StudentStatus;
  search?: string;
}

export interface TeacherFilterDto extends PaginationDto {
  schoolId?: string;
  classroomId?: string;
  status?: TeacherStatus;
  specialization?: string;
  search?: string;
}

export interface ClassroomFilterDto extends PaginationDto {
  schoolId?: string;
  gradeId?: string;
  schoolYearId?: string;
  shift?: Shift;
  status?: ClassroomStatus;
}

// ============================================================================
// Response DTOs
// ============================================================================

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
