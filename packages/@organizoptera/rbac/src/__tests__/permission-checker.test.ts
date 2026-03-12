/**
 * @organizoptera/rbac - Permission Checker Tests
 */

import { describe, it, expect } from 'vitest';
import { PermissionChecker, createPermissionChecker, type UserContext } from '../permission-checker';
import { ROLE_HIERARCHY, SCOPE_HIERARCHY, ACTION_WEIGHTS } from '../constants';
import type { Permission, Role, PermissionCheckRequest } from '@organizoptera/types';

describe('Permission Checker', () => {
  describe('Constants', () => {
    it('should have correct role hierarchy', () => {
      expect(ROLE_HIERARCHY.SUPER_ADMIN).toBe(100);
      expect(ROLE_HIERARCHY.NETWORK_ADMIN).toBe(90);
      expect(ROLE_HIERARCHY.SCHOOL_ADMIN).toBe(80);
      expect(ROLE_HIERARCHY.TEACHER).toBe(50);
      expect(ROLE_HIERARCHY.STUDENT).toBe(30);
    });

    it('should have correct scope hierarchy', () => {
      expect(SCOPE_HIERARCHY.global).toBe(100);
      expect(SCOPE_HIERARCHY.network).toBe(75);
      expect(SCOPE_HIERARCHY.school).toBe(50);
      expect(SCOPE_HIERARCHY.own).toBe(25);
    });

    it('should have correct action weights', () => {
      expect(ACTION_WEIGHTS['*']).toBe(100);
      expect(ACTION_WEIGHTS.manage).toBe(80);
      expect(ACTION_WEIGHTS.delete).toBe(60);
      expect(ACTION_WEIGHTS.create).toBe(30);
      expect(ACTION_WEIGHTS.read).toBe(10);
    });
  });

  describe('PermissionChecker', () => {
    const checker = createPermissionChecker({ superAdminBypass: true });

    const createMockPermission = (
      resource: string,
      action: string,
      scope: 'global' | 'network' | 'school' | 'own'
    ): Permission => ({
      id: `perm-${resource}-${action}`,
      resource: resource as any,
      action: action as any,
      scope,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const createMockRole = (type: string, permissions: string[]): Role => ({
      id: `role-${type}`,
      name: type,
      type: type as any,
      description: `${type} role`,
      permissions,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    it('should allow super admin to bypass all checks', () => {
      const context: UserContext = {
        userId: 'user-1' as any,
        permissions: [],
        roles: [createMockRole('SUPER_ADMIN', [])],
      };

      const request: PermissionCheckRequest = {
        userId: 'user-1' as any,
        resource: 'school' as any,
        action: 'delete',
      };

      const result = checker.check(context, request);
      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('Super admin bypass');
    });

    it('should allow when user has exact permission', () => {
      const permission = createMockPermission('school', 'read', 'school');
      const context: UserContext = {
        userId: 'user-1' as any,
        permissions: [permission],
        roles: [createMockRole('TEACHER', [permission.id])],
      };

      const request: PermissionCheckRequest = {
        userId: 'user-1' as any,
        resource: 'school' as any,
        action: 'read',
      };

      const result = checker.check(context, request);
      expect(result.allowed).toBe(true);
    });

    it('should deny when user lacks permission', () => {
      const context: UserContext = {
        userId: 'user-1' as any,
        permissions: [],
        roles: [createMockRole('STUDENT', [])],
      };

      const request: PermissionCheckRequest = {
        userId: 'user-1' as any,
        resource: 'school' as any,
        action: 'delete',
      };

      const result = checker.check(context, request);
      expect(result.allowed).toBe(false);
    });

    it('should allow wildcard action permission', () => {
      const permission = createMockPermission('school', '*', 'global');
      const context: UserContext = {
        userId: 'user-1' as any,
        permissions: [permission],
        roles: [createMockRole('NETWORK_ADMIN', [permission.id])],
      };

      const request: PermissionCheckRequest = {
        userId: 'user-1' as any,
        resource: 'school' as any,
        action: 'delete',
      };

      const result = checker.check(context, request);
      expect(result.allowed).toBe(true);
    });

    it('should allow manage action for create/update/delete', () => {
      const permission = createMockPermission('classroom', 'manage', 'school');
      const context: UserContext = {
        userId: 'user-1' as any,
        permissions: [permission],
        roles: [createMockRole('SCHOOL_ADMIN', [permission.id])],
      };

      // Test create
      expect(checker.check(context, {
        userId: 'user-1' as any,
        resource: 'classroom' as any,
        action: 'create',
      }).allowed).toBe(true);

      // Test update
      expect(checker.check(context, {
        userId: 'user-1' as any,
        resource: 'classroom' as any,
        action: 'update',
      }).allowed).toBe(true);

      // Test delete
      expect(checker.check(context, {
        userId: 'user-1' as any,
        resource: 'classroom' as any,
        action: 'delete',
      }).allowed).toBe(true);

      // Test read (not covered by manage)
      expect(checker.check(context, {
        userId: 'user-1' as any,
        resource: 'classroom' as any,
        action: 'read',
      }).allowed).toBe(false);
    });
  });

  describe('checkAny', () => {
    const checker = createPermissionChecker({ superAdminBypass: false });

    it('should return true if any permission matches', () => {
      const permission = {
        id: 'perm-1',
        resource: 'school' as any,
        action: 'read' as any,
        scope: 'school' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const context: UserContext = {
        userId: 'user-1' as any,
        permissions: [permission],
        roles: [],
      };

      const requests: PermissionCheckRequest[] = [
        { userId: 'user-1' as any, resource: 'classroom' as any, action: 'delete' },
        { userId: 'user-1' as any, resource: 'school' as any, action: 'read' },
      ];

      const result = checker.checkAny(context, requests);
      expect(result.allowed).toBe(true);
    });
  });

  describe('checkAll', () => {
    const checker = createPermissionChecker({ superAdminBypass: false });

    it('should return false if any permission is missing', () => {
      const permission = {
        id: 'perm-1',
        resource: 'school' as any,
        action: 'read' as any,
        scope: 'school' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const context: UserContext = {
        userId: 'user-1' as any,
        permissions: [permission],
        roles: [],
      };

      const requests: PermissionCheckRequest[] = [
        { userId: 'user-1' as any, resource: 'school' as any, action: 'read' },
        { userId: 'user-1' as any, resource: 'school' as any, action: 'delete' },
      ];

      const result = checker.checkAll(context, requests);
      expect(result.allowed).toBe(false);
    });
  });
});
