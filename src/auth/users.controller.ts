import { Controller, Get, Put, Param, Body, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('api/v1/users')
export class UsersController {
  constructor(private readonly authService: AuthService) {}

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getAllUsers() {
    return this.authService.findAllUsers();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/perfil')
  async getProfile(
    @Param('id') id: string,
    @Request() req,
  ) {
    // Verificar que el usuario solo puede ver su propio perfil (a menos que sea admin)
    if (req.user.role !== 'ADMIN' && req.user.id !== id) {
      throw new BadRequestException('Solo puedes ver tu propio perfil');
    }

    return this.authService.getFullProfile(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getUserById(@Param('id') id: string) {
    return this.authService.getFullProfile(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/perfil')
  async updateProfile(
    @Param('id') id: string,
    @Body() updateData: { 
      experiencia?: string; 
      nombre?: string; 
      apellido?: string;
      telefono?: string;
      fechaNacimiento?: string;
      fotoUrl?: string;
      direccion?: string;
      especialidad?: string;
      numeroRegistroProfesional?: string;
    },
    @Request() req,
  ) {
    // Verificar que el usuario solo puede actualizar su propio perfil
    if (req.user.id !== id) {
      throw new BadRequestException('Solo puedes actualizar tu propio perfil');
    }

    return this.authService.updateProfile(id, updateData);
  }
} 