import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface JwtPayload {
  sub: string; // userId
  email: string;
  networkId: string; // Multi-tenant: network ID
  roles: string[]; // RBAC roles
  iat?: number;
  exp?: number;
}

export interface RequestUser {
  userId: string;
  email: string;
  networkId: string;
  roles: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'organizoptera-dev-secret-change-in-production',
    });
  }

  /**
   * This method is called after JWT is verified.
   * It populates request.user with the decoded token payload.
   *
   * CRITICAL: This is the PRE-REQUISITE for all tenant-scoped guards.
   * request.user.networkId is used by TenantGuard and TenantScopeInterceptor.
   */
  async validate(payload: JwtPayload): Promise<RequestUser> {
    if (!payload.sub || !payload.networkId) {
      throw new UnauthorizedException('Invalid token: missing required claims');
    }

    return {
      userId: payload.sub,
      email: payload.email,
      networkId: payload.networkId,
      roles: payload.roles || [],
    };
  }
}
