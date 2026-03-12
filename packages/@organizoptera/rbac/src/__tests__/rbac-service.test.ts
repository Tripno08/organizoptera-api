/**
 * @organizoptera/rbac - RBAC Service Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrganizopteraRBACService, createRBACService } from '../rbac-service';
import type { RoleRepository, PermissionRepository, UserRoleAssignmentRepository } from '../role-resolver';
import type { Permission, Role, UserRoleAssignment, UserId, RoleId, SchoolNetworkId, SchoolId } from '@organizoptera/types';

describe('OrganizopteraRBACService', () => {
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

  const createMockRole = (id: string, type: string, permissionIds: string[]): Role => ({
    id: id as RoleId,
    name: type,
    slug: type.toLowerCase(),
    type: type as any,
    description: `${type} role`,
    permissions: permissionIds as any[],
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
    it('should create service with default config', () => {
      const service = createRBACService(mockRoleRepo, mockPermissionRepo, mockAssignmentRepo);
      expect(service).toBeInstanceOf(OrganizopteraRBACService);
    });

    it('should create service with custom config', () => {
      const service = createRBACService(mockRoleRepo, mockPermissionRepo, mockAssignmentRepo, {
        cacheEnabled: false,
        cacheTtl: 600,
        auditEnabled: false,
        superAdminBypass: false,
      });
      expect(service).toBeInstanceOf(OrganizopteraRBACService);
    });

    it('should accept optional callbacks', () => {
      const onAssignRole = vi.fn();
      const onRemoveRole = vi.fn();

      const service = createRBACService(
        mockRoleRepo,
        mockPermissionRepo,
        mockAssignmentRepo,
        {},
        { onAssignRole, onRemoveRole }
      );
      expect(service).toBeInstanceOf(OrganizopteraRBACService);
    });
  });

  describe('checkPermission', () => {
    it('should allow super admin to bypass all checks', async () => {
      const service = createRBACService(mockRoleRepo, mockPermissionRepo, mockAssignmentRepo);
      const superAdminRole = createMockRole('role-super', 'SUPER_ADMIN', []);

      vi.mocked(mockAssignmentRepo.findByUserAndScope).mockResolvedValue([
        createMockAssignment('user-1', 'role-super'),
      ]);
      vi.mocked(mockRoleRepo.findByIds).mockResolvedValue([superAdminRole]);
      vi.mocked(mockPermissionRepo.findByIds).mockResolvedValue([]);

      const result = await service.checkPermission({
        userId: 'user-1' as UserId,
        resource: 'school' as any,
        action: 'delete',
      });

      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('Super admin bypass');
    });

    it('should allow when user has exact permission', async () => {
      const service = createRBACService(mockRoleRepo, mockPermissionRepo, mockAssignmentRepo);
      const permission = createMockPermission('perm-1', 'school', 'read', 'school');
      const role = createMockRole('role-teacher', 'TEACHER', ['perm-1']);

      vi.mocked(mockAssignmentRepo.findByUserAndScope).mockResolvedValue([
        createMockAssignment('user-1', 'role-teacher'),
      ]);
      vi.mocked(mockRoleRepo.findByIds).mockResolvedValue([role]);
      vi.mocked(mockPermissionRepo.findByIds).mockResolvedValue([permission]);

      const result = await service.checkPermission({
        userId: 'user-1' as UserId,
        resource: 'school' as any,
        action: 'read',
      });

      expect(result.allowed).toBe(true);
    });

    it('should deny when user lacks permission', async () => {
      const service = createRBACService(mockRoleRepo, mockPermissionRepo, mockAssignmentRepo);
      const permission = createMockPermission('perm-1', 'school', 'read', 'school');
      const role = createMockRole('role-student', 'STUDENT', ['perm-1']);

      vi.mocked(mockAssignmentRepo.findByUserAndScope).mockResolvedValue([
        createMockAssignment('user-1', 'role-student'),
      ]);
      vi.mocked(mockRoleRepo.findByIds).mockResolvedValue([role]);
      vi.mocked(mockPermissionRepo.findByIds).mockResolvedValue([permission]);

      const result = await service.checkPermission({
        userId: 'user-1' as UserId,
        resource: 'school' as any,
        action: 'delete',
      });

      expect(result.allowed).toBe(false);
    });

    it('should handle network-scoped permissions', async () => {
      const service = createRBACService(mockRoleRepo, mockPermissionRepo, mockAssignmentRepo);
      const permission = createMockPermission('perm-1', 'school', 'read', 'network');
      const role = createMockRole('role-admin', 'NETWORK_ADMIN', ['perm-1']);

      vi.mocked(mockAssignmentRepo.findByUserAndScope).mockResolvedValue([
        createMockAssignment('user-1', 'role-admin', { networkId: 'network-1' }),
      ]);
      vi.mocked(mockRoleRepo.findByIds).mockResolvedValue([role]);
      vi.mocked(mockPermissionRepo.findByIds).mockResolvedValue([permission]);

      const result = await service.checkPermission({
        userId: 'user-1' as UserId,
        resource: 'school' as any,
        action: 'read',
        networkId: 'network-1' as SchoolNetworkId,
      });

      expect(result.allowed).toBe(true);
    });

    it('should handle school-scoped permissions', async () => {
      const service = createRBACService(mockRoleRepo, mockPermissionRepo, mockAssignmentRepo);
      const permission = createMockPermission('perm-1', 'classroom', 'update', 'school');
      const role = createMockRole('role-coordinator', 'COORDINATOR', ['perm-1']);

      vi.mocked(mockAssignmentRepo.findByUserAndScope).mockResolvedValue([
        createMockAssignment('user-1', 'role-coordinator', { schoolId: 'school-1' }),
      ]);
      vi.mocked(mockRoleRepo.findByIds).mockResolvedValue([role]);
      vi.mocked(mockPermissionRepo.findByIds).mockResolvedValue([permission]);

      const result = await service.checkPermission({
        userId: 'user-1' as UserId,
        resource: 'classroom' as any,
        action: 'update',
        schoolId: 'school-1' as SchoolId,
      });

      expect(result.allowed).toBe(true);
    });
  });

  describe('getUserPermissions', () => {
    it('should return empty array when user has no roles', async () => {
      const service = createRBACService(mockRoleRepo, mockPermissionRepo, mockAssignmentRepo);

      vi.mocked(mockAssignmentRepo.findByUserAndScope).mockResolvedValue([]);
      vi.mocked(mockRoleRepo.findByIds).mockResolvedValue([]);

      const permissions = await service.getUserPermissions('user-1' as UserId);
      expect(permissions).toEqual([]);
    });

    it('should return aggregated permissions from multiple roles', async () => {
      const service = createRBACService(mockRoleRepo, mockPermissionRepo, mockAssignmentRepo);
      const perm1 = createMockPermission('perm-1', 'school', 'read', 'school');
      const perm2 = createMockPermission('perm-2', 'classroom', 'read', 'school');
      const role1 = createMockRole('role-1', 'TEACHER', ['perm-1']);
      const role2 = createMockRole('role-2', 'COORDINATOR', ['perm-2']);

      vi.mocked(mockAssignmentRepo.findByUserAndScope).mockResolvedValue([
        createMockAssignment('user-1', 'role-1'),
        createMockAssignment('user-1', 'role-2'),
      ]);
      vi.mocked(mockRoleRepo.findByIds).mockResolvedValue([role1, role2]);
      vi.mocked(mockPermissionRepo.findByIds).mockResolvedValue([perm1, perm2]);

      const permissions = await service.getUserPermissions('user-1' as UserId);
      expect(permissions).toHaveLength(2);
    });

    it('should filter by network scope', async () => {
      const service = createRBACService(mockRoleRepo, mockPermissionRepo, mockAssignmentRepo);
      const perm1 = createMockPermission('perm-1', 'school', 'read', 'network');
      const role1 = createMockRole('role-1', 'NETWORK_ADMIN', ['perm-1']);

      vi.mocked(mockAssignmentRepo.findByUserAndScope).mockResolvedValue([
        createMockAssignment('user-1', 'role-1', { networkId: 'network-1' }),
      ]);
      vi.mocked(mockRoleRepo.findByIds).mockResolvedValue([role1]);
      vi.mocked(mockPermissionRepo.findByIds).mockResolvedValue([perm1]);

      const permissions = await service.getUserPermissions(
        'user-1' as UserId,
        'network-1' as SchoolNetworkId
      );
      expect(permissions).toHaveLength(1);
    });
  });

  describe('getUserRoles', () => {
    it('should return empty array when user has no roles', async () => {
      const service = createRBACService(mockRoleRepo, mockPermissionRepo, mockAssignmentRepo);

      vi.mocked(mockAssignmentRepo.findByUserAndScope).mockResolvedValue([]);
      vi.mocked(mockRoleRepo.findByIds).mockResolvedValue([]);

      const roles = await service.getUserRoles('user-1' as UserId);
      expect(roles).toEqual([]);
    });

    it('should return roles with resolved permissions', async () => {
      const service = createRBACService(mockRoleRepo, mockPermissionRepo, mockAssignmentRepo);
      const perm1 = createMockPermission('perm-1', 'school', 'read', 'school');
      const role1 = createMockRole('role-1', 'TEACHER', ['perm-1']);

      vi.mocked(mockAssignmentRepo.findByUserAndScope).mockResolvedValue([
        createMockAssignment('user-1', 'role-1'),
      ]);
      vi.mocked(mockRoleRepo.findByIds).mockResolvedValue([role1]);
      vi.mocked(mockPermissionRepo.findByIds).mockResolvedValue([perm1]);

      const roles = await service.getUserRoles('user-1' as UserId);
      expect(roles).toHaveLength(1);
      expect(roles[0]?.resolvedPermissions).toHaveLength(1);
    });
  });

  describe('assignRole', () => {
    it('should create role assignment with callback', async () => {
      const onAssignRole = vi.fn().mockResolvedValue(undefined);
      const service = createRBACService(
        mockRoleRepo,
        mockPermissionRepo,
        mockAssignmentRepo,
        {},
        { onAssignRole }
      );

      const assignment = await service.assignRole(
        'user-1' as UserId,
        'role-1' as RoleId,
        'admin-1' as UserId
      );

      expect(assignment.userId).toBe('user-1');
      expect(assignment.roleId).toBe('role-1');
      expect(assignment.assignedBy).toBe('admin-1');
      expect(onAssignRole).toHaveBeenCalledWith(expect.objectContaining({
        userId: 'user-1',
        roleId: 'role-1',
      }));
    });

    it('should create role assignment with scope options', async () => {
      const onAssignRole = vi.fn().mockResolvedValue(undefined);
      const service = createRBACService(
        mockRoleRepo,
        mockPermissionRepo,
        mockAssignmentRepo,
        {},
        { onAssignRole }
      );

      const expiresAt = new Date('2025-12-31');
      const assignment = await service.assignRole(
        'user-1' as UserId,
        'role-1' as RoleId,
        'admin-1' as UserId,
        {
          networkId: 'network-1' as SchoolNetworkId,
          schoolId: 'school-1' as SchoolId,
          expiresAt,
        }
      );

      expect(assignment.networkId).toBe('network-1');
      expect(assignment.schoolId).toBe('school-1');
      expect(assignment.expiresAt).toEqual(expiresAt);
    });

    it('should work without callback', async () => {
      const service = createRBACService(mockRoleRepo, mockPermissionRepo, mockAssignmentRepo);

      const assignment = await service.assignRole(
        'user-1' as UserId,
        'role-1' as RoleId,
        'admin-1' as UserId
      );

      expect(assignment.userId).toBe('user-1');
    });
  });

  describe('removeRole', () => {
    it('should call callback when removing role', async () => {
      const onRemoveRole = vi.fn().mockResolvedValue(undefined);
      const service = createRBACService(
        mockRoleRepo,
        mockPermissionRepo,
        mockAssignmentRepo,
        {},
        { onRemoveRole }
      );

      await service.removeRole('user-1' as UserId, 'role-1' as RoleId);

      expect(onRemoveRole).toHaveBeenCalledWith('user-1', 'role-1');
    });

    it('should work without callback', async () => {
      const service = createRBACService(mockRoleRepo, mockPermissionRepo, mockAssignmentRepo);

      await expect(
        service.removeRole('user-1' as UserId, 'role-1' as RoleId)
      ).resolves.toBeUndefined();
    });
  });

  describe('checkPermissions (batch)', () => {
    it('should check multiple permissions at once', async () => {
      const service = createRBACService(mockRoleRepo, mockPermissionRepo, mockAssignmentRepo);
      const perm1 = createMockPermission('perm-1', 'school', 'read', 'school');
      const perm2 = createMockPermission('perm-2', 'classroom', 'read', 'school');
      const role1 = createMockRole('role-1', 'TEACHER', ['perm-1', 'perm-2']);

      vi.mocked(mockAssignmentRepo.findByUserAndScope).mockResolvedValue([
        createMockAssignment('user-1', 'role-1'),
      ]);
      vi.mocked(mockRoleRepo.findByIds).mockResolvedValue([role1]);
      vi.mocked(mockPermissionRepo.findByIds).mockResolvedValue([perm1, perm2]);

      const results = await service.checkPermissions('user-1' as UserId, [
        { resource: 'school' as any, action: 'read' },
        { resource: 'classroom' as any, action: 'read' },
        { resource: 'student' as any, action: 'delete' },
      ]);

      expect(results.size).toBe(3);
      expect(results.get('school:read')?.allowed).toBe(true);
      expect(results.get('classroom:read')?.allowed).toBe(true);
      expect(results.get('student:delete')?.allowed).toBe(false);
    });
  });

  describe('getHighestRole', () => {
    it('should return highest role by hierarchy', async () => {
      const service = createRBACService(mockRoleRepo, mockPermissionRepo, mockAssignmentRepo);
      const role1 = createMockRole('role-1', 'TEACHER', []);
      const role2 = createMockRole('role-2', 'SCHOOL_ADMIN', []);

      vi.mocked(mockAssignmentRepo.findByUserAndScope).mockResolvedValue([
        createMockAssignment('user-1', 'role-1'),
        createMockAssignment('user-1', 'role-2'),
      ]);
      vi.mocked(mockRoleRepo.findByIds).mockResolvedValue([role1, role2]);
      vi.mocked(mockPermissionRepo.findByIds).mockResolvedValue([]);

      const highestRole = await service.getHighestRole('user-1' as UserId);
      expect(highestRole?.type).toBe('SCHOOL_ADMIN');
    });

    it('should return null when user has no roles', async () => {
      const service = createRBACService(mockRoleRepo, mockPermissionRepo, mockAssignmentRepo);

      vi.mocked(mockAssignmentRepo.findByUserAndScope).mockResolvedValue([]);
      vi.mocked(mockRoleRepo.findByIds).mockResolvedValue([]);

      const highestRole = await service.getHighestRole('user-1' as UserId);
      expect(highestRole).toBeNull();
    });
  });

  describe('isSuperAdmin', () => {
    it('should return true for super admin', async () => {
      const service = createRBACService(mockRoleRepo, mockPermissionRepo, mockAssignmentRepo);
      const role = createMockRole('role-1', 'SUPER_ADMIN', []);

      vi.mocked(mockAssignmentRepo.findByUserAndScope).mockResolvedValue([
        createMockAssignment('user-1', 'role-1'),
      ]);
      vi.mocked(mockRoleRepo.findByIds).mockResolvedValue([role]);
      vi.mocked(mockPermissionRepo.findByIds).mockResolvedValue([]);

      const isSuperAdmin = await service.isSuperAdmin('user-1' as UserId);
      expect(isSuperAdmin).toBe(true);
    });

    it('should return false for non-super admin', async () => {
      const service = createRBACService(mockRoleRepo, mockPermissionRepo, mockAssignmentRepo);
      const role = createMockRole('role-1', 'TEACHER', []);

      vi.mocked(mockAssignmentRepo.findByUserAndScope).mockResolvedValue([
        createMockAssignment('user-1', 'role-1'),
      ]);
      vi.mocked(mockRoleRepo.findByIds).mockResolvedValue([role]);
      vi.mocked(mockPermissionRepo.findByIds).mockResolvedValue([]);

      const isSuperAdmin = await service.isSuperAdmin('user-1' as UserId);
      expect(isSuperAdmin).toBe(false);
    });
  });

  describe('invalidateCache', () => {
    it('should invalidate cache for user', async () => {
      const service = createRBACService(mockRoleRepo, mockPermissionRepo, mockAssignmentRepo, {
        cacheEnabled: true,
      });

      await expect(service.invalidateCache('user-1' as UserId)).resolves.toBeUndefined();
    });
  });
});
