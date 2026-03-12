/**
 * @module @organizoptera/rbac/constants
 * @description RBAC constants and default configurations
 */

import type { BuiltInRole, Permission, PermissionScope, PermissionAction, ResourceType } from '@organizoptera/types';
import { permissionId } from '@organizoptera/types';

/**
 * Built-in role hierarchy
 * Higher number = more permissions
 */
export const ROLE_HIERARCHY: Record<BuiltInRole, number> = {
  SUPER_ADMIN: 100,
  NETWORK_ADMIN: 90,
  SCHOOL_ADMIN: 80,
  COORDINATOR: 70,
  TEACHER: 50,
  STUDENT: 30,
  GUARDIAN: 20,
  ANALYST: 40,
  SUPPORT: 60,
};

/**
 * Permission action weights for comparison
 */
export const ACTION_WEIGHTS: Record<PermissionAction, number> = {
  '*': 100,
  manage: 80,
  delete: 60,
  update: 40,
  create: 30,
  read: 10,
};

/**
 * Scope hierarchy (broader scope includes narrower)
 */
export const SCOPE_HIERARCHY: Record<PermissionScope, number> = {
  global: 100,
  network: 75,
  school: 50,
  own: 25,
};

/**
 * Default permissions for built-in roles
 */
export function getDefaultPermissionsForRole(role: BuiltInRole): Permission[] {
  const now = new Date();

  const createPermission = (
    resource: ResourceType,
    action: PermissionAction,
    scope: PermissionScope
  ): Permission => ({
    id: permissionId(`${role}-${resource}-${action}`),
    resource,
    action,
    scope,
    createdAt: now,
    updatedAt: now,
  });

  switch (role) {
    case 'SUPER_ADMIN':
      return [createPermission('school_network', '*', 'global')];

    case 'NETWORK_ADMIN':
      return [
        createPermission('school_network', 'read', 'network'),
        createPermission('school_network', 'update', 'network'),
        createPermission('school', '*', 'network'),
        createPermission('user', '*', 'network'),
        createPermission('role', 'manage', 'network'),
        createPermission('settings', '*', 'network'),
        createPermission('report', 'read', 'network'),
        createPermission('audit_log', 'read', 'network'),
      ];

    case 'SCHOOL_ADMIN':
      return [
        createPermission('school', 'read', 'school'),
        createPermission('school', 'update', 'school'),
        createPermission('school_year', '*', 'school'),
        createPermission('grade', '*', 'school'),
        createPermission('classroom', '*', 'school'),
        createPermission('student', '*', 'school'),
        createPermission('teacher', '*', 'school'),
        createPermission('enrollment', '*', 'school'),
        createPermission('user', 'manage', 'school'),
        createPermission('settings', 'manage', 'school'),
        createPermission('report', 'read', 'school'),
      ];

    case 'COORDINATOR':
      return [
        createPermission('school', 'read', 'school'),
        createPermission('classroom', 'read', 'school'),
        createPermission('classroom', 'update', 'school'),
        createPermission('student', 'read', 'school'),
        createPermission('student', 'update', 'school'),
        createPermission('teacher', 'read', 'school'),
        createPermission('enrollment', 'read', 'school'),
        createPermission('enrollment', 'create', 'school'),
        createPermission('report', 'read', 'school'),
      ];

    case 'TEACHER':
      return [
        createPermission('school', 'read', 'school'),
        createPermission('classroom', 'read', 'school'),
        createPermission('student', 'read', 'school'),
        createPermission('enrollment', 'read', 'school'),
      ];

    case 'STUDENT':
      return [
        createPermission('school', 'read', 'own'),
        createPermission('classroom', 'read', 'own'),
        createPermission('student', 'read', 'own'),
      ];

    case 'GUARDIAN':
      return [
        createPermission('school', 'read', 'own'),
        createPermission('student', 'read', 'own'),
      ];

    case 'ANALYST':
      return [
        createPermission('school_network', 'read', 'network'),
        createPermission('school', 'read', 'network'),
        createPermission('student', 'read', 'network'),
        createPermission('report', 'read', 'network'),
        createPermission('audit_log', 'read', 'network'),
      ];

    case 'SUPPORT':
      return [
        createPermission('school_network', 'read', 'network'),
        createPermission('school', 'read', 'network'),
        createPermission('user', 'read', 'network'),
        createPermission('user', 'update', 'network'),
        createPermission('settings', 'read', 'network'),
      ];

    default:
      return [];
  }
}

/**
 * Resources that require ownership validation
 */
export const OWNERSHIP_RESOURCES: Set<ResourceType> = new Set([
  'student',
  'enrollment',
]);

/**
 * Resources that are network-scoped
 */
export const NETWORK_SCOPED_RESOURCES: Set<ResourceType> = new Set([
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
]);
