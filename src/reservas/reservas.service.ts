import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

  async create(createReservaDto: CreateReservaDto) {
    const reserva = this.reservaRepository.create({
      ...createReservaDto,
      estado: createReservaDto.estado || EstadoReserva.CONFIRMADA,
    });
    return await this.reservaRepository.save(reserva);
  }

  async findOne(id: string): Promise<Reserva> {
    const reserva = await this.reservaRepository.findOne({
      where: { id },
    });
    if (!reserva) {
      throw new NotFoundException('Reserva no encontrada');
    }
    return reserva;
  }

  async cancel(id: string, updateDto: UpdateReservaDto, userId: string): Promise<Reserva> {
    const reserva = await this.findOne(id);
    if (reserva.psicologoId !== userId) {
      throw new ForbiddenException('No tienes permiso para cancelar esta reserva');
    }
    reserva.estado = updateDto.estado || EstadoReserva.CANCELADA;
    return await this.reservaRepository.save(reserva);
  }

  async findByPsicologoAndFecha(psicologoId: string, fecha: string): Promise<any[]> {
    const reservas = await this.reservaRepository.find({
      where: { psicologoId, fecha: new Date(fecha) },
    });
    
    // Mapear reservas con info del psicólogo
    return reservas.map(reserva => {
      return {
        ...reserva,
        psicologo: {
          id: reserva.psicologoId,
        },
      };
    });
  }

  /**
   * Obtener todas las reservas de una sede específica (para administradores)
   */
  async findBySede(sedeId: string): Promise<any[]> {
    const reservas = await this.reservaRepository
      .createQueryBuilder('reserva')
      .leftJoinAndSelect('reserva.box', 'box')
      .leftJoinAndSelect('box.sede', 'sede')
      .leftJoinAndSelect('reserva.psicologo', 'psicologo')
      .where('sede.id = :sedeId', { sedeId })
      .orderBy('reserva.fecha', 'DESC')
      .addOrderBy('reserva.horaInicio', 'ASC')
      .getMany();

    // Mapear reservas con información completa
    return reservas.map(reserva => ({
      id: reserva.id,
      boxId: reserva.boxId,
      psicologoId: reserva.psicologoId,
      fecha: reserva.fecha,
      horaInicio: reserva.horaInicio,
      horaFin: reserva.horaFin,
      estado: reserva.estado,
      precio: reserva.precio,
      createdAt: reserva.createdAt,
      updatedAt: reserva.updatedAt,
      box: {
        id: reserva.box?.id,
        numero: reserva.box?.numero,
        estado: reserva.box?.estado,
        sede: {
          id: reserva.box?.sede?.id,
          nombre: reserva.box?.sede?.nombre,
          direccion: reserva.box?.sede?.direccion,
          telefono: reserva.box?.sede?.telefono,
          email: reserva.box?.sede?.email
        }
      },
      psicologo: {
        id: reserva.psicologo?.id,
        nombre: reserva.psicologo?.nombre,
        apellido: reserva.psicologo?.apellido,
        email: reserva.psicologo?.email,
        telefono: reserva.psicologo?.telefono
      }
    }));
  }
}