import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * RBAC (Role-Based Access Control) Guard
 *
 * Checks if authenticated user has required roles for the route.
 * Works in conjunction with @Roles() decorator.
 *
 * IMPORTANT: This guard depends on JwtAuthGuard to populate request.user.
 * Ensure JwtAuthGuard is applied globally BEFORE this guard.
 */
@Injectable()
export class RBACGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Skip RBAC check for public routes
    // Check both handler (method) and class level
    const isPublicHandler = this.reflector.get<boolean>('isPublic', context.getHandler());
    const isPublicClass = this.reflector.get<boolean>('isPublic', context.getClass());
    const isPublic = isPublicHandler || isPublicClass;

    if (isPublic) {
      return true;
    }

    // Get required roles from @Roles() decorator
    const rolesHandler = this.reflector.get<string[]>('roles', context.getHandler());
    const rolesClass = this.reflector.get<string[]>('roles', context.getClass());
    const requiredRoles = rolesHandler || rolesClass;

    // If no roles specified, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // User should exist (populated by JwtStrategy)
    if (!user || !user.roles) {
      throw new ForbiddenException('User roles not found');
    }

    // Check if user has at least one of the required roles
    const hasRole = requiredRoles.some((role) => user.roles.includes(role));

    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied. Required roles: ${requiredRoles.join(', ')}. User roles: ${user.roles.join(', ')}`
      );
    }

    return true;
  }
}
