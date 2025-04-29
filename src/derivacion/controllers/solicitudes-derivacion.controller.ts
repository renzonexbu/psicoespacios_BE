import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SolicitudesDerivacionService } from '../services/solicitudes-derivacion.service';
import { CreateSolicitudDerivacionDto, UpdateSolicitudDerivacionDto, PagoSesionDto } from '../dto/solicitud-derivacion.dto';

@Controller('api/v1/derivacion/solicitudes')
@UseGuards(JwtAuthGuard)
export class SolicitudesDerivacionController {
  constructor(private readonly solicitudesService: SolicitudesDerivacionService) {}

  @Post()
  async create(
    @Body() createDto: CreateSolicitudDerivacionDto,
    @Request() req,
  ) {
    return this.solicitudesService.create(createDto, req.user.id);
  }

  @Get('recibidas')
  async findRecibidas(@Request() req) {
    return this.solicitudesService.findRecibidas(req.user.id);
  }

  @Get('enviadas')
  async findEnviadas(@Request() req) {
    return this.solicitudesService.findEnviadas(req.user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.solicitudesService.findOne(id);
  }

  @Post(':id/aceptar')
  async aceptar(
    @Param('id') id: string,
    @Request() req,
  ) {
    return this.solicitudesService.aceptar(id, req.user.id);
  }

  @Post(':id/rechazar')
  async rechazar(
    @Param('id') id: string,
    @Body('motivoRechazo') motivoRechazo: string,
    @Request() req,
  ) {
    return this.solicitudesService.rechazar(id, req.user.id, motivoRechazo);
  }

  @Post(':id/pagar')
  async procesarPago(
    @Param('id') id: string,
    @Body() pagoDto: PagoSesionDto,
    @Request() req,
  ) {
    return this.solicitudesService.procesarPago(id, pagoDto, req.user.id);
  }
}