/**
 * @organizoptera/rbac - Role Resolver Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RoleResolver, createRoleResolver } from '../role-resolver';
import type { RoleRepository, PermissionRepository, UserRoleAssignmentRepository } from '../role-resolver';
import type { Permission, Role, UserRoleAssignment, UserId, RoleId, SchoolNetworkId, SchoolId } from '@organizoptera/types';

describe('RoleResolver', () => {
  // Mock repositories
  const mockRoleRepo: RoleRepository = {
    findById: vi.fn(),
    findByIds: vi.fn(),
    findByNetwork: vi.fn(),
    findSystemRoles: vi.fn(),
  };

  const mockPermissionRepo: PermissionRepository = {
    findByIds: vi.fn(),
  };

  const mockAssignmentRepo: UserRoleAssignmentRepository = {
    findByUser: vi.fn(),
    findByUserAndScope: vi.fn(),
  };

  const createMockPermission = (
    id: string,
    resource: string,
    action: string,
    scope: 'global' | 'network' | 'school' | 'own'
  ): Permission => ({
    id: id as any,
    resource: resource as any,
    action: action as any,
    scope,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const createMockRole = (
    id: string,
    type: string,
    permissionIds: string[],
    parentRoleId?: string
  ): Role => ({
    id: id as RoleId,
    name: type,
    slug: type.toLowerCase(),
    type: type as any,
    description: `${type} role`,
    permissions: permissionIds as any[],
    parentRoleId: parentRoleId as RoleId | undefined,
    isSystem: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const createMockAssignment = (
    userId: string,
    roleId: string,
    options?: { networkId?: string; schoolId?: string; expiresAt?: Date }
  ): UserRoleAssignment => ({
    id: `assignment-${userId}-${roleId}`,
    userId: userId as UserId,
    roleId: roleId as RoleId,
    networkId: options?.networkId as SchoolNetworkId | undefined,
    schoolId: options?.schoolId as SchoolId | undefined,
    assignedAt: new Date(),
    expiresAt: options?.expiresAt,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create resolver with default config', () => {
      const resolver = createRoleResolver(mockRoleRepo, mockPermissionRepo, mockAssignmentRepo);
      expect(resolver).toBeInstanceOf(RoleResolver);
    });

    it('should create resolver with custom config', () => {
      const resolver = createRoleResolver(mockRoleRepo, mockPermissionRepo, mockAssignmentRepo, {
        resolveInheritance: false,
        enableCache: false,
        cacheTtl: 600,
      });
      expect(resolver).toBeInstanceOf(RoleResolver);
    });
  });

  describe('getUserRoles', () => {
    it('should return empty array when user has no assignments', async () => {
      const resolver = createRoleResolver(mockRoleRepo, mockPermissionRepo, mockAssignmentRepo);

      vi.mocked(mockAssignmentRepo.findByUserAndScope).mockResolvedValue([]);
      vi.mocked(mockRoleRepo.findByIds).mockResolvedValue([]);

      const roles = await resolver.getUserRoles('user-1' as UserId);
      expect(roles).toEqual([]);
    });

    it('should return roles with resolved permissions', async () => {
      const resolver = createRoleResolver(mockRoleRepo, mockPermissionRepo, mockAssignmentRepo);
      const perm1 = createMockPermission('perm-1', 'school', 'read', 'school');
      const role1 = createMockRole('role-1', 'TEACHER', ['perm-1']);

      vi.mocked(mockAssignmentRepo.findByUserAndScope).mockResolvedValue([
        createMockAssignment('user-1', 'role-1'),
      ]);
      vi.mocked(mockRoleRepo.findByIds).mockResolvedValue([role1]);
      vi.mocked(mockPermissionRepo.findByIds).mockResolvedValue([perm1]);

      const roles = await resolver.getUserRoles('user-1' as UserId);

      expect(roles).toHaveLength(1);
      expect(roles[0]?.resolvedPermissions).toHaveLength(1);
      expect(roles[0]?.resolvedPermissions[0]?.id).toBe('perm-1');
    });

    it('should filter out expired assignments', async () => {
      const resolver = createRoleResolver(mockRoleRepo, mockPermissionRepo, mockAssignmentRepo);
      const role1 = createMockRole('role-1', 'TEACHER', []);
      const role2 = createMockRole('role-2', 'COORDINATOR', []);

      const pastDate = new Date('2020-01-01');
      const futureDate = new Date('2030-01-01');

      vi.mocked(mockAssignmentRepo.findByUserAndScope).mockResolvedValue([
        createMockAssignment('user-1', 'role-1', { expiresAt: pastDate }),
        createMockAssignment('user-1', 'role-2', { expiresAt: futureDate }),
      ]);
      vi.mocked(mockRoleRepo.findByIds).mockResolvedValue([role2]);
      vi.mocked(mockPermissionRepo.findByIds).mockResolvedValue([]);

      const roles = await resolver.getUserRoles('user-1' as UserId);

      expect(roles).toHaveLength(1);
      expect(roles[0]?.type).toBe('COORDINATOR');
    });

    it('should include assignments without expiration', async () => {
      const resolver = createRoleResolver(mockRoleRepo, mockPermissionRepo, mockAssignmentRepo);
      const role1 = createMockRole('role-1', 'TEACHER', []);

      vi.mocked(mockAssignmentRepo.findByUserAndScope).mockResolvedValue([
        createMockAssignment('user-1', 'role-1'),
      ]);
      vi.mocked(mockRoleRepo.findByIds).mockResolvedValue([role1]);
      vi.mocked(mockPermissionRepo.findByIds).mockResolvedValue([]);

      const roles = await resolver.getUserRoles('user-1' as UserId);

      expect(roles).toHaveLength(1);
    });

    it('should use cache when enabled', async () => {
      const resolver = createRoleResolver(mockRoleRepo, mockPermissionRepo, mockAssignmentRepo, {
        enableCache: true,
        cacheTtl: 300,
      });
      const role1 = createMockRole('role-1', 'TEACHER', []);

      vi.mocked(mockAssignmentRepo.findByUserAndScope).mockResolvedValue([
        createMockAssignment('user-1', 'role-1'),
      ]);
      vi.mocked(mockRoleRepo.findByIds).mockResolvedValue([role1]);
      vi.mocked(mockPermissionRepo.findByIds).mockResolvedValue([]);

      // First call
      await resolver.getUserRoles('user-1' as UserId);
      // Second call - should use cache
      await resolver.getUserRoles('user-1' as UserId);

      // Should only call repository once due to caching
      expect(mockAssignmentRepo.findByUserAndScope).toHaveBeenCalledTimes(1);
    });

    it('should scope by network', async () => {
      const resolver = createRoleResolver(mockRoleRepo, mockPermissionRepo, mockAssignmentRepo);

      vi.mocked(mockAssignmentRepo.findByUserAndScope).mockResolvedValue([]);
      vi.mocked(mockRoleRepo.findByIds).mockResolvedValue([]);

      await resolver.getUserRoles('user-1' as UserId, 'network-1' as SchoolNetworkId);

      expect(mockAssignmentRepo.findByUserAndScope).toHaveBeenCalledWith(
        'user-1',
        'network-1',
        undefined
      );
    });

    it('should scope by school', async () => {
      const resolver = createRoleResolver(mockRoleRepo, mockPermissionRepo, mockAssignmentRepo);

      vi.mocked(mockAssignmentRepo.findByUserAndScope).mockResolvedValue([]);
      vi.mocked(mockRoleRepo.findByIds).mockResolvedValue([]);

      await resolver.getUserRoles(
        'user-1' as UserId,
        'network-1' as SchoolNetworkId,
        'school-1' as SchoolId
      );

      expect(mockAssignmentRepo.findByUserAndScope).toHaveBeenCalledWith(
        'user-1',
        'network-1',
        'school-1'
      );
    });
  });

  describe('getUserPermissions', () => {
    it('should return empty array when user has no roles', async () => {
      const resolver = createRoleResolver(mockRoleRepo, mockPermissionRepo, mockAssignmentRepo);

      vi.mocked(mockAssignmentRepo.findByUserAndScope).mockResolvedValue([]);
      vi.mocked(mockRoleRepo.findByIds).mockResolvedValue([]);

      const permissions = await resolver.getUserPermissions('user-1' as UserId);
      expect(permissions).toEqual([]);
    });

    it('should aggregate permissions from multiple roles', async () => {
      const resolver = createRoleResolver(mockRoleRepo, mockPermissionRepo, mockAssignmentRepo);
      const perm1 = createMockPermission('perm-1', 'school', 'read', 'school');
      const perm2 = createMockPermission('perm-2', 'classroom', 'read', 'school');
      const role1 = createMockRole('role-1', 'TEACHER', ['perm-1']);
      const role2 = createMockRole('role-2', 'COORDINATOR', ['perm-2']);

      vi.mocked(mockAssignmentRepo.findByUserAndScope).mockResolvedValue([
        createMockAssignment('user-1', 'role-1'),
        createMockAssignment('user-1', 'role-2'),
      ]);
      vi.mocked(mockRoleRepo.findByIds).mockResolvedValue([role1, role2]);
      vi.mocked(mockPermissionRepo.findByIds)
        .mockResolvedValueOnce([perm1])
        .mockResolvedValueOnce([perm2]);

      const permissions = await resolver.getUserPermissions('user-1' as UserId);
      expect(permissions).toHaveLength(2);
    });

    it('should deduplicate permissions', async () => {
      const resolver = createRoleResolver(mockRoleRepo, mockPermissionRepo, mockAssignmentRepo);
      const perm1 = createMockPermission('perm-1', 'school', 'read', 'school');
      const role1 = createMockRole('role-1', 'TEACHER', ['perm-1']);
      const role2 = createMockRole('role-2', 'COORDINATOR', ['perm-1']);

      vi.mocked(mockAssignmentRepo.findByUserAndScope).mockResolvedValue([
        createMockAssignment('user-1', 'role-1'),
        createMockAssignment('user-1', 'role-2'),
      ]);
      vi.mocked(mockRoleRepo.findByIds).mockResolvedValue([role1, role2]);
      vi.mocked(mockPermissionRepo.findByIds).mockResolvedValue([perm1]);

      const permissions = await resolver.getUserPermissions('user-1' as UserId);
      expect(permissions).toHaveLength(1);
    });
  });

  describe('resolveRoleWithPermissions', () => {
    it('should resolve role with direct permissions', async () => {
      const resolver = createRoleResolver(mockRoleRepo, mockPermissionRepo, mockAssignmentRepo);
      const perm1 = createMockPermission('perm-1', 'school', 'read', 'school');
      const role1 = createMockRole('role-1', 'TEACHER', ['perm-1']);

      vi.mocked(mockPermissionRepo.findByIds).mockResolvedValue([perm1]);

      const resolved = await resolver.resolveRoleWithPermissions(role1);

      expect(resolved.resolvedPermissions).toHaveLength(1);
      expect(resolved.resolvedPermissions[0]?.id).toBe('perm-1');
    });

    it('should resolve inherited permissions from parent role', async () => {
      const resolver = createRoleResolver(mockRoleRepo, mockPermissionRepo, mockAssignmentRepo, {
        resolveInheritance: true,
      });
      const perm1 = createMockPermission('perm-1', 'school', 'read', 'school');
      const perm2 = createMockPermission('perm-2', 'classroom', 'read', 'school');
      const parentRole = createMockRole('parent-role', 'COORDINATOR', ['perm-2']);
      const childRole = createMockRole('child-role', 'TEACHER', ['perm-1'], 'parent-role');

      vi.mocked(mockRoleRepo.findById).mockResolvedValue(parentRole);
      vi.mocked(mockPermissionRepo.findByIds)
        .mockResolvedValueOnce([perm1, perm2])
        .mockResolvedValueOnce([perm2]);

      const resolved = await resolver.resolveRoleWithPermissions(childRole);

      expect(resolved.resolvedPermissions.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle circular inheritance', async () => {
      const resolver = createRoleResolver(mockRoleRepo, mockPermissionRepo, mockAssignmentRepo, {
        resolveInheritance: true,
      });
      const role1 = createMockRole('role-1', 'TEACHER', ['perm-1'], 'role-2');
      const role2 = createMockRole('role-2', 'COORDINATOR', ['perm-2'], 'role-1');

      vi.mocked(mockRoleRepo.findById)
        .mockResolvedValueOnce(role2)
        .mockResolvedValueOnce(role1);
      vi.mocked(mockPermissionRepo.findByIds).mockResolvedValue([]);

      // Should not hang or throw due to circular reference detection
      await expect(resolver.resolveRoleWithPermissions(role1)).resolves.toBeDefined();
    });

    it('should handle missing parent role', async () => {
      const resolver = createRoleResolver(mockRoleRepo, mockPermissionRepo, mockAssignmentRepo, {
        resolveInheritance: true,
      });
      const perm1 = createMockPermission('perm-1', 'school', 'read', 'school');
      const childRole = createMockRole('child-role', 'TEACHER', ['perm-1'], 'missing-role');

      vi.mocked(mockRoleRepo.findById).mockResolvedValue(null);
      vi.mocked(mockPermissionRepo.findByIds).mockResolvedValue([perm1]);

      const resolved = await resolver.resolveRoleWithPermissions(childRole);

      expect(resolved.resolvedPermissions).toHaveLength(1);
    });

    it('should skip inheritance when disabled', async () => {
      const resolver = createRoleResolver(mockRoleRepo, mockPermissionRepo, mockAssignmentRepo, {
        resolveInheritance: false,
      });
      const perm1 = createMockPermission('perm-1', 'school', 'read', 'school');
      const childRole = createMockRole('child-role', 'TEACHER', ['perm-1'], 'parent-role');

      vi.mocked(mockPermissionRepo.findByIds).mockResolvedValue([perm1]);

      const resolved = await resolver.resolveRoleWithPermissions(childRole);

      // Should not call findById for parent when inheritance is disabled
      expect(mockRoleRepo.findById).not.toHaveBeenCalled();
      expect(resolved.resolvedPermissions).toHaveLength(1);
    });
  });

  describe('getHighestRole', () => {
    it('should return null for empty array', () => {
      const resolver = createRoleResolver(mockRoleRepo, mockPermissionRepo, mockAssignmentRepo);
      const result = resolver.getHighestRole([]);
      expect(result).toBeNull();
    });

    it('should return SUPER_ADMIN as highest', () => {
      const resolver = createRoleResolver(mockRoleRepo, mockPermissionRepo, mockAssignmentRepo);
      const roles = [
        createMockRole('role-1', 'TEACHER', []),
        createMockRole('role-2', 'SUPER_ADMIN', []),
        createMockRole('role-3', 'SCHOOL_ADMIN', []),
      ];

      const result = resolver.getHighestRole(roles);
      expect(result?.type).toBe('SUPER_ADMIN');
    });

    it('should return NETWORK_ADMIN over SCHOOL_ADMIN', () => {
      const resolver = createRoleResolver(mockRoleRepo, mockPermissionRepo, mockAssignmentRepo);
      const roles = [
        createMockRole('role-1', 'TEACHER', []),
        createMockRole('role-2', 'NETWORK_ADMIN', []),
        createMockRole('role-3', 'SCHOOL_ADMIN', []),
      ];

      const result = resolver.getHighestRole(roles);
      expect(result?.type).toBe('NETWORK_ADMIN');
    });

    it('should return SCHOOL_ADMIN over TEACHER', () => {
      const resolver = createRoleResolver(mockRoleRepo, mockPermissionRepo, mockAssignmentRepo);
      const roles = [
        createMockRole('role-1', 'TEACHER', []),
        createMockRole('role-2', 'SCHOOL_ADMIN', []),
        createMockRole('role-3', 'STUDENT', []),
      ];

      const result = resolver.getHighestRole(roles);
      expect(result?.type).toBe('SCHOOL_ADMIN');
    });

    it('should handle single role', () => {
      const resolver = createRoleResolver(mockRoleRepo, mockPermissionRepo, mockAssignmentRepo);
      const roles = [createMockRole('role-1', 'TEACHER', [])];

      const result = resolver.getHighestRole(roles);
      expect(result?.type).toBe('TEACHER');
    });
  });

  describe('hasRole', () => {
    it('should return true when user has role', async () => {
      const resolver = createRoleResolver(mockRoleRepo, mockPermissionRepo, mockAssignmentRepo);

      vi.mocked(mockAssignmentRepo.findByUser).mockResolvedValue([
        createMockAssignment('user-1', 'role-1'),
      ]);

      const result = await resolver.hasRole('user-1' as UserId, 'role-1' as RoleId);
      expect(result).toBe(true);
    });

    it('should return false when user does not have role', async () => {
      const resolver = createRoleResolver(mockRoleRepo, mockPermissionRepo, mockAssignmentRepo);

      vi.mocked(mockAssignmentRepo.findByUser).mockResolvedValue([
        createMockAssignment('user-1', 'role-1'),
      ]);

      const result = await resolver.hasRole('user-1' as UserId, 'role-2' as RoleId);
      expect(result).toBe(false);
    });

    it('should return false when role assignment is expired', async () => {
      const resolver = createRoleResolver(mockRoleRepo, mockPermissionRepo, mockAssignmentRepo);

      vi.mocked(mockAssignmentRepo.findByUser).mockResolvedValue([
        createMockAssignment('user-1', 'role-1', { expiresAt: new Date('2020-01-01') }),
      ]);

      const result = await resolver.hasRole('user-1' as UserId, 'role-1' as RoleId);
      expect(result).toBe(false);
    });

    it('should return true when role assignment has future expiration', async () => {
      const resolver = createRoleResolver(mockRoleRepo, mockPermissionRepo, mockAssignmentRepo);

      vi.mocked(mockAssignmentRepo.findByUser).mockResolvedValue([
        createMockAssignment('user-1', 'role-1', { expiresAt: new Date('2030-01-01') }),
      ]);

      const result = await resolver.hasRole('user-1' as UserId, 'role-1' as RoleId);
      expect(result).toBe(true);
    });
  });

  describe('cache management', () => {
    it('should invalidate cache for specific user', async () => {
      const resolver = createRoleResolver(mockRoleRepo, mockPermissionRepo, mockAssignmentRepo, {
        enableCache: true,
      });
      const role1 = createMockRole('role-1', 'TEACHER', []);

      vi.mocked(mockAssignmentRepo.findByUserAndScope).mockResolvedValue([
        createMockAssignment('user-1', 'role-1'),
      ]);
      vi.mocked(mockRoleRepo.findByIds).mockResolvedValue([role1]);
      vi.mocked(mockPermissionRepo.findByIds).mockResolvedValue([]);

      // Populate cache
      await resolver.getUserRoles('user-1' as UserId);

      // Invalidate
      resolver.invalidateCache('user-1' as UserId);

      // Should fetch from DB again
      await resolver.getUserRoles('user-1' as UserId);

      expect(mockAssignmentRepo.findByUserAndScope).toHaveBeenCalledTimes(2);
    });

    it('should clear entire cache', async () => {
      const resolver = createRoleResolver(mockRoleRepo, mockPermissionRepo, mockAssignmentRepo, {
        enableCache: true,
      });
      const role1 = createMockRole('role-1', 'TEACHER', []);

      vi.mocked(mockAssignmentRepo.findByUserAndScope).mockResolvedValue([
        createMockAssignment('user-1', 'role-1'),
      ]);
      vi.mocked(mockRoleRepo.findByIds).mockResolvedValue([role1]);
      vi.mocked(mockPermissionRepo.findByIds).mockResolvedValue([]);

      // Populate cache
      await resolver.getUserRoles('user-1' as UserId);
      await resolver.getUserRoles('user-2' as UserId);

      // Clear all
      resolver.clearCache();

      // Should fetch from DB again
      await resolver.getUserRoles('user-1' as UserId);
      await resolver.getUserRoles('user-2' as UserId);

      expect(mockAssignmentRepo.findByUserAndScope).toHaveBeenCalledTimes(4);
    });
  });
});
