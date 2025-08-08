import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between, In } from 'typeorm';
import { Nota, TipoNota } from '../common/entities/nota.entity';
import { User } from '../common/entities/user.entity';
import { CreateNotaDto, UpdateNotaDto, NotaResponseDto, QueryNotasDto } from './dto/nota.dto';

@Injectable()
export class NotasService {
  private readonly logger = new Logger(NotasService.name);

  constructor(
    @InjectRepository(Nota)
    private readonly notaRepository: Repository<Nota>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Crear una nueva nota
   */
  async create(createNotaDto: CreateNotaDto, psicologoId: string): Promise<NotaResponseDto> {
    this.logger.log(`Creando nota para paciente: ${createNotaDto.pacienteId}`);

    // Verificar que el paciente existe
    const paciente = await this.userRepository.findOne({ 
      where: { id: createNotaDto.pacienteId },
      select: ['id', 'nombre', 'apellido']
    });

    if (!paciente) {
      throw new NotFoundException('Paciente no encontrado');
    }

    // Verificar que el psicólogo existe
    const psicologo = await this.userRepository.findOne({ 
      where: { id: psicologoId },
      select: ['id', 'nombre', 'apellido']
    });

    if (!psicologo) {
      throw new NotFoundException('Psicólogo no encontrado');
    }

    // Crear la nota
    const nota = this.notaRepository.create({
      psicologo: { id: psicologoId },
      paciente: { id: createNotaDto.pacienteId },
      contenido: createNotaDto.contenido,
      titulo: createNotaDto.titulo,
      tipo: createNotaDto.tipo || TipoNota.OTRO,
      esPrivada: createNotaDto.esPrivada || false,
      metadatos: createNotaDto.metadatos || {},
    });

    const savedNota = await this.notaRepository.save(nota);
    this.logger.log(`Nota creada con ID: ${savedNota.id}`);

    return this.mapToResponseDto(savedNota, paciente);
  }

  /**
   * Obtener todas las notas de un psicólogo
   */
  async findAll(psicologoId: string, query: QueryNotasDto): Promise<NotaResponseDto[]> {
    this.logger.log(`Obteniendo notas para psicólogo: ${psicologoId}`);

    const queryBuilder = this.notaRepository
      .createQueryBuilder('nota')
      .leftJoinAndSelect('nota.paciente', 'paciente')
      .where('nota.psicologo.id = :psicologoId', { psicologoId })
      .orderBy('nota.createdAt', 'DESC');

    // Aplicar filtros
    if (query.pacienteId) {
      queryBuilder.andWhere('nota.paciente.id = :pacienteId', { pacienteId: query.pacienteId });
    }

    if (query.tipo) {
      queryBuilder.andWhere('nota.tipo = :tipo', { tipo: query.tipo });
    }

    if (query.search) {
      queryBuilder.andWhere(
        '(nota.contenido ILIKE :search OR nota.titulo ILIKE :search)',
        { search: `%${query.search}%` }
      );
    }

    if (query.fechaDesde && query.fechaHasta) {
      queryBuilder.andWhere('nota.createdAt BETWEEN :fechaDesde AND :fechaHasta', {
        fechaDesde: new Date(query.fechaDesde),
        fechaHasta: new Date(query.fechaHasta + 'T23:59:59'),
      });
    }

    if (query.prioridad) {
      queryBuilder.andWhere("nota.metadatos->>'prioridad' = :prioridad", { prioridad: query.prioridad });
    }

    if (query.estado) {
      queryBuilder.andWhere("nota.metadatos->>'estado' = :estado", { estado: query.estado });
    }

    const notas = await queryBuilder.getMany();
    return notas.map(nota => this.mapToResponseDto(nota, nota.paciente));
  }

  /**
   * Obtener una nota específica
   */
  async findOne(id: string, psicologoId: string): Promise<NotaResponseDto> {
    this.logger.log(`Obteniendo nota: ${id}`);

    const nota = await this.notaRepository.findOne({
      where: { id },
      relations: ['paciente'],
    });

    if (!nota) {
      throw new NotFoundException('Nota no encontrada');
    }

    // Verificar que el psicólogo es el propietario de la nota
    if (nota.psicologo.id !== psicologoId) {
      throw new ForbiddenException('No tienes permisos para acceder a esta nota');
    }

    return this.mapToResponseDto(nota, nota.paciente);
  }

  /**
   * Obtener notas de un paciente específico
   */
  async findByPaciente(pacienteId: string, psicologoId: string): Promise<NotaResponseDto[]> {
    this.logger.log(`Obteniendo notas del paciente: ${pacienteId}`);

    const notas = await this.notaRepository.find({
      where: {
        paciente: { id: pacienteId },
        psicologo: { id: psicologoId },
      },
      relations: ['paciente'],
      order: { createdAt: 'DESC' },
    });

    return notas.map(nota => this.mapToResponseDto(nota, nota.paciente));
  }

  /**
   * Actualizar una nota
   */
  async update(id: string, updateNotaDto: UpdateNotaDto, psicologoId: string): Promise<NotaResponseDto> {
    this.logger.log(`Actualizando nota: ${id}`);

    const nota = await this.notaRepository.findOne({
      where: { id },
      relations: ['paciente'],
    });

    if (!nota) {
      throw new NotFoundException('Nota no encontrada');
    }

    // Verificar que el psicólogo es el propietario de la nota
    if (nota.psicologo.id !== psicologoId) {
      throw new ForbiddenException('No tienes permisos para modificar esta nota');
    }

    // Actualizar la nota
    Object.assign(nota, updateNotaDto);
    const updatedNota = await this.notaRepository.save(nota);

    this.logger.log(`Nota actualizada: ${id}`);
    return this.mapToResponseDto(updatedNota, nota.paciente);
  }

  /**
   * Eliminar una nota
   */
  async remove(id: string, psicologoId: string): Promise<void> {
    this.logger.log(`Eliminando nota: ${id}`);

    const nota = await this.notaRepository.findOne({
      where: { id },
      select: ['id', 'psicologo'],
      relations: ['psicologo'],
    });

    if (!nota) {
      throw new NotFoundException('Nota no encontrada');
    }

    // Verificar que el psicólogo es el propietario de la nota
    if (nota.psicologo.id !== psicologoId) {
      throw new ForbiddenException('No tienes permisos para eliminar esta nota');
    }

    await this.notaRepository.remove(nota);
    this.logger.log(`Nota eliminada: ${id}`);
  }

  /**
   * Obtener estadísticas de notas
   */
  async getStats(psicologoId: string): Promise<any> {
    this.logger.log(`Obteniendo estadísticas de notas para psicólogo: ${psicologoId}`);

    const totalNotas = await this.notaRepository.count({
      where: { psicologo: { id: psicologoId } },
    });

    const notasPorTipo = await this.notaRepository
      .createQueryBuilder('nota')
      .select('nota.tipo', 'tipo')
      .addSelect('COUNT(*)', 'count')
      .where('nota.psicologo.id = :psicologoId', { psicologoId })
      .groupBy('nota.tipo')
      .getRawMany();

    const notasRecientes = await this.notaRepository.count({
      where: {
        psicologo: { id: psicologoId },
        createdAt: Between(
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Últimos 7 días
          new Date()
        ),
      },
    });

    return {
      totalNotas,
      notasPorTipo,
      notasRecientes,
      notasPrivadas: await this.notaRepository.count({
        where: { psicologo: { id: psicologoId }, esPrivada: true },
      }),
    };
  }

  /**
   * Mapear entidad a DTO de respuesta
   */
  private mapToResponseDto(nota: Nota, paciente: User): NotaResponseDto {
    return {
      id: nota.id,
      pacienteId: nota.paciente.id,
      pacienteNombre: `${paciente.nombre} ${paciente.apellido}`,
      contenido: nota.contenido,
      titulo: nota.titulo,
      tipo: nota.tipo,
      esPrivada: nota.esPrivada,
      metadatos: nota.metadatos,
      createdAt: nota.createdAt,
      updatedAt: nota.updatedAt,
    };
  }
} 