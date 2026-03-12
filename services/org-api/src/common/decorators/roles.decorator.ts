import { SetMetadata } from '@nestjs/common';

/**
 * Roles decorator for RBAC
 *
 * Use this to specify required roles for a route.
 *
 * Example:
 * @Roles('OrgAdmin', 'Director')
 * @Post('/schools')
 * async createSchool() { ... }
 */
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
