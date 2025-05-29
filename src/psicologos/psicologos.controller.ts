import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { PsicologosService } from './psicologos.service';
import { CreatePsicologoDto } from './dto/create-psicologo.dto';
import { UpdatePsicologoDto } from './dto/update-psicologo.dto';
import { QueryDisponibilidadDiasDto } from './dto/query-disponibilidad-dias.dto';
import { QueryDisponibilidadHorariosDto } from './dto/query-disponibilidad-horarios.dto';
import { CreateReservaDto } from './dto/create-reserva.dto';
import { QueryHistorialTurnosDto } from './dto/query-historial-turnos.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('api/v1/psicologos')
export class PsicologosController {
  constructor(private readonly psicologosService: PsicologosService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PSICOLOGO')
  create(@Body() createPsicologoDto: CreatePsicologoDto) {
    return this.psicologosService.create(createPsicologoDto);
  }

  @Get('disponibilidad/dias')
  consultarDiasDisponibles(@Query() query: QueryDisponibilidadDiasDto) {
    return this.psicologosService.consultarDiasDisponibles(query);
  }

  @Get('disponibilidad/horarios')
  consultarHorariosDisponibles(@Query() query: QueryDisponibilidadHorariosDto) {
    return this.psicologosService.consultarHorariosDisponibles(query);
  }

  @Post('reservas')
  @UseGuards(JwtAuthGuard)
  reservarTurno(@Body() createReservaDto: CreateReservaDto) {
    return this.psicologosService.reservarTurno(createReservaDto);
  }

  @Get('pacientes/:pacienteId/historial-turnos')
  @UseGuards(JwtAuthGuard)
  historialTurnosPaciente(@Param('pacienteId') pacienteId: string, @Query() query: QueryHistorialTurnosDto) {
    return this.psicologosService.historialTurnosPaciente(pacienteId, query);
  }

  // Endpoints CRUD básicos para Psicologos
  @Get()
  findAll() {
    return this.psicologosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.psicologosService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PSICOLOGO')
  update(@Param('id') id: string, @Body() updatePsicologoDto: UpdatePsicologoDto) {
    return this.psicologosService.update(id, updatePsicologoDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.psicologosService.remove(id);
  }
}
