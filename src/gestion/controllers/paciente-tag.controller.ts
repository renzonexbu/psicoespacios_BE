import { Controller, Post, Get, Put, Delete, Body, Param, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { PacienteTagService } from '../services/paciente-tag.service';
import { UpdatePacienteTagDto, RemovePacienteTagDto } from '../dto/update-paciente-tag.dto';

@Controller('api/v1/pacientes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PacienteTagController {
  constructor(private readonly pacienteTagService: PacienteTagService) {}

  /**
   * Asignar tag a un paciente
   * POST /api/v1/pacientes/:pacienteId/tag
   */
  @Post(':pacienteId/tag')
  @Roles(Role.PSICOLOGO, Role.ADMIN)
  async asignarTag(
    @Param('pacienteId') pacienteId: string,
    @Body() updateTagDto: UpdatePacienteTagDto,
    @Request() req
  ) {
    return this.pacienteTagService.asignarTag(pacienteId, updateTagDto, req.user.id);
  }

  /**
   * Remover tag de un paciente
   * DELETE /api/v1/pacientes/:pacienteId/tag
   */
  @Delete(':pacienteId/tag')
  @Roles(Role.PSICOLOGO, Role.ADMIN)
  async removerTag(
    @Param('pacienteId') pacienteId: string,
    @Body() removeTagDto: RemovePacienteTagDto,
    @Request() req
  ) {
    return this.pacienteTagService.removerTag(pacienteId, removeTagDto, req.user.id);
  }

  /**
   * Obtener tag de un paciente
   * GET /api/v1/pacientes/:pacienteId/tag
   */
  @Get(':pacienteId/tag')
  @Roles(Role.PSICOLOGO, Role.ADMIN)
  async obtenerTag(
    @Param('pacienteId') pacienteId: string,
    @Request() req
  ) {
    return this.pacienteTagService.obtenerTag(pacienteId, req.user.id);
  }

  /**
   * Listar todos los pacientes con tags de un psicólogo
   * GET /api/v1/pacientes/tags
   */
  @Get('tags')
  @Roles(Role.PSICOLOGO, Role.ADMIN)
  async listarPacientesConTags(@Request() req) {
    return this.pacienteTagService.listarPacientesConTags(req.user.id);
  }
}
