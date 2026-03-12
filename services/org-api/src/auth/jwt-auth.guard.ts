import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

/**
 * JWT Authentication Guard
 *
 * Extends @nestjs/passport AuthGuard to validate JWT tokens.
 * Supports public routes via @Public() decorator.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Check if route is marked as public
    // Check both handler (method) and class level
    const isPublicHandler = this.reflector.get<boolean>('isPublic', context.getHandler());
    const isPublicClass = this.reflector.get<boolean>('isPublic', context.getClass());
    const isPublic = isPublicHandler || isPublicClass;

    if (isPublic) {
      return true;
    }

    // Validate JWT token via PassportStrategy
    return super.canActivate(context);
  }
}
