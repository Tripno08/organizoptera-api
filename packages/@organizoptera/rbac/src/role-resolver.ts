/**
 * @module @organizoptera/rbac/role-resolver
 * @description Role resolution and permission aggregation
 */

import type {
  Role,
  RoleWithPermissions,
  Permission,
  UserRoleAssignment,
  UserId,
  RoleId,
  SchoolNetworkId,
  SchoolId,
} from '@organizoptera/types';
import { ROLE_HIERARCHY } from './constants.js';

/**
 * Role repository interface for data access
 */
export interface RoleRepository {
  /** Get role by ID */
  findById(id: RoleId): Promise<Role | null>;
  /** Get roles by IDs */
  findByIds(ids: RoleId[]): Promise<Role[]>;
  /** Get all roles for a network */
  findByNetwork(networkId: SchoolNetworkId): Promise<Role[]>;
  /** Get system (global) roles */
  findSystemRoles(): Promise<Role[]>;
}

/**
 * Permission repository interface
 */
export interface PermissionRepository {
  /** Get permissions by IDs */
  findByIds(ids: string[]): Promise<Permission[]>;
}

/**
 * User role assignment repository interface
 */
export interface UserRoleAssignmentRepository {
  /** Get all role assignments for a user */
  findByUser(userId: UserId): Promise<UserRoleAssignment[]>;
  /** Get assignments filtered by scope */
  findByUserAndScope(
    userId: UserId,
    networkId?: SchoolNetworkId,
    schoolId?: SchoolId
  ): Promise<UserRoleAssignment[]>;
}

/**
 * Role resolver configuration
 */
export interface RoleResolverConfig {
  /** Enable role inheritance resolution */
  resolveInheritance: boolean;
  /** Cache resolved roles */
  enableCache: boolean;
  /** Cache TTL in seconds */
  cacheTtl: number;
}

const DEFAULT_CONFIG: RoleResolverConfig = {
  resolveInheritance: true,
  enableCache: true,
  cacheTtl: 300, // 5 minutes
};

/**
 * Cached role resolution result
 */
interface CachedResult {
  roles: RoleWithPermissions[];
  permissions: Permission[];
  expires: number;
}

/**
 * Role Resolver
 *
 * Resolves user roles and aggregates permissions with support for:
 * - Role inheritance (parent roles)
 * - Scope-based filtering (network, school)
 * - Permission deduplication
 * - Caching
 */
export class RoleResolver {
  private config: RoleResolverConfig;
  private roleRepo: RoleRepository;
  private permissionRepo: PermissionRepository;
  private assignmentRepo: UserRoleAssignmentRepository;
  private cache: Map<string, CachedResult> = new Map();

