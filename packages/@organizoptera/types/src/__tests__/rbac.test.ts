/**
 * @organizoptera/types - RBAC Types Tests
 */

import { describe, it, expect } from 'vitest';
import type {
  ResourceType,
  PermissionAction,
  PermissionScope,
  Permission,
  PermissionConditions,
  BuiltInRole,
  Role,
  RoleWithPermissions,
  UserRoleAssignment,
  UserWithRoles,
  PermissionCheckRequest,
  PermissionCheckResult,
  RBACService,
  RBACConfig,
} from '../rbac';
import { DEFAULT_RBAC_CONFIG } from '../rbac';
import { userId, roleId, permissionId, schoolNetworkId, schoolId } from '../branded';

describe('RBAC Types', () => {
  describe('ResourceType', () => {
    it('should accept all valid resource types', () => {
      const resources: ResourceType[] = [
        'school_network',
        'school',
        'school_year',
        'grade',
        'classroom',
        'student',
        'teacher',
        'enrollment',
        'user',
        'role',
        'permission',
        'settings',
        'report',
        'audit_log',
      ];

      expect(resources).toHaveLength(14);
    });
  });

  describe('PermissionAction', () => {
    it('should accept all valid actions', () => {
      const actions: PermissionAction[] = ['create', 'read', 'update', 'delete', 'manage', '*'];
      expect(actions).toHaveLength(6);
    });
  });

  describe('PermissionScope', () => {
    it('should accept all valid scopes', () => {
      const scopes: PermissionScope[] = ['own', 'school', 'network', 'global'];
      expect(scopes).toHaveLength(4);
    });
  });

  describe('Permission', () => {
    it('should accept valid Permission', () => {
      const permission: Permission = {
        id: permissionId('perm-1'),
        resource: 'school',
        action: 'read',
        scope: 'school',
        description: 'Can read school data',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(permission.id).toBe('perm-1');
      expect(permission.resource).toBe('school');
    });

    it('should accept Permission with conditions', () => {
      const permission: Permission = {
        id: permissionId('perm-1'),
        resource: 'student',
        action: 'read',
        scope: 'school',
        conditions: {
          status: ['ACTIVE'],
          shift: ['MORNING', 'AFTERNOON'],
          educationLevel: ['elementary'],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(permission.conditions?.status).toContain('ACTIVE');
    });

    it('should accept Permission with expression condition', () => {
      const permission: Permission = {
        id: permissionId('perm-1'),
        resource: 'enrollment',
        action: 'create',
        scope: 'school',
        conditions: {
          expression: 'user.role === "COORDINATOR"',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(permission.conditions?.expression).toBeDefined();
    });
  });

  describe('PermissionConditions', () => {
    it('should accept all condition types', () => {
      const conditions: PermissionConditions = {
        status: ['ACTIVE', 'PENDING'],
        shift: ['MORNING'],
        educationLevel: ['elementary', 'middle'],
        expression: 'custom_expression',
      };

      expect(conditions.status).toHaveLength(2);
      expect(conditions.shift).toHaveLength(1);
    });

    it('should accept partial conditions', () => {
      const conditions: PermissionConditions = {
        status: ['ACTIVE'],
      };

      expect(conditions.status).toBeDefined();
      expect(conditions.shift).toBeUndefined();
    });
  });

  describe('BuiltInRole', () => {
    it('should accept all built-in roles', () => {
      const roles: BuiltInRole[] = [
        'SUPER_ADMIN',
        'NETWORK_ADMIN',
        'SCHOOL_ADMIN',
        'COORDINATOR',
        'TEACHER',
        'STUDENT',
        'GUARDIAN',
        'ANALYST',
        'SUPPORT',
      ];

      expect(roles).toHaveLength(9);
    });
  });

  describe('Role', () => {
    it('should accept valid Role with built-in type', () => {
      const role: Role = {
        id: roleId('role-1'),
        name: 'School Administrator',
        slug: 'school-admin',
        description: 'Administers a school',
        type: 'SCHOOL_ADMIN',
        permissions: [permissionId('perm-1'), permissionId('perm-2')],
        isSystem: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(role.type).toBe('SCHOOL_ADMIN');
      expect(role.permissions).toHaveLength(2);
    });

    it('should accept custom Role', () => {
      const role: Role = {
        id: roleId('role-custom'),
        name: 'Custom Role',
        slug: 'custom-role',
        type: 'CUSTOM',
        permissions: [],
        isSystem: false,
        networkId: schoolNetworkId('network-1'),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(role.type).toBe('CUSTOM');
      expect(role.isSystem).toBe(false);
    });

    it('should accept Role with parent', () => {
      const role: Role = {
        id: roleId('role-child'),
        name: 'Child Role',
        slug: 'child-role',
        type: 'CUSTOM',
        permissions: [],
        parentRoleId: roleId('role-parent'),
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(role.parentRoleId).toBe('role-parent');
    });
  });

  describe('RoleWithPermissions', () => {
    it('should extend Role with resolved permissions', () => {
      const role: RoleWithPermissions = {
        id: roleId('role-1'),
        name: 'Teacher',
        slug: 'teacher',
        type: 'TEACHER',
        permissions: [permissionId('perm-1')],
        isSystem: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        resolvedPermissions: [
          {
            id: permissionId('perm-1'),
            resource: 'school',
            action: 'read',
            scope: 'school',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };

      expect(role.resolvedPermissions).toHaveLength(1);
      expect(role.resolvedPermissions[0].id).toBe('perm-1');
    });
  });

  describe('UserRoleAssignment', () => {
    it('should accept global assignment', () => {
      const assignment: UserRoleAssignment = {
        id: 'assignment-1',
        userId: userId('user-1'),
        roleId: roleId('role-1'),
        assignedAt: new Date(),
      };

      expect(assignment.networkId).toBeUndefined();
      expect(assignment.schoolId).toBeUndefined();
    });

    it('should accept network-scoped assignment', () => {
      const assignment: UserRoleAssignment = {
        id: 'assignment-2',
        userId: userId('user-1'),
        roleId: roleId('role-1'),
        networkId: schoolNetworkId('network-1'),
        assignedAt: new Date(),
        assignedBy: userId('admin-1'),
      };

      expect(assignment.networkId).toBe('network-1');
    });

    it('should accept school-scoped assignment', () => {
      const assignment: UserRoleAssignment = {
        id: 'assignment-3',
        userId: userId('user-1'),
        roleId: roleId('role-1'),
        networkId: schoolNetworkId('network-1'),
        schoolId: schoolId('school-1'),
        assignedAt: new Date(),
        expiresAt: new Date('2025-12-31'),
      };

      expect(assignment.schoolId).toBe('school-1');
      expect(assignment.expiresAt).toBeDefined();
    });

    it('should accept assignment with metadata', () => {
      const assignment: UserRoleAssignment = {
        id: 'assignment-4',
        userId: userId('user-1'),
        roleId: roleId('role-1'),
        assignedAt: new Date(),
        metadata: { reason: 'Promotion', approvedBy: 'HR' },
      };

      expect(assignment.metadata?.reason).toBe('Promotion');
    });
  });

  describe('UserWithRoles', () => {
    it('should accept UserWithRoles', () => {
      const userWithRoles: UserWithRoles = {
        userId: userId('user-1'),
        assignments: [
          {
            id: 'assignment-1',
            userId: userId('user-1'),
            roleId: roleId('role-1'),
            assignedAt: new Date(),
          },
        ],
        effectivePermissions: [
          {
            id: permissionId('perm-1'),
            resource: 'school',
            action: 'read',
            scope: 'school',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };

      expect(userWithRoles.assignments).toHaveLength(1);
      expect(userWithRoles.effectivePermissions).toHaveLength(1);
    });
  });

  describe('PermissionCheckRequest', () => {
    it('should accept basic request', () => {
      const request: PermissionCheckRequest = {
        userId: userId('user-1'),
        resource: 'school',
        action: 'read',
      };

      expect(request.userId).toBe('user-1');
    });

    it('should accept request with resourceId', () => {
      const request: PermissionCheckRequest = {
        userId: userId('user-1'),
        resource: 'student',
        action: 'update',
        resourceId: 'student-123',
      };

      expect(request.resourceId).toBe('student-123');
    });

    it('should accept request with scope', () => {
      const request: PermissionCheckRequest = {
        userId: userId('user-1'),
        resource: 'classroom',
        action: 'create',
        networkId: schoolNetworkId('network-1'),
        schoolId: schoolId('school-1'),
      };

      expect(request.networkId).toBe('network-1');
      expect(request.schoolId).toBe('school-1');
    });
  });

  describe('PermissionCheckResult', () => {
    it('should accept allowed result', () => {
      const result: PermissionCheckResult = {
        allowed: true,
        reason: 'Permission granted',
      };

      expect(result.allowed).toBe(true);
    });

    it('should accept denied result', () => {
      const result: PermissionCheckResult = {
        allowed: false,
        reason: 'Insufficient permissions',
      };

      expect(result.allowed).toBe(false);
    });

    it('should include matched permission and role', () => {
      const result: PermissionCheckResult = {
        allowed: true,
        reason: 'Permission granted',
        matchedPermission: {
          id: permissionId('perm-1'),
          resource: 'school',
          action: 'read',
          scope: 'school',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        matchedRole: {
          id: roleId('role-1'),
          name: 'Teacher',
          slug: 'teacher',
          type: 'TEACHER',
          permissions: [],
          isSystem: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      expect(result.matchedPermission?.id).toBe('perm-1');
      expect(result.matchedRole?.type).toBe('TEACHER');
    });
  });

  describe('RBACConfig', () => {
    it('should accept valid config', () => {
      const config: RBACConfig = {
        cacheEnabled: true,
        cacheTtl: 300,
        auditEnabled: true,
        superAdminBypass: true,
      };

      expect(config.cacheEnabled).toBe(true);
    });

    it('should accept disabled config', () => {
      const config: RBACConfig = {
        cacheEnabled: false,
        cacheTtl: 0,
        auditEnabled: false,
        superAdminBypass: false,
      };

      expect(config.superAdminBypass).toBe(false);
    });
  });

  describe('DEFAULT_RBAC_CONFIG', () => {
    it('should have caching enabled by default', () => {
      expect(DEFAULT_RBAC_CONFIG.cacheEnabled).toBe(true);
    });

    it('should have 5 minute cache TTL by default', () => {
      expect(DEFAULT_RBAC_CONFIG.cacheTtl).toBe(300);
    });

    it('should have audit enabled by default', () => {
      expect(DEFAULT_RBAC_CONFIG.auditEnabled).toBe(true);
    });

    it('should have super admin bypass enabled by default', () => {
      expect(DEFAULT_RBAC_CONFIG.superAdminBypass).toBe(true);
    });
  });
});
