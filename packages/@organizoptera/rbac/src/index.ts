/**
 * @module @organizoptera/rbac
 * @description Role-Based Access Control engine for Organizoptera
 *
 * This package provides:
 * - Permission checking with scope-based access control
 * - Role resolution with inheritance
 * - High-level RBAC service
 * - Default role configurations
 */

// Constants and defaults
export * from './constants.js';

// Permission checking
export { PermissionChecker, createPermissionChecker } from './permission-checker.js';
export type { PermissionCheckerConfig, UserContext } from './permission-checker.js';

// Role resolution
export { RoleResolver, createRoleResolver } from './role-resolver.js';
export type {
  RoleResolverConfig,
  RoleRepository,
  PermissionRepository,
  UserRoleAssignmentRepository,
} from './role-resolver.js';

// RBAC Service
export { OrganizopteraRBACService, createRBACService } from './rbac-service.js';
