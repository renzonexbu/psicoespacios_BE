import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Reserva, EstadoReserva } from '../common/entities/reserva.entity';
import { User } from '../common/entities/user.entity';
import { Box } from '../common/entities/box.entity';
import { CreateReservaDto, UpdateReservaDto } from './dto/reserva.dto';

@Injectable()
export class ReservasService {
  constructor(
    @InjectRepository(Reserva)
    private reservaRepository: Repository<Reserva>,
    @InjectRepository(Box)
    private boxRepository: Repository<Box>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createReservaDto: CreateReservaDto, userId: string) {
    const box = await this.boxRepository.findOne({
      where: { id: createReservaDto.boxId },
    });

    if (!box) {
      throw new NotFoundException('Box no encontrado');
    }

    const psicologo = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!psicologo) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Validar que las fechas sean futuras
    const fechaInicio = new Date(createReservaDto.fechaInicio);
    const fechaFin = new Date(createReservaDto.fechaFin);
    const ahora = new Date();

    if (fechaInicio <= ahora) {
      throw new BadRequestException('La fecha de inicio debe ser futura');
    }

    if (fechaFin <= fechaInicio) {
      throw new BadRequestException('La fecha de fin debe ser posterior a la fecha de inicio');
    }

    // Validar duración mínima y máxima según tipo de reserva
    const duracionHoras = (fechaFin.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60);
    
    if (createReservaDto.tipo === 'HORA') {
      if (duracionHoras < 1 || duracionHoras > 4) {
        throw new BadRequestException('La duración de la reserva por hora debe ser entre 1 y 4 horas');
      }
    } else if (createReservaDto.tipo === 'JORNADA') {
      if (duracionHoras < 6 || duracionHoras > 12) {
        throw new BadRequestException('La duración de la reserva por jornada debe ser entre 6 y 12 horas');
      }
    }

    // Verificar disponibilidad
    const reservaExistente = await this.reservaRepository.findOne({
      where: [
        {
          box: { id: createReservaDto.boxId },
          estado: EstadoReserva.CONFIRMADA,
          fechaInicio: LessThanOrEqual(fechaFin),
          fechaFin: MoreThanOrEqual(fechaInicio),
        }
      ],
    });

    if (reservaExistente) {
      throw new BadRequestException('El box ya está reservado para este horario');
    }

    const reserva = this.reservaRepository.create({
      box,
      psicologo,
      fechaInicio,
      fechaFin,
      tipo: createReservaDto.tipo,
      estado: EstadoReserva.PENDIENTE,
      precio: createReservaDto.tipo === 'HORA' ? box.precioHora * duracionHoras : box.precioJornada,
    });

    return await this.reservaRepository.save(reserva);
  }

  async findOne(id: string): Promise<Reserva> {
    const reserva = await this.reservaRepository.findOne({
      where: { id },
      relations: ['box', 'psicologo'],
    });
    
    if (!reserva) {
      throw new NotFoundException('Reserva no encontrada');
    }
    
    return reserva;
  }

  async cancel(id: string, updateDto: UpdateReservaDto, userId: string): Promise<Reserva> {
    const reserva = await this.findOne(id);
    
    if (reserva.psicologo.id !== userId) {
      throw new ForbiddenException('No tienes permiso para cancelar esta reserva');
    }

    const ahora = new Date();
    const fechaInicio = new Date(reserva.fechaInicio);
    const horasParaInicio = (fechaInicio.getTime() - ahora.getTime()) / (1000 * 60 * 60);

    if (horasParaInicio < 24) {
      throw new BadRequestException('Las reservas deben cancelarse con al menos 24 horas de anticipación');
    }

    reserva.estado = EstadoReserva.CANCELADA;
    reserva.notasCancelacion = updateDto.notasCancelacion || '';
    
    return await this.reservaRepository.save(reserva);
  }
}