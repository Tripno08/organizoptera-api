import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

/**
 * Tenant Guard - Extracts and validates tenant (networkId) from JWT
 *
 * Security Requirements:
 * 1. MUST extract networkId from JWT claims
 * 2. MUST reject requests without valid tenant
 * 3. MUST attach tenant to request context
 * 4. MUST work with RLS policies in PostgreSQL
 * 5. MUST skip validation for @Public() routes
 *
 * Usage:
 * @UseGuards(TenantGuard)
 * async findAll(@Req() req: RequestWithTenant) {
 *   const networkId = req.tenant.networkId; // Guaranteed present
 * }
 */

export interface TenantContext {
  networkId: string;
  userId?: string;
  role?: string;
}

export interface RequestWithTenant extends Request {
  tenant: TenantContext;
}

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Skip tenant validation for public routes
    // Check both handler (method) and class level
    const isPublicHandler = this.reflector.get<boolean>('isPublic', context.getHandler());
    const isPublicClass = this.reflector.get<boolean>('isPublic', context.getClass());
    const isPublic = isPublicHandler || isPublicClass;

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithTenant>();

    // Extract tenant from JWT (decoded by AuthGuard/JWT middleware)
    const user = (request as any).user; // From JWT strategy

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Validate networkId presence
    const networkId = user.networkId || user.tenantId || user.organizationId;
    if (!networkId) {
      throw new ForbiddenException('Missing tenant information in token');
    }

    // Attach tenant context to request
    request.tenant = {
      networkId,
      userId: user.sub || user.userId,
      role: user.role,
    };

    return true;
  }
}
