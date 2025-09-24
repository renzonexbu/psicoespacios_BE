import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HistorialPaciente } from '../../common/entities/historial-paciente.entity';
import { Paciente } from '../../common/entities/paciente.entity';
import { Psicologo } from '../../common/entities/psicologo.entity';
import { User } from '../../common/entities/user.entity';
import { ArchivoPacienteDto, FiltrosArchivosPacienteDto } from '../dto/archivos-paciente.dto';

@Injectable()
export class ArchivosPacienteService {
  private readonly logger = new Logger(ArchivosPacienteService.name);

  constructor(
    @InjectRepository(HistorialPaciente)
    private historialRepository: Repository<HistorialPaciente>,
    @InjectRepository(Paciente)
    private pacienteRepository: Repository<Paciente>,
    @InjectRepository(Psicologo)
    private psicologoRepository: Repository<Psicologo>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * Obtiene todos los archivos compartidos de un paciente
   */
  async obtenerArchivosPaciente(
    pacienteUserId: string,
    filtros?: FiltrosArchivosPacienteDto
  ): Promise<ArchivoPacienteDto[]> {
    this.logger.log(`Obteniendo archivos del paciente ${pacienteUserId}`);

    // 1. Verificar que el paciente existe
    const paciente = await this.pacienteRepository.findOne({
      where: { idUsuarioPaciente: pacienteUserId }
    });

    if (!paciente) {
      throw new NotFoundException('Paciente no encontrado');
    }

    this.logger.log(`Paciente encontrado: ${paciente.id}, idUsuarioPaciente: ${paciente.idUsuarioPaciente}`);

    // 2. Construir query con filtros - buscar por el ID de la tabla pacientes
    const queryBuilder = this.historialRepository
      .createQueryBuilder('historial')
      .where('historial.idUsuarioPaciente = :pacienteId', { pacienteId: paciente.id })
      .andWhere('historial.url IS NOT NULL') // Solo archivos con URL
      .orderBy('historial.createdAt', 'DESC');

    // 3. Aplicar filtros opcionales
    if (filtros?.tipo) {
      queryBuilder.andWhere('historial.tipo = :tipo', { tipo: filtros.tipo });
    }

    if (filtros?.fechaDesde) {
      queryBuilder.andWhere('historial.createdAt >= :fechaDesde', { 
        fechaDesde: new Date(filtros.fechaDesde) 
      });
    }

    if (filtros?.fechaHasta) {
      queryBuilder.andWhere('historial.createdAt <= :fechaHasta', { 
        fechaHasta: new Date(filtros.fechaHasta) 
      });
    }

    // 4. Ejecutar query
    const registros = await queryBuilder.getMany();
    this.logger.log(`Query ejecutada. Encontrados ${registros.length} registros en historial_paciente`);

    // 5. Obtener información del psicólogo para cada registro
    const archivosConInfo = await Promise.all(
      registros.map(async (registro) => {
        // Buscar el psicólogo asignado al paciente
        const psicologo = await this.psicologoRepository
          .createQueryBuilder('psicologo')
          .leftJoinAndSelect('psicologo.usuario', 'usuario')
          .where('psicologo.id = :psicologoId', { psicologoId: paciente.idUsuarioPsicologo })
          .getOne();

        return {
          id: registro.id,
          tipo: registro.tipo,
          descripcion: registro.descripcion,
          url: registro.url,
          fechaCreacion: registro.createdAt || new Date(),
          psicologo: {
            id: psicologo?.id || 'N/A',
            nombre: psicologo?.usuario?.nombre || 'N/A',
            apellido: psicologo?.usuario?.apellido || 'N/A'
          }
        };
      })
    );

    this.logger.log(`Encontrados ${archivosConInfo.length} archivos para el paciente ${pacienteUserId}`);
    return archivosConInfo;
  }

  /**
   * Obtiene un archivo específico del paciente
   */
  async obtenerArchivoPaciente(
    archivoId: string,
    pacienteUserId: string
  ): Promise<ArchivoPacienteDto> {
    this.logger.log(`Obteniendo archivo ${archivoId} del paciente ${pacienteUserId}`);

    // 1. Verificar que el paciente existe
    const paciente = await this.pacienteRepository.findOne({
      where: { idUsuarioPaciente: pacienteUserId }
    });

    if (!paciente) {
      throw new NotFoundException('Paciente no encontrado');
    }

    // 2. Buscar el archivo
    const archivo = await this.historialRepository
      .createQueryBuilder('historial')
      .where('historial.id = :archivoId', { archivoId })
      .andWhere('historial.idUsuarioPaciente = :pacienteId', { pacienteId: paciente.id })
      .andWhere('historial.url IS NOT NULL')
      .getOne();

    if (!archivo) {
      throw new NotFoundException('Archivo no encontrado o no tienes permisos para verlo');
    }

    // 3. Obtener información del psicólogo
    const psicologo = await this.psicologoRepository
      .createQueryBuilder('psicologo')
      .leftJoinAndSelect('psicologo.usuario', 'usuario')
      .where('psicologo.id = :psicologoId', { psicologoId: paciente.idUsuarioPsicologo })
      .getOne();

    return {
      id: archivo.id,
      tipo: archivo.tipo,
      descripcion: archivo.descripcion,
      url: archivo.url,
      fechaCreacion: archivo.createdAt || new Date(),
      psicologo: {
        id: psicologo?.id || 'N/A',
        nombre: psicologo?.usuario?.nombre || 'N/A',
        apellido: psicologo?.usuario?.apellido || 'N/A'
      }
    };
  }

  /**
   * Obtiene estadísticas de archivos del paciente
   */
  async obtenerEstadisticasArchivos(pacienteUserId: string): Promise<{
    totalArchivos: number;
    archivosPorTipo: Record<string, number>;
    ultimoArchivo?: Date;
  }> {
    this.logger.log(`Obteniendo estadísticas de archivos del paciente ${pacienteUserId}`);

    // 1. Verificar que el paciente existe
    const paciente = await this.pacienteRepository.findOne({
      where: { idUsuarioPaciente: pacienteUserId }
    });

    if (!paciente) {
      throw new NotFoundException('Paciente no encontrado');
    }

    // 2. Obtener todos los archivos del paciente
    const archivos = await this.historialRepository
      .createQueryBuilder('historial')
      .where('historial.idUsuarioPaciente = :pacienteId', { pacienteId: paciente.id })
      .andWhere('historial.url IS NOT NULL')
      .orderBy('historial.createdAt', 'DESC')
      .getMany();

    // 3. Calcular estadísticas
    const totalArchivos = archivos.length;
    const archivosPorTipo = archivos.reduce((acc, archivo) => {
      acc[archivo.tipo] = (acc[archivo.tipo] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const ultimoArchivo = archivos.length > 0 ? archivos[0].createdAt : undefined;

    return {
      totalArchivos,
      archivosPorTipo,
      ultimoArchivo
    };
  }
}
