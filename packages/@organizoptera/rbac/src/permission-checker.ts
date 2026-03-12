/**
 * @module @organizoptera/rbac/permission-checker
 * @description Permission checking logic for RBAC
 */

import type {
  Permission,
  PermissionCheckRequest,
  PermissionCheckResult,
  PermissionAction,
  PermissionScope,
  ResourceType,
  Role,
  UserId,
  SchoolNetworkId,
  SchoolId,
} from '@organizoptera/types';
import { ACTION_WEIGHTS, SCOPE_HIERARCHY, NETWORK_SCOPED_RESOURCES } from './constants.js';

/**
 * Permission checker configuration
 */
export interface PermissionCheckerConfig {
  /** Enable super admin bypass (default: true) */
  superAdminBypass: boolean;
  /** Log permission checks for debugging */
  debug?: boolean;
}

const DEFAULT_CONFIG: PermissionCheckerConfig = {
  superAdminBypass: true,
  debug: false,
};

/**
 * User context for permission checking
 */
export interface UserContext {
  userId: UserId;
  permissions: Permission[];
  roles: Role[];
  networkId?: SchoolNetworkId;
  schoolId?: SchoolId;
  /** Custom attributes for ABAC (Attribute-Based Access Control) */
  attributes?: Record<string, unknown>;
}

/**
 * Permission Checker class
 *
 * Handles permission checking logic with support for:
 * - Role hierarchy
 * - Permission inheritance
 * - Scope-based access (global, network, school, own)
 * - Custom conditions
 */
export class PermissionChecker {
  private config: PermissionCheckerConfig;

