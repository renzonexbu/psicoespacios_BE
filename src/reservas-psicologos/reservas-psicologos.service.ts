import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ReservaPsicologo, EstadoReservaPsicologo, ModalidadSesion } from '../common/entities/reserva-psicologo.entity';
import { User } from '../common/entities/user.entity';
import { Psicologo } from '../common/entities/psicologo.entity';
import { Box } from '../common/entities/box.entity';
import { 
  CreateReservaPsicologoDto, 
  UpdateReservaPsicologoDto, 
  ReservaPsicologoResponseDto, 
  QueryReservasPsicologoDto 
} from './dto/reserva-psicologo.dto';

@Injectable()
export class ReservasPsicologosService {
  private readonly logger = new Logger(ReservasPsicologosService.name);

  constructor(
    @InjectRepository(ReservaPsicologo)
    private readonly reservaPsicologoRepository: Repository<ReservaPsicologo>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Psicologo)
    private readonly psicologoRepository: Repository<Psicologo>,
    @InjectRepository(Box)
    private readonly boxRepository: Repository<Box>,
  ) {}

  /**
   * Crear una nueva reserva de sesión con psicólogo
   */
  async create(createReservaDto: CreateReservaPsicologoDto): Promise<ReservaPsicologoResponseDto> {
    this.logger.log(`Creando reserva de sesión: psicólogo ${createReservaDto.psicologoId}, paciente ${createReservaDto.pacienteId}`);

    // Verificar que el psicólogo existe
    const psicologo = await this.psicologoRepository.findOne({
      where: { id: createReservaDto.psicologoId },
      relations: ['usuario']
    });

    if (!psicologo) {
      throw new NotFoundException('Psicólogo no encontrado');
    }

    // Verificar que el paciente existe
    const paciente = await this.userRepository.findOne({
      where: { id: createReservaDto.pacienteId }
    });

    if (!paciente) {
      throw new NotFoundException('Paciente no encontrado');
    }

    // Validar boxId para sesiones presenciales
    if (createReservaDto.modalidad === ModalidadSesion.PRESENCIAL) {
      if (!createReservaDto.boxId) {
        throw new BadRequestException('boxId es requerido para sesiones presenciales');
      }

      const box = await this.boxRepository.findOne({
        where: { id: createReservaDto.boxId }
      });

      if (!box) {
        throw new NotFoundException('Box no encontrado');
      }

      if (box.estado !== 'DISPONIBLE') {
        throw new BadRequestException('El box seleccionado no está disponible');
      }

      // Verificar que no hay conflicto de horarios para el box
      const conflictoBox = await this.verificarConflictoHorariosBox(
        createReservaDto.boxId,
        createReservaDto.fecha,
        createReservaDto.horaInicio,
        createReservaDto.horaFin
      );

      if (conflictoBox) {
        throw new BadRequestException('Ya existe una reserva en ese horario para este box');
      }
    } else if (createReservaDto.boxId) {
      throw new BadRequestException('boxId no debe ser proporcionado para sesiones online');
    }

    // Verificar que no hay conflicto de horarios para el psicólogo
    const conflicto = await this.verificarConflictoHorarios(
      createReservaDto.psicologoId,
      createReservaDto.fecha,
      createReservaDto.horaInicio,
      createReservaDto.horaFin
    );

    if (conflicto) {
      throw new BadRequestException('Ya existe una reserva en ese horario para este psicólogo');
    }

    // Crear la reserva
    const reserva = this.reservaPsicologoRepository.create({
      psicologo: { id: createReservaDto.psicologoId },
      paciente: { id: createReservaDto.pacienteId },
      fecha: new Date(createReservaDto.fecha),
      horaInicio: createReservaDto.horaInicio,
      horaFin: createReservaDto.horaFin,
      boxId: createReservaDto.boxId,
      modalidad: createReservaDto.modalidad || ModalidadSesion.PRESENCIAL,
      estado: EstadoReservaPsicologo.PENDIENTE,
      observaciones: createReservaDto.observaciones,
      metadatos: createReservaDto.metadatos || {},
    });

    const savedReserva = await this.reservaPsicologoRepository.save(reserva);
    this.logger.log(`Reserva creada con ID: ${savedReserva.id}`);

    return this.mapToResponseDto(savedReserva, psicologo.usuario, paciente);
  }

  /**
   * Obtener todas las reservas con filtros
   */
  async findAll(query: QueryReservasPsicologoDto): Promise<ReservaPsicologoResponseDto[]> {
    this.logger.log('Obteniendo reservas de psicólogos con filtros');

    const queryBuilder = this.reservaPsicologoRepository
      .createQueryBuilder('reserva')
      .leftJoinAndSelect('reserva.psicologo', 'psicologo')
      .leftJoinAndSelect('psicologo.usuario', 'psicologoUsuario')
      .leftJoinAndSelect('reserva.paciente', 'paciente')
      .orderBy('reserva.fecha', 'DESC')
      .addOrderBy('reserva.horaInicio', 'ASC');

    // Aplicar filtros
    if (query.psicologoId) {
      queryBuilder.andWhere('reserva.psicologo.id = :psicologoId', { psicologoId: query.psicologoId });
    }

    if (query.pacienteId) {
      queryBuilder.andWhere('reserva.paciente.id = :pacienteId', { pacienteId: query.pacienteId });
    }

    if (query.fechaDesde && query.fechaHasta) {
      queryBuilder.andWhere('reserva.fecha BETWEEN :fechaDesde AND :fechaHasta', {
        fechaDesde: new Date(query.fechaDesde),
        fechaHasta: new Date(query.fechaHasta),
      });
    }

    if (query.modalidad) {
      queryBuilder.andWhere('reserva.modalidad = :modalidad', { modalidad: query.modalidad });
    }

    if (query.estado) {
      queryBuilder.andWhere('reserva.estado = :estado', { estado: query.estado });
    }

    const reservas = await queryBuilder.getMany();
    return reservas.map(reserva => this.mapToResponseDto(reserva, reserva.psicologo.usuario, reserva.paciente));
  }

  /**
   * Obtener una reserva específica
   */
  async findOne(id: string): Promise<ReservaPsicologoResponseDto> {
    this.logger.log(`Obteniendo reserva: ${id}`);

    const reserva = await this.reservaPsicologoRepository.findOne({
      where: { id },
      relations: ['psicologo', 'psicologo.usuario', 'paciente'],
    });

    if (!reserva) {
      throw new NotFoundException('Reserva no encontrada');
    }

    return this.mapToResponseDto(reserva, reserva.psicologo.usuario, reserva.paciente);
  }

  /**
   * Obtener reservas de un psicólogo específico
   */
  async findByPsicologo(psicologoId: string): Promise<ReservaPsicologoResponseDto[]> {
    this.logger.log(`Obteniendo reservas del psicólogo: ${psicologoId}`);

    const reservas = await this.reservaPsicologoRepository.find({
      where: { psicologo: { id: psicologoId } },
      relations: ['psicologo', 'psicologo.usuario', 'paciente'],
      order: { fecha: 'DESC', horaInicio: 'ASC' },
    });

    return reservas.map(reserva => this.mapToResponseDto(reserva, reserva.psicologo.usuario, reserva.paciente));
  }

  /**
   * Obtener reservas de un paciente específico
   */
  async findByPaciente(pacienteId: string): Promise<ReservaPsicologoResponseDto[]> {
    this.logger.log(`Obteniendo reservas del paciente: ${pacienteId}`);

    const reservas = await this.reservaPsicologoRepository.find({
      where: { paciente: { id: pacienteId } },
      relations: ['psicologo', 'psicologo.usuario', 'paciente'],
      order: { fecha: 'DESC', horaInicio: 'ASC' },
    });

    return reservas.map(reserva => this.mapToResponseDto(reserva, reserva.psicologo.usuario, reserva.paciente));
  }

  /**
   * Actualizar una reserva
   */
  async update(id: string, updateReservaDto: UpdateReservaPsicologoDto): Promise<ReservaPsicologoResponseDto> {
    this.logger.log(`Actualizando reserva: ${id}`);

    const reserva = await this.reservaPsicologoRepository.findOne({
      where: { id },
      relations: ['psicologo', 'psicologo.usuario', 'paciente'],
    });

    if (!reserva) {
      throw new NotFoundException('Reserva no encontrada');
    }

    // Verificar conflicto de horarios si se cambia la fecha/hora
    if (updateReservaDto.fecha || updateReservaDto.horaInicio || updateReservaDto.horaFin) {
      const fecha = updateReservaDto.fecha || reserva.fecha.toISOString().split('T')[0];
      const horaInicio = updateReservaDto.horaInicio || reserva.horaInicio;
      const horaFin = updateReservaDto.horaFin || reserva.horaFin;

      const conflicto = await this.verificarConflictoHorarios(
        reserva.psicologo.id,
        fecha,
        horaInicio,
        horaFin,
        id // excluir la reserva actual
      );

      if (conflicto) {
        throw new BadRequestException('Ya existe una reserva en ese horario para este psicólogo');
      }

      // Verificar conflicto de horarios para box si es presencial
      const modalidad = updateReservaDto.modalidad || reserva.modalidad;
      const boxId = updateReservaDto.boxId || reserva.boxId;

      if (modalidad === ModalidadSesion.PRESENCIAL && boxId) {
        const conflictoBox = await this.verificarConflictoHorariosBox(
          boxId,
          fecha,
          horaInicio,
          horaFin,
          id // excluir la reserva actual
        );

        if (conflictoBox) {
          throw new BadRequestException('Ya existe una reserva en ese horario para este box');
        }
      }
    }

    // Validar boxId si se cambia la modalidad
    if (updateReservaDto.modalidad) {
      if (updateReservaDto.modalidad === ModalidadSesion.PRESENCIAL) {
        if (!updateReservaDto.boxId && !reserva.boxId) {
          throw new BadRequestException('boxId es requerido para sesiones presenciales');
        }

        if (updateReservaDto.boxId) {
          const box = await this.boxRepository.findOne({
            where: { id: updateReservaDto.boxId }
          });

          if (!box) {
            throw new NotFoundException('Box no encontrado');
          }

          if (box.estado !== 'DISPONIBLE') {
            throw new BadRequestException('El box seleccionado no está disponible');
          }
        }
      } else if (updateReservaDto.boxId) {
        throw new BadRequestException('boxId no debe ser proporcionado para sesiones online');
      }
    }

    // Actualizar la reserva
    Object.assign(reserva, updateReservaDto);
    if (updateReservaDto.fecha) {
      reserva.fecha = new Date(updateReservaDto.fecha);
    }

    const updatedReserva = await this.reservaPsicologoRepository.save(reserva);
    this.logger.log(`Reserva actualizada: ${id}`);

    return this.mapToResponseDto(updatedReserva, reserva.psicologo.usuario, reserva.paciente);
  }

  /**
   * Cancelar una reserva
   */
  async cancel(id: string): Promise<ReservaPsicologoResponseDto> {
    this.logger.log(`Cancelando reserva: ${id}`);

    const reserva = await this.reservaPsicologoRepository.findOne({
      where: { id },
      relations: ['psicologo', 'psicologo.usuario', 'paciente'],
    });

    if (!reserva) {
      throw new NotFoundException('Reserva no encontrada');
    }

    if (reserva.estado === EstadoReservaPsicologo.CANCELADA) {
      throw new BadRequestException('La reserva ya está cancelada');
    }

    reserva.estado = EstadoReservaPsicologo.CANCELADA;
    const updatedReserva = await this.reservaPsicologoRepository.save(reserva);

    this.logger.log(`Reserva cancelada: ${id}`);
    return this.mapToResponseDto(updatedReserva, reserva.psicologo.usuario, reserva.paciente);
  }

  /**
   * Eliminar una reserva
   */
  async remove(id: string): Promise<void> {
    this.logger.log(`Eliminando reserva: ${id}`);

    const reserva = await this.reservaPsicologoRepository.findOne({
      where: { id }
    });

    if (!reserva) {
      throw new NotFoundException('Reserva no encontrada');
    }

    await this.reservaPsicologoRepository.remove(reserva);
    this.logger.log(`Reserva eliminada: ${id}`);
  }

  /**
   * Verificar si hay conflicto de horarios para psicólogo
   */
  private async verificarConflictoHorarios(
    psicologoId: string,
    fecha: string,
    horaInicio: string,
    horaFin: string,
    excludeId?: string
  ): Promise<boolean> {
    const queryBuilder = this.reservaPsicologoRepository
      .createQueryBuilder('reserva')
      .where('reserva.psicologo.id = :psicologoId', { psicologoId })
      .andWhere('reserva.fecha = :fecha', { fecha: new Date(fecha) })
      .andWhere('reserva.estado != :cancelada', { cancelada: EstadoReservaPsicologo.CANCELADA })
      .andWhere(`
        (reserva.horaInicio < :horaFin AND reserva.horaFin > :horaInicio)
      `, { horaInicio, horaFin });

    if (excludeId) {
      queryBuilder.andWhere('reserva.id != :excludeId', { excludeId });
    }

    const conflicto = await queryBuilder.getOne();
    return !!conflicto;
  }

  /**
   * Verificar si hay conflicto de horarios para box
   */
  private async verificarConflictoHorariosBox(
    boxId: string,
    fecha: string,
    horaInicio: string,
    horaFin: string,
    excludeId?: string
  ): Promise<boolean> {
    const queryBuilder = this.reservaPsicologoRepository
      .createQueryBuilder('reserva')
      .where('reserva.boxId = :boxId', { boxId })
      .andWhere('reserva.fecha = :fecha', { fecha: new Date(fecha) })
      .andWhere('reserva.estado != :cancelada', { cancelada: EstadoReservaPsicologo.CANCELADA })
      .andWhere(`
        (reserva.horaInicio < :horaFin AND reserva.horaFin > :horaInicio)
      `, { horaInicio, horaFin });

    if (excludeId) {
      queryBuilder.andWhere('reserva.id != :excludeId', { excludeId });
    }

    const conflicto = await queryBuilder.getOne();
    return !!conflicto;
  }

  /**
   * Mapear entidad a DTO de respuesta
   */
  private mapToResponseDto(
    reserva: ReservaPsicologo, 
    psicologoUsuario: User, 
    paciente: User
  ): ReservaPsicologoResponseDto {
    return {
      id: reserva.id,
      psicologoId: reserva.psicologo.id,
      psicologoNombre: `${psicologoUsuario.nombre} ${psicologoUsuario.apellido}`,
      pacienteId: reserva.paciente.id,
      pacienteNombre: `${paciente.nombre} ${paciente.apellido}`,
      fecha: reserva.fecha,
      horaInicio: reserva.horaInicio,
      horaFin: reserva.horaFin,
      boxId: reserva.boxId,
      modalidad: reserva.modalidad,
      estado: reserva.estado,
      observaciones: reserva.observaciones,
      metadatos: reserva.metadatos,
      createdAt: reserva.createdAt,
      updatedAt: reserva.updatedAt,
    };
  }
} 