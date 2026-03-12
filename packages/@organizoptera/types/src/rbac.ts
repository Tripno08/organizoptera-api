/**
 * @module @organizoptera/types/rbac
 * @description RBAC (Role-Based Access Control) types
 */

import type { UserId, RoleId, PermissionId, SchoolNetworkId, SchoolId } from './branded.js';

// ============================================================================
// Permission Types
// ============================================================================

/**
 * Resource types that can be protected
 */
export type ResourceType =
  | 'school_network'
  | 'school'
  | 'school_year'
  | 'grade'
  | 'classroom'
  | 'student'
  | 'teacher'
  | 'enrollment'
  | 'user'
  | 'role'
  | 'permission'
  | 'settings'
  | 'report'
  | 'audit_log';

/**
 * Actions that can be performed on resources
 */
export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'manage' | '*';

/**
 * Permission scope
 */
export type PermissionScope =
  | 'own' // Only own resources
  | 'school' // Within same school
  | 'network' // Within same network
  | 'global'; // All resources (super admin)

/**
 * Permission definition
 */
export interface Permission {
  id: PermissionId;
  resource: ResourceType;
  action: PermissionAction;
  scope: PermissionScope;
  description?: string;
  conditions?: PermissionConditions;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Permission conditions for fine-grained access control
 */
export interface PermissionConditions {
  /** Only allow if resource status matches */
  status?: string[];
  /** Only allow for specific shifts */
  shift?: string[];
  /** Only allow for specific education levels */
  educationLevel?: string[];
  /** Custom condition expression */
  expression?: string;
}

// ============================================================================
// Role Types
// ============================================================================

/**
 * Built-in role types
 */
export type BuiltInRole =
  | 'SUPER_ADMIN' // Full system access
  | 'NETWORK_ADMIN' // Network-level admin
  | 'SCHOOL_ADMIN' // School-level admin
  | 'COORDINATOR' // Academic coordinator
  | 'TEACHER' // Teacher role
  | 'STUDENT' // Student role
  | 'GUARDIAN' // Parent/guardian role
  | 'ANALYST' // Read-only analytics
  | 'SUPPORT'; // Support staff

/**
 * Role definition
 */
export interface Role {
  id: RoleId;
  name: string;
  slug: string;
  description?: string;
  type: BuiltInRole | 'CUSTOM';
  permissions: PermissionId[];
  parentRoleId?: RoleId;
  isSystem: boolean;
  networkId?: SchoolNetworkId; // NULL = global role
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Role with resolved permissions
 */
export interface RoleWithPermissions extends Role {
  resolvedPermissions: Permission[];
}

// ============================================================================
// User Role Assignment
// ============================================================================

/**
 * User-Role-Scope assignment
 */
export interface UserRoleAssignment {
  id: string;
  userId: UserId;
  roleId: RoleId;
  networkId?: SchoolNetworkId;
  schoolId?: SchoolId;
  assignedAt: Date;
  assignedBy?: UserId;
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
}

/**
 * User with all role assignments
 */
export interface UserWithRoles {
  userId: UserId;
  assignments: UserRoleAssignment[];
  effectivePermissions: Permission[];
}

// ============================================================================
// Permission Check Types
// ============================================================================

/**
 * Permission check request
 */
export interface PermissionCheckRequest {
  userId: UserId;
  resource: ResourceType;
  action: PermissionAction;
  resourceId?: string;
  networkId?: SchoolNetworkId;
  schoolId?: SchoolId;
}

/**
 * Permission check result
 */
export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  matchedPermission?: Permission;
  matchedRole?: Role;
}

// ============================================================================
// RBAC Service Interface
// ============================================================================

/**
 * RBAC Service interface
 */
export interface RBACService {
  /** Check if user has permission */
  checkPermission(request: PermissionCheckRequest): Promise<PermissionCheckResult>;

  /** Get user's effective permissions */
  getUserPermissions(
    userId: UserId,
    networkId?: SchoolNetworkId,
    schoolId?: SchoolId
  ): Promise<Permission[]>;

  /** Get user's roles */
  getUserRoles(
    userId: UserId,
    networkId?: SchoolNetworkId,
    schoolId?: SchoolId
  ): Promise<RoleWithPermissions[]>;

  /** Assign role to user */
  assignRole(
    userId: UserId,
    roleId: RoleId,
    assignedBy: UserId,
    options?: {
      networkId?: SchoolNetworkId;
      schoolId?: SchoolId;
      expiresAt?: Date;
    }
  ): Promise<UserRoleAssignment>;

  /** Remove role from user */
  removeRole(userId: UserId, roleId: RoleId, networkId?: SchoolNetworkId): Promise<void>;

  /** Invalidate permission cache for user */
  invalidateCache(userId: UserId): Promise<void>;
}

// ============================================================================
// RBAC Configuration
// ============================================================================

/**
 * RBAC configuration
 */
export interface RBACConfig {
  /** Enable permission caching */
  cacheEnabled: boolean;
  /** Cache TTL in seconds */
  cacheTtl: number;
  /** Enable audit logging for permission checks */
  auditEnabled: boolean;
  /** Allow super admin bypass */
  superAdminBypass: boolean;
}

/**
 * Default RBAC configuration
 */
export const DEFAULT_RBAC_CONFIG: RBACConfig = {
  cacheEnabled: true,
  cacheTtl: 300, // 5 minutes
  auditEnabled: true,
  superAdminBypass: true,
};
