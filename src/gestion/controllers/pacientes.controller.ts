import { Controller, Get, Post, Body, Param, Put } from '@nestjs/common';
import { PacientesService } from '../services/pacientes.service';
import { CreatePacienteDto, UpdatePacienteDto } from '../dto/paciente.dto';
import { PsicologosService } from '../services/psicologos.service';

@Controller('api/v1/gestion/pacientes')
export class PacientesController {
  constructor(
    private readonly pacientesService: PacientesService,
    private readonly psicologosService: PsicologosService,
  ) {}

  @Get()
  async findAll() {
    return this.pacientesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.pacientesService.findOne(id);
  }

  @Get(':id/psicologo')
  async getPsicologoInfo(@Param('id') id: string) {
    const paciente = await this.pacientesService.findOne(id);
    // Buscar el psicólogo por el idUsuarioPsicologo (que es el id de usuario)
    const psicologo = await this.psicologosService.findByUserId(paciente.idUsuarioPsicologo);
    return psicologo;
  }

  @Get('usuario/:idUsuarioPaciente/psicologo')
  async getPsicologoInfoByUsuario(@Param('idUsuarioPaciente') idUsuarioPaciente: string) {
    const paciente = await this.pacientesService.findByUserId(idUsuarioPaciente);
    const psicologo = await this.psicologosService.findByUserId(paciente.idUsuarioPsicologo);
    return psicologo;
  }

  @Post()
  async create(@Body() createPacienteDto: CreatePacienteDto) {
    return this.pacientesService.create(createPacienteDto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updatePacienteDto: UpdatePacienteDto,
  ) {
    return this.pacientesService.update(id, updatePacienteDto);
  }
}