import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './jwt.strategy';
import { LoginDto, LoginResponse } from './dto/login.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Hash password with bcrypt
   *
   * @param password - Plain text password
   * @returns Bcrypt hash
   */
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Verify password against bcrypt hash
   *
   * @param password - Plain text password
   * @param hash - Bcrypt hash from database
   * @returns True if password matches
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Login and generate JWT token
   *
   * Production implementation:
   * - Query real Teacher model from Prisma (teachers have email/passwordHash)
   * - Verify password with bcrypt.compare()
   * - Fetch user roles from school membership
   * - Complete tenant isolation via networkId
   *
   * Note: Teachers are the primary users in Organizoptera
   * Future: Add dedicated User model for non-teacher users (parents, admins)
   */
  async login(loginDto: LoginDto): Promise<LoginResponse> {
    // Look up teacher by email (using findUnique now that email is unique)
    const teacher = await this.prisma.teacher.findUnique({
      where: { email: loginDto.email },
      include: {
        school: {
          include: {
            network: true,
          },
        },
      },
    });

    // Validate user exists
    if (!teacher) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Validate password hash exists
    if (!teacher.passwordHash) {
      throw new UnauthorizedException('Account not properly configured');
    }

    // Verify password
    const isPasswordValid = await this.verifyPassword(
      loginDto.password,
      teacher.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Validate network exists
    if (!teacher.school?.network) {
      throw new UnauthorizedException('Network not found');
    }

    // Determine roles based on teacher assignments
    // For MVP: all teachers get 'Teacher' role
    // Future: fetch from TeacherClassroom assignments or dedicated role table
    const roles = ['Teacher'];

    // Generate JWT payload
    const payload: JwtPayload = {
      sub: teacher.id,
      email: teacher.email,
      networkId: teacher.school.network.id,
      roles,
    };

    // Sign JWT token
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      expiresIn: '24h',
      user: {
        id: teacher.id,
        email: teacher.email,
        networkId: teacher.school.network.id,
        roles,
      },
    };
  }

  /**
   * Validate JWT token
   *
   * This is called by JwtStrategy.validate()
   */
  async validateToken(payload: JwtPayload): Promise<boolean> {
    // Validate payload structure
    if (!payload.sub || !payload.networkId) {
      return false;
    }

    // Optionally: verify user still exists and is active
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: payload.sub },
      select: { id: true },
    });

    return !!teacher;
  }
}
