import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { PacksService } from './packs.service';
import { AsignarPackDto, CancelarAsignacionDto, CrearPackDto, CancelarPackDto, MarcarPagoMensualDto, ReembolsarPagoMensualDto } from './dto/packs.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('api/v1/packs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PacksController {
  constructor(private readonly packsService: PacksService) {}

  @Post()
  @Roles('ADMIN')
  crearPack(@Body() dto: CrearPackDto) {
    return this.packsService.crearPack(dto);
  }

  @Post('asignar')
  @Roles('ADMIN')
  asignarPack(@Body() dto: AsignarPackDto) {
    return this.packsService.asignarPack(dto);
  }

  @Put('asignacion/:id/cancelar')
  @Roles('ADMIN')
  cancelarAsignacion(@Param('id') asignacionId: string) {
    return this.packsService.cancelarAsignacion({ asignacionId });
  }

  @Put('cancelar')
  @Roles('ADMIN')
  cancelarPack(@Body() dto: CancelarPackDto) {
    return this.packsService.cancelarPack(dto);
  }

  @Get(':id')
  @Roles('ADMIN')
  getPack(@Param('id') id: string) {
    return this.packsService.getPack(id);
  }

  @Get()
  @Roles('ADMIN')
  listar(@Query('activo') activo?: string) {
    const filter = typeof activo === 'string' ? { activo: activo === 'true' } : undefined;
    return this.packsService.listarPacks(filter);
  }

  @Get('usuario/:usuarioId')
  @Roles('ADMIN', 'PSICOLOGO')
  getPacksByUsuario(@Param('usuarioId') usuarioId: string) {
    return this.packsService.getPacksByUsuario(usuarioId);
  }

  @Delete(':id')
  @Roles('ADMIN')
  softDelete(@Param('id') id: string) {
    return this.packsService.softDeletePack(id);
  }

  // Endpoints para pagos mensuales
  @Post('pagos/marcar')
  @Roles('ADMIN')
  marcarPagoMensual(@Body() dto: MarcarPagoMensualDto) {
    return this.packsService.marcarPagoMensual(dto.pagoId, {
      montoPagado: dto.montoPagado,
      metodoPago: dto.metodoPago,
      referenciaPago: dto.referenciaPago,
      observaciones: dto.observaciones
    });
  }

  @Post('pagos/reembolsar')
  @Roles('ADMIN')
  reembolsarPagoMensual(@Body() dto: ReembolsarPagoMensualDto) {
    return this.packsService.reembolsarPagoMensual(dto.pagoId, dto.montoReembolsado, dto.observaciones);
  }

  @Get('pagos/asignacion/:asignacionId')
  @Roles('ADMIN', 'PSICOLOGO')
  getPagosPorAsignacion(@Param('asignacionId') asignacionId: string) {
    return this.packsService.getPagosMensualesPorAsignacion(asignacionId);
  }

  @Get('pagos/usuario/:usuarioId')
  @Roles('ADMIN', 'PSICOLOGO')
  getPagosPorUsuario(@Param('usuarioId') usuarioId: string, @Query('mes') mes?: string) {
    return this.packsService.getPagosMensualesPorUsuario(usuarioId, mes);
  }

  @Get('pagos/pendientes')
  @Roles('ADMIN')
  getPagosPendientes() {
    return this.packsService.getPagosPendientes();
  }
}


