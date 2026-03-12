/**
 * @module @organizoptera/types/events
 * @description Domain events for Organizoptera
 *
 * Events follow DPS Level 8: Orchestration Protocol
 */

import type {
  SchoolNetworkId,
  SchoolId,
  SchoolYearId,
  ClassroomId,
  StudentId,
  TeacherId,
  EnrollmentId,
  UserId,
} from './branded.js';

// ============================================================================
// Base Event Types
// ============================================================================

/**
 * Base domain event
 */
export interface DomainEvent<T = unknown> {
  id: string;
  type: string;
  source: 'organizoptera';
  timestamp: Date;
  correlationId?: string;
  causationId?: string;
  userId?: UserId;
  networkId?: SchoolNetworkId;
  schoolId?: SchoolId;
  payload: T;
  metadata?: Record<string, unknown>;
}

/**
 * Event types
 */
export type EventType =
  // SchoolNetwork events
  | 'school_network.created'
  | 'school_network.updated'
  | 'school_network.deleted'
  | 'school_network.status_changed'
  // School events
  | 'school.created'
  | 'school.updated'
  | 'school.deleted'
  | 'school.status_changed'
  // SchoolYear events
  | 'school_year.created'
  | 'school_year.updated'
  | 'school_year.activated'
  | 'school_year.completed'
  // Grade events
  | 'grade.created'
  | 'grade.updated'
  | 'grade.deleted'
  // Classroom events
  | 'classroom.created'
  | 'classroom.updated'
  | 'classroom.deleted'
  | 'classroom.status_changed'
  // Student events
  | 'student.created'
  | 'student.updated'
  | 'student.deleted'
  | 'student.status_changed'
  | 'student.enrolled'
  | 'student.transferred'
  // Teacher events
  | 'teacher.created'
  | 'teacher.updated'
  | 'teacher.deleted'
  | 'teacher.status_changed'
  | 'teacher.assigned'
  | 'teacher.unassigned'
  // RBAC events
  | 'role.assigned'
  | 'role.removed'
  | 'permission.granted'
  | 'permission.revoked';

// ============================================================================
// Specific Event Payloads
// ============================================================================

export interface SchoolNetworkCreatedPayload {
  networkId: SchoolNetworkId;
  name: string;
  slug: string;
}

export interface SchoolNetworkUpdatedPayload {
  networkId: SchoolNetworkId;
  changes: Record<string, { before: unknown; after: unknown }>;
}

export interface SchoolCreatedPayload {
  schoolId: SchoolId;
  networkId: SchoolNetworkId;
  name: string;
  slug: string;
}

export interface SchoolUpdatedPayload {
  schoolId: SchoolId;
  networkId: SchoolNetworkId;
  changes: Record<string, { before: unknown; after: unknown }>;
}

export interface StudentCreatedPayload {
  studentId: StudentId;
  schoolId: SchoolId;
  firstName: string;
  lastName: string;
}

export interface StudentEnrolledPayload {
  studentId: StudentId;
  enrollmentId: EnrollmentId;
  classroomId: ClassroomId;
  schoolYearId: SchoolYearId;
  enrollmentDate: Date;
}

export interface StudentTransferredPayload {
  studentId: StudentId;
  fromSchoolId: SchoolId;
  toSchoolId: SchoolId;
  transferDate: Date;
}

export interface TeacherCreatedPayload {
  teacherId: TeacherId;
  schoolId: SchoolId;
  firstName: string;
  lastName: string;
}

export interface TeacherAssignedPayload {
  teacherId: TeacherId;
  classroomId: ClassroomId;
  subject?: string;
  isMainTeacher: boolean;
}

export interface RoleAssignedPayload {
  userId: UserId;
  roleId: string;
  networkId?: SchoolNetworkId;
  schoolId?: SchoolId;
  assignedBy: UserId;
}

// ============================================================================
// Event Factory
// ============================================================================

/**
 * Create a domain event
 */
export function createDomainEvent<T>(
  type: EventType,
  payload: T,
  options?: {
    userId?: UserId;
    networkId?: SchoolNetworkId;
    schoolId?: SchoolId;
    correlationId?: string;
    causationId?: string;
    metadata?: Record<string, unknown>;
  }
): DomainEvent<T> {
  return {
    id: crypto.randomUUID(),
    type,
    source: 'organizoptera',
    timestamp: new Date(),
    payload,
    ...options,
  };
}

// ============================================================================
// Event Handler Types
// ============================================================================

/**
 * Event handler function
 */
export type EventHandler<T = unknown> = (event: DomainEvent<T>) => Promise<void>;

/**
 * Event subscription
 */
export interface EventSubscription {
  id: string;
  eventType: EventType | EventType[];
  handler: EventHandler;
  filter?: (event: DomainEvent) => boolean;
}

/**
 * Event bus interface
 */
export interface EventBus {
  /** Publish an event */
  publish<T>(event: DomainEvent<T>): Promise<void>;

  /** Subscribe to events */
  subscribe(subscription: EventSubscription): () => void;

  /** Unsubscribe by subscription ID */
  unsubscribe(subscriptionId: string): void;
}
