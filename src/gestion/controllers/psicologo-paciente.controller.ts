import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { PsicologoPacienteService } from '../services/psicologo-paciente.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('api/v1/gestion/psicologo-paciente')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PsicologoPacienteController {
  constructor(private readonly psicologoPacienteService: PsicologoPacienteService) {}

  @Get('paciente/:usuarioId/psicologo')
  @Roles(Role.ADMIN, Role.PSICOLOGO, Role.PACIENTE)
  async getPsicologoByPacienteUsuario(@Param('usuarioId') usuarioId: string) {
    return this.psicologoPacienteService.getPsicologoByPacienteUsuario(usuarioId);
  }

  @Get('paciente/:pacienteId/psicologo')
  @Roles(Role.ADMIN, Role.PSICOLOGO, Role.PACIENTE)
  async getPsicologoByPacienteId(@Param('pacienteId') pacienteId: string) {
    return this.psicologoPacienteService.getPsicologoByPacienteId(pacienteId);
  }
}
