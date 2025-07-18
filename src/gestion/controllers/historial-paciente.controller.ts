import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { HistorialPacienteService } from '../services/historial-paciente.service';
import { CreateHistorialPacienteDto, UpdateHistorialPacienteDto } from '../dto/historial-paciente.dto';

@Controller('api/v1/gestion/historial-paciente')
export class HistorialPacienteController {
  constructor(private readonly historialService: HistorialPacienteService) {}

  @Post()
  async create(@Body() dto: CreateHistorialPacienteDto) {
    return this.historialService.create(dto);
  }

  @Get()
  async findAll() {
    return this.historialService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.historialService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateHistorialPacienteDto) {
    return this.historialService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.historialService.remove(id);
  }

  @Get('paciente/:idUsuarioPaciente')
  async findByPaciente(@Param('idUsuarioPaciente') idUsuarioPaciente: string) {
    return this.historialService.findByPaciente(idUsuarioPaciente);
  }
} 