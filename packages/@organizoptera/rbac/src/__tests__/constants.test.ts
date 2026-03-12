/**
 * @organizoptera/rbac - Constants Tests
 */

import { describe, it, expect } from 'vitest';
import {
  ROLE_HIERARCHY,
  ACTION_WEIGHTS,
  SCOPE_HIERARCHY,
  getDefaultPermissionsForRole,
  OWNERSHIP_RESOURCES,
  NETWORK_SCOPED_RESOURCES,
} from '../constants';

describe('RBAC Constants', () => {
  describe('ROLE_HIERARCHY', () => {
    it('should have SUPER_ADMIN as highest', () => {
      expect(ROLE_HIERARCHY.SUPER_ADMIN).toBe(100);
    });

    it('should have NETWORK_ADMIN below SUPER_ADMIN', () => {
      expect(ROLE_HIERARCHY.NETWORK_ADMIN).toBeLessThan(ROLE_HIERARCHY.SUPER_ADMIN);
    });

    it('should have SCHOOL_ADMIN below NETWORK_ADMIN', () => {
      expect(ROLE_HIERARCHY.SCHOOL_ADMIN).toBeLessThan(ROLE_HIERARCHY.NETWORK_ADMIN);
    });

    it('should have COORDINATOR below SCHOOL_ADMIN', () => {
      expect(ROLE_HIERARCHY.COORDINATOR).toBeLessThan(ROLE_HIERARCHY.SCHOOL_ADMIN);
    });

    it('should have TEACHER below COORDINATOR', () => {
      expect(ROLE_HIERARCHY.TEACHER).toBeLessThan(ROLE_HIERARCHY.COORDINATOR);
    });

    it('should have STUDENT below TEACHER', () => {
      expect(ROLE_HIERARCHY.STUDENT).toBeLessThan(ROLE_HIERARCHY.TEACHER);
    });

    it('should have GUARDIAN at lowest level', () => {
      expect(ROLE_HIERARCHY.GUARDIAN).toBe(20);
    });

    it('should have ANALYST between STUDENT and TEACHER', () => {
      expect(ROLE_HIERARCHY.ANALYST).toBeGreaterThan(ROLE_HIERARCHY.STUDENT);
      expect(ROLE_HIERARCHY.ANALYST).toBeLessThan(ROLE_HIERARCHY.TEACHER);
    });

    it('should have SUPPORT between TEACHER and COORDINATOR', () => {
      expect(ROLE_HIERARCHY.SUPPORT).toBeGreaterThan(ROLE_HIERARCHY.TEACHER);
      expect(ROLE_HIERARCHY.SUPPORT).toBeLessThan(ROLE_HIERARCHY.COORDINATOR);
    });

    it('should have all expected roles defined', () => {
      expect(ROLE_HIERARCHY).toHaveProperty('SUPER_ADMIN');
      expect(ROLE_HIERARCHY).toHaveProperty('NETWORK_ADMIN');
      expect(ROLE_HIERARCHY).toHaveProperty('SCHOOL_ADMIN');
      expect(ROLE_HIERARCHY).toHaveProperty('COORDINATOR');
      expect(ROLE_HIERARCHY).toHaveProperty('TEACHER');
      expect(ROLE_HIERARCHY).toHaveProperty('STUDENT');
      expect(ROLE_HIERARCHY).toHaveProperty('GUARDIAN');
      expect(ROLE_HIERARCHY).toHaveProperty('ANALYST');
      expect(ROLE_HIERARCHY).toHaveProperty('SUPPORT');
    });
  });

  describe('ACTION_WEIGHTS', () => {
    it('should have wildcard as highest weight', () => {
      expect(ACTION_WEIGHTS['*']).toBe(100);
    });

    it('should have manage below wildcard', () => {
      expect(ACTION_WEIGHTS.manage).toBeLessThan(ACTION_WEIGHTS['*']);
    });

    it('should have delete below manage', () => {
      expect(ACTION_WEIGHTS.delete).toBeLessThan(ACTION_WEIGHTS.manage);
    });

    it('should have update below delete', () => {
      expect(ACTION_WEIGHTS.update).toBeLessThan(ACTION_WEIGHTS.delete);
    });

    it('should have create below update', () => {
      expect(ACTION_WEIGHTS.create).toBeLessThan(ACTION_WEIGHTS.update);
    });

    it('should have read as lowest weight', () => {
      expect(ACTION_WEIGHTS.read).toBe(10);
    });

    it('should have all expected actions defined', () => {
      expect(ACTION_WEIGHTS).toHaveProperty('*');
      expect(ACTION_WEIGHTS).toHaveProperty('manage');
      expect(ACTION_WEIGHTS).toHaveProperty('delete');
      expect(ACTION_WEIGHTS).toHaveProperty('update');
      expect(ACTION_WEIGHTS).toHaveProperty('create');
      expect(ACTION_WEIGHTS).toHaveProperty('read');
    });
  });

  describe('SCOPE_HIERARCHY', () => {
    it('should have global as highest scope', () => {
      expect(SCOPE_HIERARCHY.global).toBe(100);
    });

    it('should have network below global', () => {
      expect(SCOPE_HIERARCHY.network).toBeLessThan(SCOPE_HIERARCHY.global);
    });

    it('should have school below network', () => {
      expect(SCOPE_HIERARCHY.school).toBeLessThan(SCOPE_HIERARCHY.network);
    });

    it('should have own as lowest scope', () => {
      expect(SCOPE_HIERARCHY.own).toBe(25);
    });

    it('should have all expected scopes defined', () => {
      expect(SCOPE_HIERARCHY).toHaveProperty('global');
      expect(SCOPE_HIERARCHY).toHaveProperty('network');
      expect(SCOPE_HIERARCHY).toHaveProperty('school');
      expect(SCOPE_HIERARCHY).toHaveProperty('own');
    });
  });

  describe('getDefaultPermissionsForRole', () => {
    describe('SUPER_ADMIN', () => {
      it('should have global wildcard permission', () => {
        const permissions = getDefaultPermissionsForRole('SUPER_ADMIN');
        expect(permissions.length).toBeGreaterThan(0);
        expect(permissions.some((p) => p.action === '*' && p.scope === 'global')).toBe(true);
      });
    });

    describe('NETWORK_ADMIN', () => {
      it('should have network-scoped permissions', () => {
        const permissions = getDefaultPermissionsForRole('NETWORK_ADMIN');
        expect(permissions.length).toBeGreaterThan(0);
        expect(permissions.every((p) => p.scope === 'network')).toBe(true);
      });

      it('should have school read and update permissions', () => {
        const permissions = getDefaultPermissionsForRole('NETWORK_ADMIN');
        expect(permissions.some((p) => p.resource === 'school_network' && p.action === 'read')).toBe(true);
        expect(permissions.some((p) => p.resource === 'school_network' && p.action === 'update')).toBe(true);
      });

      it('should have user management permissions', () => {
        const permissions = getDefaultPermissionsForRole('NETWORK_ADMIN');
        expect(permissions.some((p) => p.resource === 'user' && p.action === '*')).toBe(true);
      });
    });

    describe('SCHOOL_ADMIN', () => {
      it('should have school-scoped permissions', () => {
        const permissions = getDefaultPermissionsForRole('SCHOOL_ADMIN');
        expect(permissions.length).toBeGreaterThan(0);
        expect(permissions.every((p) => p.scope === 'school')).toBe(true);
      });

      it('should have student and teacher management', () => {
        const permissions = getDefaultPermissionsForRole('SCHOOL_ADMIN');
        expect(permissions.some((p) => p.resource === 'student' && p.action === '*')).toBe(true);
        expect(permissions.some((p) => p.resource === 'teacher' && p.action === '*')).toBe(true);
      });

      it('should have classroom and grade management', () => {
        const permissions = getDefaultPermissionsForRole('SCHOOL_ADMIN');
        expect(permissions.some((p) => p.resource === 'classroom' && p.action === '*')).toBe(true);
        expect(permissions.some((p) => p.resource === 'grade' && p.action === '*')).toBe(true);
      });
    });

    describe('COORDINATOR', () => {
      it('should have school-scoped permissions', () => {
        const permissions = getDefaultPermissionsForRole('COORDINATOR');
        expect(permissions.length).toBeGreaterThan(0);
        expect(permissions.every((p) => p.scope === 'school')).toBe(true);
      });

      it('should have read and update permissions for classroom', () => {
        const permissions = getDefaultPermissionsForRole('COORDINATOR');
        expect(permissions.some((p) => p.resource === 'classroom' && p.action === 'read')).toBe(true);
        expect(permissions.some((p) => p.resource === 'classroom' && p.action === 'update')).toBe(true);
      });

      it('should not have delete permissions', () => {
        const permissions = getDefaultPermissionsForRole('COORDINATOR');
        expect(permissions.some((p) => p.action === 'delete')).toBe(false);
      });
    });

    describe('TEACHER', () => {
      it('should have school-scoped permissions', () => {
        const permissions = getDefaultPermissionsForRole('TEACHER');
        expect(permissions.length).toBeGreaterThan(0);
        expect(permissions.every((p) => p.scope === 'school')).toBe(true);
      });

      it('should only have read permissions', () => {
        const permissions = getDefaultPermissionsForRole('TEACHER');
        expect(permissions.every((p) => p.action === 'read')).toBe(true);
      });

      it('should have read access to school, classroom, student, enrollment', () => {
        const permissions = getDefaultPermissionsForRole('TEACHER');
        expect(permissions.some((p) => p.resource === 'school')).toBe(true);
        expect(permissions.some((p) => p.resource === 'classroom')).toBe(true);
        expect(permissions.some((p) => p.resource === 'student')).toBe(true);
        expect(permissions.some((p) => p.resource === 'enrollment')).toBe(true);
      });
    });

    describe('STUDENT', () => {
      it('should have own-scoped permissions', () => {
        const permissions = getDefaultPermissionsForRole('STUDENT');
        expect(permissions.length).toBeGreaterThan(0);
        expect(permissions.every((p) => p.scope === 'own')).toBe(true);
      });

      it('should only have read permissions', () => {
        const permissions = getDefaultPermissionsForRole('STUDENT');
        expect(permissions.every((p) => p.action === 'read')).toBe(true);
      });
    });

    describe('GUARDIAN', () => {
      it('should have own-scoped permissions', () => {
        const permissions = getDefaultPermissionsForRole('GUARDIAN');
        expect(permissions.length).toBeGreaterThan(0);
        expect(permissions.every((p) => p.scope === 'own')).toBe(true);
      });

      it('should only have read permissions', () => {
        const permissions = getDefaultPermissionsForRole('GUARDIAN');
        expect(permissions.every((p) => p.action === 'read')).toBe(true);
      });

      it('should have access to school and student', () => {
        const permissions = getDefaultPermissionsForRole('GUARDIAN');
        expect(permissions.some((p) => p.resource === 'school')).toBe(true);
        expect(permissions.some((p) => p.resource === 'student')).toBe(true);
      });
    });

    describe('ANALYST', () => {
      it('should have network-scoped permissions', () => {
        const permissions = getDefaultPermissionsForRole('ANALYST');
        expect(permissions.length).toBeGreaterThan(0);
        expect(permissions.every((p) => p.scope === 'network')).toBe(true);
      });

      it('should only have read permissions', () => {
        const permissions = getDefaultPermissionsForRole('ANALYST');
        expect(permissions.every((p) => p.action === 'read')).toBe(true);
      });

      it('should have access to reports and audit logs', () => {
        const permissions = getDefaultPermissionsForRole('ANALYST');
        expect(permissions.some((p) => p.resource === 'report')).toBe(true);
        expect(permissions.some((p) => p.resource === 'audit_log')).toBe(true);
      });
    });

    describe('SUPPORT', () => {
      it('should have network-scoped permissions', () => {
        const permissions = getDefaultPermissionsForRole('SUPPORT');
        expect(permissions.length).toBeGreaterThan(0);
        expect(permissions.every((p) => p.scope === 'network')).toBe(true);
      });

      it('should have read and update permissions for user', () => {
        const permissions = getDefaultPermissionsForRole('SUPPORT');
        expect(permissions.some((p) => p.resource === 'user' && p.action === 'read')).toBe(true);
        expect(permissions.some((p) => p.resource === 'user' && p.action === 'update')).toBe(true);
      });
    });

    describe('unknown role', () => {
      it('should return empty array for unknown role', () => {
        const permissions = getDefaultPermissionsForRole('UNKNOWN' as any);
        expect(permissions).toEqual([]);
      });
    });
  });

  describe('OWNERSHIP_RESOURCES', () => {
    it('should include student', () => {
      expect(OWNERSHIP_RESOURCES.has('student')).toBe(true);
    });

    it('should include enrollment', () => {
      expect(OWNERSHIP_RESOURCES.has('enrollment')).toBe(true);
    });

    it('should not include school_network', () => {
      expect(OWNERSHIP_RESOURCES.has('school_network')).toBe(false);
    });
  });

  describe('NETWORK_SCOPED_RESOURCES', () => {
    it('should include all expected resources', () => {
      expect(NETWORK_SCOPED_RESOURCES.has('school_network')).toBe(true);
      expect(NETWORK_SCOPED_RESOURCES.has('school')).toBe(true);
      expect(NETWORK_SCOPED_RESOURCES.has('school_year')).toBe(true);
      expect(NETWORK_SCOPED_RESOURCES.has('grade')).toBe(true);
      expect(NETWORK_SCOPED_RESOURCES.has('classroom')).toBe(true);
      expect(NETWORK_SCOPED_RESOURCES.has('student')).toBe(true);
      expect(NETWORK_SCOPED_RESOURCES.has('teacher')).toBe(true);
      expect(NETWORK_SCOPED_RESOURCES.has('enrollment')).toBe(true);
      expect(NETWORK_SCOPED_RESOURCES.has('user')).toBe(true);
      expect(NETWORK_SCOPED_RESOURCES.has('role')).toBe(true);
      expect(NETWORK_SCOPED_RESOURCES.has('permission')).toBe(true);
      expect(NETWORK_SCOPED_RESOURCES.has('settings')).toBe(true);
      expect(NETWORK_SCOPED_RESOURCES.has('report')).toBe(true);
      expect(NETWORK_SCOPED_RESOURCES.has('audit_log')).toBe(true);
    });

    it('should have correct size', () => {
      expect(NETWORK_SCOPED_RESOURCES.size).toBe(14);
    });
  });
});
