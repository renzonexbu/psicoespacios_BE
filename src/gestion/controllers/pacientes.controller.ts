import { Controller, Get, Post, Body, Param, Put, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { PacientesService } from '../services/pacientes.service';
import { CreatePacienteDto, UpdatePacienteDto } from '../dto/paciente.dto';
import { PsicologosService } from '../services/psicologos.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.PSICOLOGO)
  async findOne(@Param('id') id: string, @Request() req: any) {
    // Obtener datos del paciente (incluye idUsuarioPsicologo)
    const paciente = await this.pacientesService.findOne(id);

    // Si es ADMIN, puede ver cualquier paciente
    if (req.user?.role === Role.ADMIN) {
      return paciente;
    }

    // Si es PSICOLOGO, validar que sea el asignado al paciente
    if (req.user?.role === Role.PSICOLOGO) {
      const psicologo = await this.psicologosService.findByUserId(req.user.id);
      if (!psicologo || paciente.idUsuarioPsicologo !== psicologo.id) {
        throw new ForbiddenException('No tienes permisos para ver esta información');
      }
      return paciente;
    }

    // Cualquier otro rol no permitido
    throw new ForbiddenException('No tienes permisos para ver esta información');
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