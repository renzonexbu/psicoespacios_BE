import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { ArchivosPacienteService } from '../services/archivos-paciente.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HistorialPaciente } from '../../common/entities/historial-paciente.entity';
import { Paciente } from '../../common/entities/paciente.entity';

@Controller('api/v1/debug')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DebugArchivosController {
  constructor(
    private readonly archivosPacienteService: ArchivosPacienteService,
    @InjectRepository(HistorialPaciente)
    private historialRepository: Repository<HistorialPaciente>,
    @InjectRepository(Paciente)
    private pacienteRepository: Repository<Paciente>,
  ) {}

  /**
   * Debug: Ver todos los registros de historial_paciente
   */
  @Get('historial-paciente')
  @Roles(Role.ADMIN)
  async debugHistorialPaciente() {
    const registros = await this.historialRepository.find({
      order: { createdAt: 'DESC' }
    });

    return {
      total: registros.length,
      registros: registros.map(r => ({
        id: r.id,
        tipo: r.tipo,
        idUsuarioPaciente: r.idUsuarioPaciente,
        descripcion: r.descripcion,
        url: r.url,
        createdAt: r.createdAt
      }))
    };
  }

  /**
   * Debug: Ver todos los pacientes
   */
  @Get('pacientes')
  @Roles(Role.ADMIN)
  async debugPacientes() {
    const pacientes = await this.pacienteRepository.find({
      order: { primeraSesionRegistrada: 'DESC' }
    });

    return {
      total: pacientes.length,
      pacientes: pacientes.map(p => ({
        id: p.id,
        idUsuarioPaciente: p.idUsuarioPaciente,
        idUsuarioPsicologo: p.idUsuarioPsicologo,
        estado: p.estado,
        tag: p.tag
      }))
    };
  }

  /**
   * Debug: Ver archivos de un paciente específico
   */
  @Get('archivos-paciente/:pacienteUserId')
  @Roles(Role.ADMIN)
  async debugArchivosPaciente(@Param('pacienteUserId') pacienteUserId: string) {
    try {
      const archivos = await this.archivosPacienteService.obtenerArchivosPaciente(pacienteUserId);
      return {
        pacienteUserId,
        totalArchivos: archivos.length,
        archivos
      };
    } catch (error) {
      return {
        pacienteUserId,
        error: error.message,
        archivos: []
      };
    }
  }
}





























