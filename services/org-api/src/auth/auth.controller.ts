import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, LoginResponse } from './dto/login.dto';
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/login
   *
   * Public endpoint to obtain JWT token.
   *
   * Example:
   * curl -X POST http://localhost:5001/auth/login \
   *   -H "Content-Type: application/json" \
   *   -d '{"email":"admin@example.com","password":"password"}'
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<LoginResponse> {
    return this.authService.login(loginDto);
  }

  /**
   * POST /auth/refresh
   *
   * TODO: Implement token refresh (currently public for testing)
   */
  @Public()
  @Post('refresh')
  async refresh() {
    return { message: 'Token refresh not implemented yet' };
  }
}
