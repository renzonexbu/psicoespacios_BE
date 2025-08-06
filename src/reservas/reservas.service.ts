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
      estado: createReservaDto.estado || EstadoReserva.PENDIENTE,
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
}