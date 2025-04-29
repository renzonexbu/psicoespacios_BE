import { Controller, Get, Put, Post, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminService } from '../services/admin.service';
import { UpdateConfiguracionDto } from '../dto/configuracion.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('api/v1/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('configuracion')
  async getConfiguracion() {
    return this.adminService.getConfiguracion();
  }

  @Put('configuracion')
  async updateConfiguracion(@Body() updateDto: UpdateConfiguracionDto) {
    return this.adminService.updateConfiguracion(updateDto);
  }

  @Get('estadisticas')
  async getEstadisticasSistema() {
    return this.adminService.getEstadisticasSistema();
  }

  @Post('psicologos/:id/verificar')
  async verificarPsicologo(@Param('id') id: string) {
    return this.adminService.verificarPsicologo(id);
  }

  @Post('psicologos/:id/suspender')
  async suspenderPsicologo(@Param('id') id: string) {
    return this.adminService.suspenderPsicologo(id);
  }
}