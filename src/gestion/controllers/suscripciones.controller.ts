import { Controller, Get, Post, Body, Param, Delete, Request, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { SuscripcionesService } from '../services/suscripciones.service';
import { CreateSuscripcionDto, UpdateSuscripcionDto } from '../dto/suscripcion.dto';

@Controller('api/v1/gestion/suscripciones')
export class SuscripcionesController {
  constructor(private readonly suscripcionesService: SuscripcionesService) {}

  @Post()
  async create(@Body() createSuscripcionDto: CreateSuscripcionDto, @Request() req) {
    return this.suscripcionesService.create(createSuscripcionDto, req.user.id);
  }

  @Get('mi-suscripcion')
  async findMiSuscripcion(@Request() req) {
    return this.suscripcionesService.findMiSuscripcion(req.user.id);
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
    @Req() req: any,
  ) {
    return this.suscripcionesService.renovar(id, req.user.id);
  }
}