/**
 * @module @organizoptera/types/entities
 * @description Entity types derived from Prisma schema
 */

import type {
  SchoolNetworkId,
  SchoolId,
  SchoolYearId,
  GradeId,
  ClassroomId,
  StudentId,
  TeacherId,
  EnrollmentId,
} from './branded.js';

// ============================================================================
// Enums (matching Prisma enums)
// ============================================================================

export type NetworkStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'TRIAL';
export type SchoolStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
export type YearStatus = 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
export type ClassroomStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
export type Shift = 'MORNING' | 'AFTERNOON' | 'EVENING' | 'FULL_TIME';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
export type StudentStatus = 'ACTIVE' | 'INACTIVE' | 'TRANSFERRED' | 'GRADUATED';
export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACTOR' | 'SUBSTITUTE';
export type TeacherStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';
export type EnrollmentStatus = 'ACTIVE' | 'INACTIVE' | 'TRANSFERRED' | 'COMPLETED' | 'CANCELLED';

// ============================================================================
// Entity Types
// ============================================================================

/**
 * SchoolNetwork - Top-level organization (Rede Escolar)
 */
export interface SchoolNetwork {
  id: SchoolNetworkId;
  name: string;
  slug: string;
  domain: string | null;
  status: NetworkStatus;
  settings: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * School - Individual school within a network
 */
export interface School {
  id: SchoolId;
  networkId: SchoolNetworkId;
  name: string;
  slug: string;
  code: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string;
  phone: string | null;
  email: string | null;
  principalName: string | null;
  status: SchoolStatus;
  settings: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * SchoolYear - Academic year configuration
 */
export interface SchoolYear {
  id: SchoolYearId;
  schoolId: SchoolId;
  year: number;
  name: string;
  startDate: Date;
  endDate: Date;
  isCurrent: boolean;
  status: YearStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Grade - Grade level (1º ano, 2º ano, etc.)
 */
export interface Grade {
  id: GradeId;
  schoolId: SchoolId;
  name: string;
  code: string;
  sequenceOrder: number;
  educationLevel: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Classroom - Class/Turma (e.g., "1º Ano A")
 */
export interface Classroom {
  id: ClassroomId;
  schoolId: SchoolId;
  gradeId: GradeId;
  schoolYearId: SchoolYearId;
  name: string;
  code: string;
  shift: Shift;
  capacity: number;
  room: string | null;
  status: ClassroomStatus;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Student - Student entity
 */
export interface Student {
  id: StudentId;
  schoolId: SchoolId;
  firstName: string;
  lastName: string;
  email: string | null;
  birthDate: Date | null;
  gender: Gender | null;
  studentCode: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
  guardianEmail: string | null;
  address: string | null;
  status: StudentStatus;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Teacher - Teacher entity
 */
export interface Teacher {
  id: TeacherId;
  schoolId: SchoolId;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  specialization: string | null;
  employmentType: EmploymentType;
  status: TeacherStatus;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * TeacherClassroom - Teacher-Classroom assignment
 */
export interface TeacherClassroom {
  id: string;
  teacherId: TeacherId;
  classroomId: ClassroomId;
  subject: string | null;
  isMainTeacher: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Enrollment - Student enrollment in a classroom
 */
export interface Enrollment {
  id: EnrollmentId;
  studentId: StudentId;
  classroomId: ClassroomId;
  schoolYearId: SchoolYearId;
  enrollmentDate: Date;
  status: EnrollmentStatus;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Nested Types (for API responses with relations)
// ============================================================================

/**
 * SchoolNetwork with nested schools
 */
export interface SchoolNetworkWithSchools extends SchoolNetwork {
  schools: School[];
}

/**
 * School with all relations
 */
export interface SchoolWithRelations extends School {
  network?: SchoolNetwork;
  grades?: Grade[];
  classrooms?: Classroom[];
  teachers?: Teacher[];
  students?: Student[];
  schoolYears?: SchoolYear[];
}

/**
 * Classroom with nested relations
 */
export interface ClassroomWithRelations extends Classroom {
  school?: School;
  grade?: Grade;
  schoolYear?: SchoolYear;
  enrollments?: Enrollment[];
  teacherAssignments?: TeacherClassroom[];
}

/**
 * Student with enrollment info
 */
export interface StudentWithEnrollments extends Student {
  enrollments?: Enrollment[];
}

/**
 * Teacher with classroom assignments
 */
export interface TeacherWithAssignments extends Teacher {
  classroomAssignments?: TeacherClassroom[];
}
