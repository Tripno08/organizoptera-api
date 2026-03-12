import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Login DTO with validation
 *
 * Used for POST /auth/login endpoint
 */
export class LoginDto {
  @ApiProperty({
    description: 'User email address',
    example: 'admin@example.com',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'password123',
    minLength: 6,
  })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;
}

/**
 * Login Response DTO
 */
export interface LoginResponse {
  accessToken: string;
  expiresIn: string;
  user: {
    id: string;
    email: string;
    networkId: string;
    roles: string[];
  };
}
