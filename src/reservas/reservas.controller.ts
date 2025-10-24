import { Controller, Get, Post, Body, Param, Delete, Query, UseGuards, Request, Put } from '@nestjs/common';
import { ReservasService } from './reservas.service';
import { CreateReservaDto, UpdateReservaDto, UpdateEstadoPagoDto, BulkUpdateEstadoPagoDto } from './dto/reserva.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('api/v1/reservas')
@UseGuards(JwtAuthGuard)
export class ReservasController {
  constructor(private readonly reservasService: ReservasService) {}

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.reservasService.findOne(id);
  }

  @Get()
  async findByPsicologoAndFecha(
    @Query('psicologoId') psicologoId: string,
    @Query('fecha') fecha: string,
  ) {
    if (!psicologoId || !fecha) {
      return { error: 'psicologoId y fecha son requeridos' };
    }
    return this.reservasService.findByPsicologoAndFecha(psicologoId, fecha);
  }

  @Post()
  async create(@Body() createReservaDto: CreateReservaDto) {
    return this.reservasService.create(createReservaDto);
  }

  @Post(':id/cancel')
  @UseGuards(RolesGuard)
  @Roles('PSICOLOGO')
  async cancel(
    @Param('id') id: string,
    @Body() updateReservaDto: UpdateReservaDto,
    @Request() req,
  ) {
    return this.reservasService.cancel(id, updateReservaDto, req.user.id);
  }

  /**
   * Obtener todas las reservas de una sede específica (solo para administradores)
   */
  @Get('admin/sede/:sedeId')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async findBySede(@Param('sedeId') sedeId: string) {
    return this.reservasService.findBySede(sedeId);
  }

  /**
   * Obtener todas las reservas de un usuario específico (solo para administradores)
   */
  @Get('admin/usuario/:usuarioId')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async findByUsuario(@Param('usuarioId') usuarioId: string) {
    return this.reservasService.findByUsuario(usuarioId);
  }

  /**
   * Actualizar el estado de pago de una reserva (solo para administradores)
   */
  @Put(':id/estado-pago')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async updateEstadoPago(
    @Param('id') id: string,
    @Body() updateEstadoPagoDto: UpdateEstadoPagoDto
  ) {
    return this.reservasService.updateEstadoPago(id, updateEstadoPagoDto);
  }

  /**
   * Actualizar múltiples estados de pago de reservas (solo para administradores)
   */
  @Put('admin/bulk-estado-pago')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async bulkUpdateEstadoPago(
    @Body() bulkUpdateDto: BulkUpdateEstadoPagoDto
  ) {
    return this.reservasService.bulkUpdateEstadoPago(bulkUpdateDto);
  }

  /**
   * Obtener historial de pago de una reserva (solo para administradores)
   */
  @Get(':id/historial-pago')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async getHistorialPago(@Param('id') id: string) {
    return this.reservasService.getHistorialPago(id);
  }
}