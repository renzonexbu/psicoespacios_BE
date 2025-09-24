import { Controller, Post, Body, UseGuards, Request, Get, Patch, Param } from '@nestjs/common';
// import { AuthService } from './auth.service';
import { AuthService } from './auth.service';

import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { AssignSubrolDto } from './dto/assign-subrol.dto';
import { AssignSubrolResponseDto } from './dto/assign-subrol-response.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(loginDto);
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('refresh-token')
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refresh_token);
  }

  @Post('logout')
  async logout(@Body() refreshTokenDto: RefreshTokenDto) {
    await this.authService.revokeRefreshToken(refreshTokenDto.refresh_token);
    return { message: 'Refresh token revocado' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    // Buscar el usuario por ID y devolver todos los campos
    const user = await this.authService.getFullProfile(req.user.id);
    return { user };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(@Request() req, @Body() updateDto: any) {
    const user = await this.authService.updateProfile(req.user.id, updateDto);
    return { user };
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(@Request() req, @Body() body: { currentPassword: string, newPassword: string }) {
    await this.authService.changePassword(req.user.id, body.currentPassword, body.newPassword);
    return { message: 'Contraseña actualizada correctamente' };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('assign-subrol')
  async assignSubrol(@Body() assignSubrolDto: AssignSubrolDto): Promise<AssignSubrolResponseDto> {
    return this.authService.assignSubrol(assignSubrolDto.userId, assignSubrolDto.subrol);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('pending-psychologists')
  async getPendingPsychologists() {
    return this.authService.getPendingPsychologists();
  }
}

// Nuevo controlador para exponer información de usuario por id
// import { Controller, Get, Param, UseGuards } from '@nestjs/common';

@Controller('api/v1/users')
export class UsersController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getUserById(@Param('id') id: string) {
    return this.authService.getFullProfile(id);
  }
}