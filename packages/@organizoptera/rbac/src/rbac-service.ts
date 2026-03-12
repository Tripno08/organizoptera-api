/**
 * @module @organizoptera/rbac/rbac-service
 * @description High-level RBAC service implementation
 */

import type {
  RBACService,
  RBACConfig,
  PermissionCheckRequest,
  PermissionCheckResult,
  Permission,
  RoleWithPermissions,
  UserRoleAssignment,
  UserId,
  RoleId,
  SchoolNetworkId,
  SchoolId,
} from '@organizoptera/types';
import { DEFAULT_RBAC_CONFIG } from '@organizoptera/types';
import { PermissionChecker, UserContext } from './permission-checker.js';
import { RoleResolver, RoleRepository, PermissionRepository, UserRoleAssignmentRepository } from './role-resolver.js';

/**
 * RBAC Service implementation
 *
 * Provides a high-level API for authorization operations:
 * - Permission checking
 * - Role management
 * - Permission aggregation
 * - Cache management
 */
export class OrganizopteraRBACService implements RBACService {
  private config: RBACConfig;
  private checker: PermissionChecker;
  private resolver: RoleResolver;
  private onAssignRole?: (assignment: UserRoleAssignment) => Promise<void>;
  private onRemoveRole?: (userId: UserId, roleId: RoleId) => Promise<void>;

  constructor(
    roleRepo: RoleRepository,
    permissionRepo: PermissionRepository,
    assignmentRepo: UserRoleAssignmentRepository,
    config: Partial<RBACConfig> = {},
    callbacks?: {
      onAssignRole?: (assignment: UserRoleAssignment) => Promise<void>;
      onRemoveRole?: (userId: UserId, roleId: RoleId) => Promise<void>;
    }
  ) {
    this.config = { ...DEFAULT_RBAC_CONFIG, ...config };

    this.checker = new PermissionChecker({
      superAdminBypass: this.config.superAdminBypass,
    });

    this.resolver = new RoleResolver(roleRepo, permissionRepo, assignmentRepo, {
      resolveInheritance: true,
      enableCache: this.config.cacheEnabled,
      cacheTtl: this.config.cacheTtl,
    });

    this.onAssignRole = callbacks?.onAssignRole;
    this.onRemoveRole = callbacks?.onRemoveRole;
  }

  /**
   * Check if user has permission for a specific action
   */
  async checkPermission(request: PermissionCheckRequest): Promise<PermissionCheckResult> {
    const { userId, networkId, schoolId } = request;

    // Get user's roles and permissions
    const roles = await this.resolver.getUserRoles(userId, networkId, schoolId);
    const permissions = await this.resolver.getUserPermissions(userId, networkId, schoolId);

    // Build user context
    const context: UserContext = {
      userId,
      permissions,
      roles,
      networkId,
      schoolId,
    };

    // Check permission
    const result = this.checker.check(context, request);

    // Log if audit is enabled
    if (this.config.auditEnabled) {
      this.logPermissionCheck(request, result);
    }

    return result;
  }

  /**
   * Get user's effective permissions
   */
  async getUserPermissions(
    userId: UserId,
    networkId?: SchoolNetworkId,
    schoolId?: SchoolId
  ): Promise<Permission[]> {
    return this.resolver.getUserPermissions(userId, networkId, schoolId);
  }

  /**
   * Get user's roles
   */
  async getUserRoles(
    userId: UserId,
    networkId?: SchoolNetworkId,
    schoolId?: SchoolId
  ): Promise<RoleWithPermissions[]> {
    return this.resolver.getUserRoles(userId, networkId, schoolId);
  }

  /**
   * Assign role to user
   */
  async assignRole(
    userId: UserId,
    roleId: RoleId,
    assignedBy: UserId,
    options?: {
      networkId?: SchoolNetworkId;
      schoolId?: SchoolId;
      expiresAt?: Date;
    }
  ): Promise<UserRoleAssignment> {
    const assignment: UserRoleAssignment = {
      id: crypto.randomUUID(),
      userId,
      roleId,
      networkId: options?.networkId,
      schoolId: options?.schoolId,
      assignedAt: new Date(),
      assignedBy,
      expiresAt: options?.expiresAt,
    };

    // Call callback to persist
    if (this.onAssignRole) {
      await this.onAssignRole(assignment);
    }

    // Invalidate cache
    if (this.config.cacheEnabled) {
      this.resolver.invalidateCache(userId);
    }

    return assignment;
  }

  /**
   * Remove role from user
   */
  async removeRole(userId: UserId, roleId: RoleId, _networkId?: SchoolNetworkId): Promise<void> {
    // Call callback to persist
    if (this.onRemoveRole) {
      await this.onRemoveRole(userId, roleId);
    }

    // Invalidate cache
    if (this.config.cacheEnabled) {
      this.resolver.invalidateCache(userId);
    }
  }

  /**
   * Invalidate permission cache for user
   */
  async invalidateCache(userId: UserId): Promise<void> {
    this.resolver.invalidateCache(userId);
  }

  /**
   * Check multiple permissions at once
   */
  async checkPermissions(
    userId: UserId,
    requests: Omit<PermissionCheckRequest, 'userId'>[]
  ): Promise<Map<string, PermissionCheckResult>> {
    const results = new Map<string, PermissionCheckResult>();

    // Get user context once
    const roles = await this.resolver.getUserRoles(userId);
    const permissions = await this.resolver.getUserPermissions(userId);

    const context: UserContext = {
      userId,
      permissions,
      roles,
    };

    for (const request of requests) {
      const fullRequest: PermissionCheckRequest = { ...request, userId };
      const key = `${request.resource}:${request.action}`;
      results.set(key, this.checker.check(context, fullRequest));
    }

    return results;
  }

  /**
   * Get highest role for user
   */
  async getHighestRole(userId: UserId): Promise<RoleWithPermissions | null> {
    const roles = await this.resolver.getUserRoles(userId);
    return this.resolver.getHighestRole(roles);
  }

  /**
   * Check if user is super admin
   */
  async isSuperAdmin(userId: UserId): Promise<boolean> {
    const roles = await this.resolver.getUserRoles(userId);
    return roles.some((role) => role.type === 'SUPER_ADMIN');
  }

  /**
   * Log permission check for audit
   */
  private logPermissionCheck(request: PermissionCheckRequest, result: PermissionCheckResult): void {
    // This would integrate with audit logging
    // For now, just console log in debug mode
    if (process.env.DEBUG) {
      console.log('[RBAC]', {
        userId: request.userId,
        resource: request.resource,
        action: request.action,
        allowed: result.allowed,
        reason: result.reason,
      });
    }
  }
}

/**
 * Create an RBAC service instance
 */
export function createRBACService(
  roleRepo: RoleRepository,
  permissionRepo: PermissionRepository,
  assignmentRepo: UserRoleAssignmentRepository,
  config?: Partial<RBACConfig>,
  callbacks?: {
    onAssignRole?: (assignment: UserRoleAssignment) => Promise<void>;
    onRemoveRole?: (userId: UserId, roleId: RoleId) => Promise<void>;
  }
): OrganizopteraRBACService {
  return new OrganizopteraRBACService(roleRepo, permissionRepo, assignmentRepo, config, callbacks);
}