  constructor(config: Partial<PermissionCheckerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Check if user has permission for a specific action on a resource
   */
  check(context: UserContext, request: PermissionCheckRequest): PermissionCheckResult {
    // Super admin bypass
    if (this.config.superAdminBypass && this.isSuperAdmin(context)) {
      return {
        allowed: true,
        reason: 'Super admin bypass',
      };
    }

    // Find matching permission
    const matchedPermission = this.findMatchingPermission(context, request);

    if (matchedPermission) {
      return {
        allowed: true,
        reason: 'Permission granted',
        matchedPermission,
        matchedRole: this.findRoleWithPermission(context, matchedPermission),
      };
    }

    return {
      allowed: false,
      reason: this.getDenialReason(context, request),
    };
  }

  /**
   * Check if user has any of the specified permissions
   */
  checkAny(context: UserContext, requests: PermissionCheckRequest[]): PermissionCheckResult {
    for (const request of requests) {
      const result = this.check(context, request);
      if (result.allowed) {
        return result;
      }
    }

    return {
      allowed: false,
      reason: 'None of the required permissions found',
    };
  }

  /**
   * Check if user has all of the specified permissions
   */
  checkAll(context: UserContext, requests: PermissionCheckRequest[]): PermissionCheckResult {
    const results: PermissionCheckResult[] = [];

    for (const request of requests) {
      const result = this.check(context, request);
      results.push(result);
      if (!result.allowed) {
        return {
          allowed: false,
          reason: `Missing permission: ${request.resource}:${request.action}`,
        };
      }
    }

    return {
      allowed: true,
      reason: 'All permissions granted',
    };
  }

  /**
   * Get all permissions that match a resource
   */
  getPermissionsForResource(context: UserContext, resource: ResourceType): Permission[] {
    return context.permissions.filter(
      (p) => p.resource === resource || this.isWildcardMatch(p.resource, resource)
    );
  }

  /**
   * Check if user is super admin
   */
  private isSuperAdmin(context: UserContext): boolean {
    return context.roles.some((role) => role.type === 'SUPER_ADMIN');
  }

  /**
   * Find a permission that matches the request
   */
  private findMatchingPermission(
    context: UserContext,
    request: PermissionCheckRequest
  ): Permission | undefined {
    // Sort permissions by specificity (more specific first)
    const sortedPermissions = [...context.permissions].sort(
      (a, b) => this.getPermissionSpecificity(b) - this.getPermissionSpecificity(a)
    );

    for (const permission of sortedPermissions) {
      if (this.permissionMatches(permission, request, context)) {
        return permission;
      }
    }

    return undefined;
  }

  /**
   * Check if a permission matches the request
   */
  private permissionMatches(
    permission: Permission,
    request: PermissionCheckRequest,
    context: UserContext
  ): boolean {
    // Check resource match (including wildcards)
    if (!this.resourceMatches(permission.resource, request.resource)) {
      return false;
    }

    // Check action match (including wildcards and manage)
    if (!this.actionMatches(permission.action, request.action)) {
      return false;
    }

    // Check scope match
    if (!this.scopeMatches(permission.scope, request, context)) {
      return false;
    }

    // Check custom conditions
    if (permission.conditions && !this.conditionsMatch(permission.conditions, request, context)) {
      return false;
    }

    return true;
  }

  /**
   * Check if resource matches (with wildcard support)
   */
  private resourceMatches(permissionResource: ResourceType, requestResource: ResourceType): boolean {
    // Exact match
    if (permissionResource === requestResource) {
      return true;
    }

    // Wildcard not applicable for resources in current schema
    return false;
  }

  /**
   * Check if action matches (with wildcard and 'manage' support)
   */
  private actionMatches(permissionAction: PermissionAction, requestAction: PermissionAction): boolean {
    // Exact match
    if (permissionAction === requestAction) {
      return true;
    }

    // Wildcard matches all
    if (permissionAction === '*') {
      return true;
    }

    // 'manage' includes create, update, delete
    if (permissionAction === 'manage') {
      return ['create', 'update', 'delete'].includes(requestAction);
    }

    return false;
  }

  /**
   * Check if scope matches
   */
  private scopeMatches(
    permissionScope: PermissionScope,
    request: PermissionCheckRequest,
    context: UserContext
  ): boolean {
    const scopeLevel = SCOPE_HIERARCHY[permissionScope] ?? 0;
    const requiredLevel = this.getRequiredScopeLevel(request, context);

    // Higher scope level includes lower (global > network > school > own)
    return scopeLevel >= requiredLevel;
  }

  /**
   * Get the required scope level based on request context
   */
  private getRequiredScopeLevel(request: PermissionCheckRequest, context: UserContext): number {
    // If requesting specific network/school, determine required scope
    if (request.networkId) {
      // Check if user belongs to this network
      if (context.networkId && context.networkId !== request.networkId) {
        return SCOPE_HIERARCHY.global; // Requires global scope to access other networks
      }
      return SCOPE_HIERARCHY.network;
    }

    if (request.schoolId) {
      // Check if user belongs to this school
      if (context.schoolId && context.schoolId !== request.schoolId) {
        return SCOPE_HIERARCHY.network; // Requires at least network scope
      }
      return SCOPE_HIERARCHY.school;
    }

    // Resource-specific checks for 'own' scope
    if (request.resourceId && request.userId === context.userId) {
      return SCOPE_HIERARCHY.own;
    }

    // Default: require at least school scope for network-scoped resources
    if (NETWORK_SCOPED_RESOURCES.has(request.resource)) {
      return SCOPE_HIERARCHY.school;
    }

    return SCOPE_HIERARCHY.own;
  }

  /**
   * Check if custom conditions match
   */
  private conditionsMatch(
    conditions: NonNullable<Permission['conditions']>,
    _request: PermissionCheckRequest,
    context: UserContext
  ): boolean {
    // Status condition
    if (conditions.status && conditions.status.length > 0) {
      const resourceStatus = context.attributes?.['resourceStatus'] as string | undefined;
      if (resourceStatus && !conditions.status.includes(resourceStatus)) {
        return false;
      }
    }

    // Shift condition
    if (conditions.shift && conditions.shift.length > 0) {
      const shift = context.attributes?.['shift'] as string | undefined;
      if (shift && !conditions.shift.includes(shift)) {
        return false;
      }
    }

    // Education level condition
    if (conditions.educationLevel && conditions.educationLevel.length > 0) {
      const level = context.attributes?.['educationLevel'] as string | undefined;
      if (level && !conditions.educationLevel.includes(level)) {
        return false;
      }
    }

    // Custom expression (would require a simple expression evaluator)
    // Not implemented for now

    return true;
  }

  /**
   * Check if permission resource is a wildcard match
   */
  private isWildcardMatch(_permissionResource: string, _requestResource: string): boolean {
    // No wildcards in current schema
    return false;
  }

  /**
   * Get permission specificity for sorting
   */
  private getPermissionSpecificity(permission: Permission): number {
    let specificity = 0;

    // More specific action = higher specificity
    specificity += 100 - (ACTION_WEIGHTS[permission.action] ?? 0);

    // More specific scope = higher specificity
    specificity += 100 - (SCOPE_HIERARCHY[permission.scope] ?? 0);

    // Has conditions = more specific
    if (permission.conditions) {
      specificity += 50;
    }

    return specificity;
  }

  /**
   * Find the role that contains a permission
   */
  private findRoleWithPermission(context: UserContext, permission: Permission): Role | undefined {
    return context.roles.find((role) => role.permissions.includes(permission.id));
  }

  /**
   * Get a human-readable denial reason
   */
  private getDenialReason(context: UserContext, request: PermissionCheckRequest): string {
    const resource = request.resource;
    const action = request.action;

    if (context.permissions.length === 0) {
      return 'No permissions assigned';
    }

    const hasResourcePermission = context.permissions.some((p) => p.resource === resource);
    if (!hasResourcePermission) {
      return `No permissions for resource: ${resource}`;
    }

    const hasActionPermission = context.permissions.some(
      (p) => p.resource === resource && this.actionMatches(p.action, action)
    );
    if (!hasActionPermission) {
      return `No permission for action: ${action} on ${resource}`;
    }

    return `Insufficient scope for: ${action} on ${resource}`;
  }
}

/**
 * Create a permission checker with default configuration
 */
export function createPermissionChecker(
  config?: Partial<PermissionCheckerConfig>
): PermissionChecker {
  return new PermissionChecker(config);
}