  constructor(
    roleRepo: RoleRepository,
    permissionRepo: PermissionRepository,
    assignmentRepo: UserRoleAssignmentRepository,
    config: Partial<RoleResolverConfig> = {}
  ) {
    this.roleRepo = roleRepo;
    this.permissionRepo = permissionRepo;
    this.assignmentRepo = assignmentRepo;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Get all roles for a user with resolved permissions
   */
  async getUserRoles(
    userId: UserId,
    networkId?: SchoolNetworkId,
    schoolId?: SchoolId
  ): Promise<RoleWithPermissions[]> {
    const cacheKey = this.getCacheKey(userId, networkId, schoolId);

    // Check cache
    if (this.config.enableCache) {
      const cached = this.cache.get(cacheKey);
      if (cached && cached.expires > Date.now()) {
        return cached.roles;
      }
    }

    // Get user's role assignments
    const assignments = await this.assignmentRepo.findByUserAndScope(userId, networkId, schoolId);

    // Filter out expired assignments
    const validAssignments = assignments.filter(
      (a) => !a.expiresAt || a.expiresAt > new Date()
    );

    // Get role IDs
    const roleIds = validAssignments.map((a) => a.roleId);

    // Fetch roles
    const roles = await this.roleRepo.findByIds(roleIds);

    // Resolve inheritance and permissions
    const resolvedRoles = await Promise.all(
      roles.map((role) => this.resolveRoleWithPermissions(role))
    );

    // Cache result
    if (this.config.enableCache) {
      const permissions = this.aggregatePermissions(resolvedRoles);
      this.cache.set(cacheKey, {
        roles: resolvedRoles,
        permissions,
        expires: Date.now() + this.config.cacheTtl * 1000,
      });
    }

    return resolvedRoles;
  }

  /**
   * Get aggregated permissions for a user
   */
  async getUserPermissions(
    userId: UserId,
    networkId?: SchoolNetworkId,
    schoolId?: SchoolId
  ): Promise<Permission[]> {
    const cacheKey = this.getCacheKey(userId, networkId, schoolId);

    // Check cache
    if (this.config.enableCache) {
      const cached = this.cache.get(cacheKey);
      if (cached && cached.expires > Date.now()) {
        return cached.permissions;
      }
    }

    // Get roles (which will also cache)
    const roles = await this.getUserRoles(userId, networkId, schoolId);

    // Aggregate and deduplicate permissions
    return this.aggregatePermissions(roles);
  }

  /**
   * Resolve a role with all its permissions (including inherited)
   */
  async resolveRoleWithPermissions(role: Role): Promise<RoleWithPermissions> {
    const allPermissionIds = new Set<string>(role.permissions);

    // Resolve parent roles if inheritance is enabled
    if (this.config.resolveInheritance && role.parentRoleId) {
      const inheritedPermissions = await this.resolveInheritedPermissions(role.parentRoleId);
      for (const p of inheritedPermissions) {
        allPermissionIds.add(p.id);
      }
    }

    // Fetch all permissions
    const permissions = await this.permissionRepo.findByIds([...allPermissionIds]);

    return {
      ...role,
      resolvedPermissions: permissions,
    };
  }

  /**
   * Resolve inherited permissions from parent roles
   */
  private async resolveInheritedPermissions(
    parentRoleId: RoleId,
    visited: Set<string> = new Set()
  ): Promise<Permission[]> {
    // Prevent circular inheritance
    if (visited.has(parentRoleId)) {
      return [];
    }
    visited.add(parentRoleId);

    const parentRole = await this.roleRepo.findById(parentRoleId);
    if (!parentRole) {
      return [];
    }

    // Get parent's permissions
    const permissions = await this.permissionRepo.findByIds(parentRole.permissions);

    // Recursively get grandparent permissions
    if (parentRole.parentRoleId) {
      const inheritedPermissions = await this.resolveInheritedPermissions(
        parentRole.parentRoleId,
        visited
      );
      return [...permissions, ...inheritedPermissions];
    }

    return permissions;
  }

  /**
   * Aggregate permissions from multiple roles
   */
  private aggregatePermissions(roles: RoleWithPermissions[]): Permission[] {
    const permissionMap = new Map<string, Permission>();

    for (const role of roles) {
      for (const permission of role.resolvedPermissions) {
        // Use permission ID as key for deduplication
        if (!permissionMap.has(permission.id)) {
          permissionMap.set(permission.id, permission);
        }
      }
    }

    return [...permissionMap.values()];
  }

  /**
   * Get the highest-ranked role for a user
   */
  getHighestRole<T extends Role>(roles: T[]): T | null {
    if (roles.length === 0) return null;

    return roles.reduce((highest, current) => {
      const currentRank = ROLE_HIERARCHY[current.type as keyof typeof ROLE_HIERARCHY] ?? 0;
      const highestRank = ROLE_HIERARCHY[highest.type as keyof typeof ROLE_HIERARCHY] ?? 0;
      return currentRank > highestRank ? current : highest;
    });
  }

  /**
   * Check if user has a specific role
   */
  async hasRole(userId: UserId, roleId: RoleId): Promise<boolean> {
    const assignments = await this.assignmentRepo.findByUser(userId);
    return assignments.some(
      (a) => a.roleId === roleId && (!a.expiresAt || a.expiresAt > new Date())
    );
  }

  /**
   * Invalidate cache for a user
   */
  invalidateCache(userId: UserId): void {
    // Remove all cache entries for this user
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${userId}:`)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear entire cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Generate cache key
   */
  private getCacheKey(userId: UserId, networkId?: SchoolNetworkId, schoolId?: SchoolId): string {
    return `${userId}:${networkId || 'global'}:${schoolId || 'all'}`;
  }
}

/**
 * Create a role resolver
 */
export function createRoleResolver(
  roleRepo: RoleRepository,
  permissionRepo: PermissionRepository,
  assignmentRepo: UserRoleAssignmentRepository,
  config?: Partial<RoleResolverConfig>
): RoleResolver {
  return new RoleResolver(roleRepo, permissionRepo, assignmentRepo, config);
}
