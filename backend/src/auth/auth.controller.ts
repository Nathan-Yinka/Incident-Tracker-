import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { BaseController } from '../common/base/base.controller';
import { LoggerService } from '../common/logger/logger.service';

@Controller('auth')
export class AuthController extends BaseController {
  constructor(
    private readonly authService: AuthService,
    logger: LoggerService,
  ) {
    super('AuthController', logger);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);
    return this.handleResponse(result, 'Login successful');
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: { id: string }) {
    const userData = await this.authService.validateUser(user.id);
    return this.handleResponse(userData, 'User retrieved successfully');
  }
}

