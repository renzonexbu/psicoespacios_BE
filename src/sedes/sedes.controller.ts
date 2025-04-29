import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { SedesService } from './sedes.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ParseUUIDPipe } from '@nestjs/common';

@Controller('api/v1/sedes')
@UseGuards(JwtAuthGuard)
export class SedesController {
  constructor(private readonly sedesService: SedesService) {}

  @Get()
  async findAll() {
    return this.sedesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.sedesService.findOne(id);
  }

  @Get(':sede_id/boxes')
  async findBoxesBySede(@Param('sede_id', ParseUUIDPipe) sedeId: string) {
    return this.sedesService.findBoxesBySede(sedeId);
  }

  @Get(':sede_id/disponibilidad')
  async checkBoxAvailability(
    @Param('sede_id', ParseUUIDPipe) sedeId: string,
    @Query('fecha') fecha: string,
    @Query('hora_inicio') horaInicio: string,
    @Query('hora_fin') horaFin: string,
  ) {
    const fechaObj = new Date(fecha);
    return this.sedesService.checkBoxAvailability(
      sedeId,
      fechaObj,
      horaInicio,
      horaFin,
    );
  }
}