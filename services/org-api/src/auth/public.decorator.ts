import { SetMetadata } from '@nestjs/common';

/**
 * Public route decorator
 *
 * Use this to mark routes that don't require authentication.
 * Example:
 *
 * @Public()
 * @Get('/health')
 * async healthCheck() { ... }
 */
export const Public = () => SetMetadata('isPublic', true);
