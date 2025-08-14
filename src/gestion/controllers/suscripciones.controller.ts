import { Controller, Get, Post, Body, Param, Delete, Request, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { SuscripcionesService } from '../services/suscripciones.service';
import { CreateSuscripcionDto, UpdateSuscripcionDto, ConfigurarRenovacionDto, RenovarSuscripcionDto, ActivarSuscripcionDto } from '../dto/suscripcion.dto';

@Controller('api/v1/gestion/suscripciones')
export class SuscripcionesController {
  constructor(private readonly suscripcionesService: SuscripcionesService) {}

  // Endpoint principal para registrar suscripción mensual
  @Post('registrar-mensual')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PSICOLOGO')
  async registrarSuscripcionMensual(
    @Body() createSuscripcionDto: CreateSuscripcionDto,
    @Request() req
  ) {
    return this.suscripcionesService.registrarSuscripcionMensual(createSuscripcionDto, req.user.id);
  }

  // Endpoint existente (mantener compatibilidad)
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PSICOLOGO')
  async create(@Body() createSuscripcionDto: CreateSuscripcionDto, @Request() req) {
    return this.suscripcionesService.create(createSuscripcionDto, req.user.id);
  }

  @Get('mi-suscripcion')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PSICOLOGO')
  async findMiSuscripcion(@Request() req) {
    return this.suscripcionesService.findMiSuscripcion(req.user.id);
  }

  // Obtener información de renovación mensual
  @Get('renovacion-mensual/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PSICOLOGO')
  async getRenovacionMensualInfo(@Param('id') id: string) {
    return this.suscripcionesService.getRenovacionMensualInfo(id);
  }

  // Configurar renovación automática mensual
  @Post(':id/configurar-renovacion-mensual')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PSICOLOGO')
  async configurarRenovacionMensual(
    @Param('id') id: string,
    @Body() configDto: ConfigurarRenovacionDto,
    @Request() req
  ) {
    return this.suscripcionesService.configurarRenovacionMensual(id, configDto, req.user.id);
  }

  // Obtener próximas renovaciones mensuales
  @Get('proximas-renovaciones')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PSICOLOGO')
  async getProximasRenovacionesMensuales(@Request() req) {
    return this.suscripcionesService.getProximasRenovacionesMensuales(req.user.id);
  }

  // Obtener historial de pagos
  @Get(':id/historial-pagos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PSICOLOGO')
  async getHistorialPagos(@Param('id') id: string) {
    return this.suscripcionesService.getHistorialPagos(id);
  }

  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PSICOLOGO')
  async cancel(
    @Param('id') id: string,
    @Body() updateSuscripcionDto: UpdateSuscripcionDto,
    @Req() req: any,
  ) {
    return this.suscripcionesService.cancel(id, updateSuscripcionDto, req.user.id);
  }

  @Post(':id/renovar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PSICOLOGO')
  async renovar(
    @Param('id') id: string,
    @Body() renovarDto: RenovarSuscripcionDto,
    @Req() req: any,
  ) {
    return this.suscripcionesService.renovar(id, req.user.id, renovarDto);
  }

  // Activar una suscripción pendiente de pago
  @Post(':id/activar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PSICOLOGO')
  async activarSuscripcion(
    @Param('id') id: string,
    @Body() activarDto: ActivarSuscripcionDto,
    @Req() req: any,
  ) {
    return this.suscripcionesService.activarSuscripcion(id, activarDto.datosPago);
  }
}