import { Controller, Get, Post, Body, Param, Put, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PacientesService } from '../services/pacientes.service';
import { CreatePacienteDto, UpdatePacienteDto, CreateFichaSesionDto } from '../dto/paciente.dto';

@Controller('api/v1/gestion/pacientes')
@UseGuards(JwtAuthGuard)
export class PacientesController {
  constructor(private readonly pacientesService: PacientesService) {}

  @Get()
  async findAll(@Request() req) {
    return this.pacientesService.findAll(req.user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    return this.pacientesService.findOne(id, req.user.id);
  }

  @Post()
  async create(@Body() createPacienteDto: CreatePacienteDto, @Request() req) {
    return this.pacientesService.create(createPacienteDto, req.user.id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updatePacienteDto: UpdatePacienteDto,
    @Request() req,
  ) {
    return this.pacientesService.update(id, updatePacienteDto, req.user.id);
  }

  @Get(':id/fichas')
  async findFichas(@Param('id') id: string, @Request() req) {
    return this.pacientesService.findFichas(id, req.user.id);
  }

  @Post(':id/fichas')
  async createFicha(
    @Param('id') id: string,
    @Body() createFichaSesionDto: CreateFichaSesionDto,
    @Request() req,
  ) {
    return this.pacientesService.createFicha(id, createFichaSesionDto, req.user.id);
  }
}