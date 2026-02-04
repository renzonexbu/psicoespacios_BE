import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Patch,
  Param,
  Query,
} from '@nestjs/common';
// import { AuthService } from './auth.service';
import { AuthService } from './auth.service';

import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { AssignSubrolDto } from './dto/assign-subrol.dto';
import { AssignSubrolResponseDto } from './dto/assign-subrol-response.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RecaptchaGuard } from '../common/recaptcha/recaptcha.guard';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @UseGuards(RecaptchaGuard)
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(loginDto);
  }

  @Post('register')
  @UseGuards(RecaptchaGuard)
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

  @Post('forgot-password')
  @UseGuards(RecaptchaGuard)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.email);
    return {
      success: true,
      message:
        'Si el correo existe, enviaremos instrucciones para recuperar tu contraseña.',
    };
  }

  @Post('reset-password')
  @UseGuards(RecaptchaGuard)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.newPassword);
    return {
      success: true,
      message: 'Contraseña actualizada correctamente',
    };
  }

  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    await this.authService.verifyEmail(token);
    return {
      success: true,
      message: 'Correo confirmado correctamente. Ya puedes iniciar sesión.',
    };
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
  async changePassword(
    @Request() req,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    await this.authService.changePassword(
      req.user.id,
      body.currentPassword,
      body.newPassword,
    );
    return { message: 'Contraseña actualizada correctamente' };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('assign-subrol')
  async assignSubrol(
    @Body() assignSubrolDto: AssignSubrolDto,
  ): Promise<AssignSubrolResponseDto> {
    return this.authService.assignSubrol(
      assignSubrolDto.userId,
      assignSubrolDto.subrol,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('pending-psychologists')
  async getPendingPsychologists() {
    return this.authService.getPendingPsychologists();
  }

  @UseGuards(JwtAuthGuard)
  @Get('onboarding-status')
  async checkOnboardingStatus(@Request() req) {
    const status = await this.authService.checkOnboardingStatus(req.user.id);
    return {
      success: true,
      hasOnboarding: status.hasOnboarding,
      psicologoId: status.psicologoId,
      message: status.hasOnboarding
        ? 'Onboarding completado'
        : 'Onboarding pendiente',
    };
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
