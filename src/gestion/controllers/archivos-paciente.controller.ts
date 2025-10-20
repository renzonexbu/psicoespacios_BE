import { Controller, Get, Param, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { ArchivosPacienteService } from '../services/archivos-paciente.service';
import { FiltrosArchivosPacienteDto } from '../dto/archivos-paciente.dto';

@Controller('api/v1/pacientes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ArchivosPacienteController {
  constructor(private readonly archivosPacienteService: ArchivosPacienteService) {}

  /**
   * Obtener todos los archivos compartidos del paciente autenticado
   * GET /api/v1/pacientes/mis-archivos
   */
  @Get('mis-archivos')
  @Roles(Role.PACIENTE)
  async obtenerMisArchivos(
    @Query() filtros: FiltrosArchivosPacienteDto,
    @Request() req
  ) {
    return this.archivosPacienteService.obtenerArchivosPaciente(req.user.id, filtros);
  }

  /**
   * Obtener un archivo específico del paciente autenticado
   * GET /api/v1/pacientes/mis-archivos/:archivoId
   */
  @Get('mis-archivos/:archivoId')
  @Roles(Role.PACIENTE)
  async obtenerMiArchivo(
    @Param('archivoId') archivoId: string,
    @Request() req
  ) {
    return this.archivosPacienteService.obtenerArchivoPaciente(archivoId, req.user.id);
  }

  /**
   * Obtener estadísticas de archivos del paciente autenticado
   * GET /api/v1/pacientes/mis-archivos/estadisticas
   */
  @Get('mis-archivos/estadisticas')
  @Roles(Role.PACIENTE)
  async obtenerEstadisticasArchivos(@Request() req) {
    return this.archivosPacienteService.obtenerEstadisticasArchivos(req.user.id);
  }

  /**
   * Obtener archivos de un paciente específico (para psicólogos y admins)
   * GET /api/v1/pacientes/:pacienteId/archivos
   */
  @Get(':pacienteId/archivos')
  @Roles(Role.PSICOLOGO, Role.ADMIN)
  async obtenerArchivosPaciente(
    @Param('pacienteId') pacienteId: string,
    @Query() filtros: FiltrosArchivosPacienteDto,
    @Request() req
  ) {
    // TODO: Agregar validación de permisos para psicólogos
    return this.archivosPacienteService.obtenerArchivosPaciente(pacienteId, filtros);
  }
}























