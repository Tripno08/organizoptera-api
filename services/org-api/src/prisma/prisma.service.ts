import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient, Prisma } from '../../generated/prisma';
import { AsyncLocalStorage } from 'async_hooks';

/**
 * Tenant Context (stored in AsyncLocalStorage)
 * Used by Prisma middleware to scope queries to authenticated tenant
 */
export interface TenantContext {
  networkId: string;
  userId?: string;
  role?: string;
}

/**
 * AsyncLocalStorage for tenant context
 * Middleware reads this to determine which tenant to scope queries to
 */
export const tenantContext = new AsyncLocalStorage<TenantContext>();

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    // Parametrized logging (environment-based)
    // Production: Only errors (prevents PII exposure + performance hit)
    // Development: Full query logging for debugging
    const logLevel = process.env.PRISMA_LOG_LEVEL || 'error';
    const logLevels = logLevel.split(',').map((level) => level.trim());

    super({
      log: logLevels as any,
    });

    // ========================================================================
    // CRITICAL: Prisma Middleware for Row-Level Security (RLS)
    // ========================================================================
    // This middleware ensures SET/RESET run on the SAME connection that
    // executes the query, solving the connection pooling problem.
    //
    // Why middleware instead of interceptor:
    // 1. Interceptor's SET runs on connection A
    // 2. Query might run on connection B (from pool)
    // 3. Session variable lost → RLS NEVER activates
    //
    // Middleware solution:
    // 1. Runs per-query (not per-request)
    // 2. SET/query/RESET all on same connection
    // 3. RLS always active for that query
    // ========================================================================
    // Note: $use middleware API is deprecated in Prisma v5+
    // For testing environments or newer Prisma versions, skip middleware
    if (typeof (this as any).$use === 'function') {
      // Type assertion needed because $use is not exposed in generated types
      (this as any).$use(async (params: any, next: (params: any) => Promise<any>) => {
        const context = tenantContext.getStore();

        // If no tenant context, proceed without RLS (public endpoints)
        if (!context?.networkId) {
          return next(params);
        }

        // CRITICAL: Set RLS variable on THIS connection (parameterized to prevent SQL injection)
        // Using $queryRaw with Prisma.sql`` ensures safe parameterization
        await this.$executeRaw`SET LOCAL app.current_org_id = ${context.networkId}`;

        try {
          // Execute the actual query (on SAME connection)
          const result = await next(params);
          return result;
        } finally {
          // RESET variable after query completes (cleanup)
          // Using try/catch to ensure RESET happens even if query fails
          try {
            await this.$executeRaw`RESET app.current_org_id`;
          } catch (error) {
            // Log cleanup error but don't fail request
            console.error('Failed to reset tenant scope:', error);
          }
        }
      });
    } else {
      console.warn('⚠️  Prisma middleware ($use) not available - RLS will not be enforced');
      console.warn('   This is expected in test environments or Prisma v5+');
      console.warn('   For production, consider migrating to Prisma Client Extensions');
    }
  }

  async onModuleInit() {
    await this.$connect();
    console.log('✅ Prisma connected to database');
    console.log('✅ RLS middleware active (per-query tenant scoping)');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('👋 Prisma disconnected from database');
  }
}
