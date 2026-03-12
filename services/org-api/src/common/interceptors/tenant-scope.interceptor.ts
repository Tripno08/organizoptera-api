import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { RequestWithTenant } from '../guards/tenant.guard';
import { tenantContext, TenantContext } from '../../prisma/prisma.service';

/**
 * Tenant Scope Interceptor - Stores tenant context for Prisma middleware
 *
 * CRITICAL ARCHITECTURE CHANGE (Codex Round 3):
 * ================================================
 *
 * OLD APPROACH (BROKEN - Round 2):
 * - Interceptor executed SET on one pooled connection
 * - Subsequent queries might use different connection
 * - Session variable lost → RLS NEVER activated
 * - Even session-level SET doesn't work with pooling
 *
 * NEW APPROACH (WORKING - Round 3):
 * - Interceptor stores tenant context in AsyncLocalStorage
 * - Prisma middleware (in PrismaService) reads context
 * - Middleware executes SET/query/RESET on SAME connection
 * - RLS always active for that specific query
 *
 * Flow:
 * 1. TenantGuard validates JWT, extracts networkId
 * 2. This interceptor stores networkId in AsyncLocalStorage
 * 3. Prisma middleware reads AsyncLocalStorage
 * 4. Middleware sets RLS variable on query connection
 * 5. Query executes on that connection (RLS active)
 * 6. Middleware resets variable after query
 *
 * Why AsyncLocalStorage:
 * - Thread-safe context propagation
 * - Automatically scoped to request lifecycle
 * - No manual cleanup needed
 * - Works with async/await and callbacks
 *
 * RLS Policy Example (PostgreSQL):
 * CREATE POLICY school_isolation ON schools
 *   USING (network_id = current_setting('app.current_org_id')::uuid);
 *
 * Result: ALL queries auto-filtered, impossible to access other tenants
 */

@Injectable()
export class TenantScopeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<RequestWithTenant>();

    // If no tenant context, proceed without RLS (public endpoints)
    if (!request.tenant?.networkId) {
      return next.handle();
    }

    // Store tenant context in AsyncLocalStorage
    // Prisma middleware will read this to scope queries
    const ctx: TenantContext = {
      networkId: request.tenant.networkId,
      userId: request.tenant.userId,
      role: request.tenant.role,
    };

    // Run request handler with tenant context
    return new Observable((observer) => {
      tenantContext.run(ctx, () => {
        next.handle().subscribe({
          next: (value) => observer.next(value),
          error: (err) => observer.error(err),
          complete: () => observer.complete(),
        });
      });
    });
  }
}
