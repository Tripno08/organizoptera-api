/**
 * DocenTe Permissions Guard
 *
 * NestJS guard for checking DocenTe-specific permissions.
 * Uses RBAC system with scope-based access control.
 *
 * @module @organizoptera/org-api/rbac/docente-permissions.guard
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  DocenteResource,
  DocenteAction,
  DocentePermissionRequirement,
  DOCENTE_PERMISSIONS_KEY,
  hasDocentePermission,
  requiresAuditLog,
} from './docente-permissions';

// =============================================================================
// DECORATOR
// =============================================================================

/**
 * Decorator to require DocenTe permissions on a route
 *
 * @example
 * @RequireDocentePermissions({
 *   resource: DocenteResource.DOCENTE_PROFILE,
 *   action: DocenteAction.VIEW_SENSITIVE,
 *   scopeField: 'params.teacherId'
 * })
 */
export const RequireDocentePermissions = (
  ...requirements: DocentePermissionRequirement[]
) => SetMetadata(DOCENTE_PERMISSIONS_KEY, requirements);

// =============================================================================
// GUARD
// =============================================================================

@Injectable()
export class DocentePermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requirements = this.reflector.getAllAndOverride<
      DocentePermissionRequirement[]
    >(DOCENTE_PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    if (!requirements || requirements.length === 0) {
      return true; // No DocenTe permission required
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Get user's role (simplified - in production, this would come from a service)
    const userRole = user.role || 'GUEST';
    const userId = user.id;
    const userOrgId = user.orgId;

    for (const requirement of requirements) {
      const { resource, action, scopeField } = requirement;

      // Determine scope based on resource being accessed
      let scope: 'own' | 'org' | 'subtree' | 'all' = 'org';

      if (scopeField) {
        const resourceId = this.getNestedValue(request, scopeField);

        // If accessing own resource (e.g., own teacher profile)
        if (resourceId === userId) {
          scope = 'own';
        }
      }

      // Check permission
      const hasPermission = hasDocentePermission(
        userRole,
        resource,
        action,
        scope
      );

      if (!hasPermission) {
        // Log denied access attempt for sensitive resources
        if (requiresAuditLog(resource, action)) {
          await this.logAccessDenied(user, resource, action, request);
        }

        throw new ForbiddenException(
          `Insufficient permissions: ${resource}:${action} (scope: ${scope})`
        );
      }

      // Log successful access to sensitive resources
      if (requiresAuditLog(resource, action)) {
        await this.logAccessGranted(user, resource, action, request);
      }
    }

    return true;
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: unknown, path: string): unknown {
    return path.split('.').reduce((current: unknown, key: string) => {
      if (current && typeof current === 'object') {
        return (current as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj);
  }

  /**
   * Log access denied (for audit trail)
   */
  private async logAccessDenied(
    user: { id: string; role: string; orgId: string },
    resource: DocenteResource,
    action: DocenteAction,
    request: { path: string; method: string; ip: string }
  ): Promise<void> {
    // In production, this would write to audit log service
    console.warn('[DOCENTE_AUDIT] Access denied:', {
      userId: user.id,
      role: user.role,
      orgId: user.orgId,
      resource,
      action,
      path: request.path,
      method: request.method,
      ip: request.ip,
      timestamp: new Date().toISOString(),
      status: 'denied',
    });
  }

  /**
   * Log access granted (for audit trail)
   */
  private async logAccessGranted(
    user: { id: string; role: string; orgId: string },
    resource: DocenteResource,
    action: DocenteAction,
    request: { path: string; method: string; ip: string }
  ): Promise<void> {
    // In production, this would write to audit log service
    console.info('[DOCENTE_AUDIT] Access granted:', {
      userId: user.id,
      role: user.role,
      orgId: user.orgId,
      resource,
      action,
      path: request.path,
      method: request.method,
      ip: request.ip,
      timestamp: new Date().toISOString(),
      status: 'granted',
    });
  }
}

// =============================================================================
// CONVENIENCE DECORATORS
// =============================================================================

/**
 * Require permission to view own DocenTe profile
 */
export const CanViewOwnDocenteProfile = () =>
  RequireDocentePermissions({
    resource: DocenteResource.DOCENTE_PROFILE,
    action: DocenteAction.VIEW,
    scopeField: 'params.teacherId',
  });

/**
 * Require permission to view sensitive DocenTe data
 */
export const CanViewSensitiveDocente = () =>
  RequireDocentePermissions({
    resource: DocenteResource.DOCENTE_PROFILE,
    action: DocenteAction.VIEW_SENSITIVE,
  });

/**
 * Require permission to manage DocenTe profiles
 */
export const CanManageDocenteProfiles = () =>
  RequireDocentePermissions(
    {
      resource: DocenteResource.DOCENTE_PROFILE,
      action: DocenteAction.CREATE,
    },
    {
      resource: DocenteResource.DOCENTE_PROFILE,
      action: DocenteAction.UPDATE,
    }
  );

/**
 * Require permission to view DocenTe analytics
 */
export const CanViewDocenteAnalytics = () =>
  RequireDocentePermissions({
    resource: DocenteResource.DOCENTE_ANALYTICS,
    action: DocenteAction.VIEW_ANALYTICS,
  });

/**
 * Require permission to view identified DocenTe analytics
 */
export const CanViewIdentifiedAnalytics = () =>
  RequireDocentePermissions({
    resource: DocenteResource.DOCENTE_ANALYTICS,
    action: DocenteAction.VIEW_ANALYTICS_IDENTIFIED,
  });

/**
 * Require permission to manage interventions
 */
export const CanManageInterventions = () =>
  RequireDocentePermissions({
    resource: DocenteResource.DOCENTE_INTERVENTION,
    action: DocenteAction.MANAGE_INTERVENTIONS,
  });

/**
 * Require permission to configure DocenTe
 */
export const CanConfigureDocente = () =>
  RequireDocentePermissions({
    resource: DocenteResource.DOCENTE_CONFIG,
    action: DocenteAction.CONFIGURE,
  });

/**
 * Require permission to export DocenTe data
 */
export const CanExportDocente = () =>
  RequireDocentePermissions({
    resource: DocenteResource.DOCENTE_PROFILE,
    action: DocenteAction.EXPORT,
  });
