import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { TenantGuard } from './tenant.guard';
import { RBACGuard } from './rbac.guard';

/**
 * Guards Module
 *
 * Centralizes guard configuration and registration.
 * Guards are applied in order: JWT → Tenant → RBAC
 *
 * Note: Guards are registered both as regular providers AND as APP_GUARD
 * to ensure proper dependency injection in both production and test environments.
 */
@Module({
  providers: [
    // First, register guards as normal providers so DI can inject dependencies
    JwtAuthGuard,
    TenantGuard,
    RBACGuard,
    // Then, register them as APP_GUARD using useExisting
    {
      provide: APP_GUARD,
      useExisting: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useExisting: TenantGuard,
    },
    {
      provide: APP_GUARD,
      useExisting: RBACGuard,
    },
  ],
})
export class GuardsModule {}
