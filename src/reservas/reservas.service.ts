import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reserva, EstadoReserva } from '../common/entities/reserva.entity';
import { User } from '../common/entities/user.entity';
import { Box } from '../common/entities/box.entity';
import { PackAsignacion } from '../packs/entities/pack-asignacion.entity';
import { PackHora } from '../packs/entities/pack-hora.entity';
import { CreateReservaDto, UpdateReservaDto, UpdateEstadoPagoDto } from './dto/reserva.dto';

@Injectable()
export class ReservasService {
  constructor(
    @InjectRepository(Reserva)
    private reservaRepository: Repository<Reserva>,
    @InjectRepository(Box)
    private boxRepository: Repository<Box>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(PackAsignacion)
    private packAsignacionRepository: Repository<PackAsignacion>,
    @InjectRepository(PackHora)
    private packHoraRepository: Repository<PackHora>,
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
      .leftJoinAndSelect('reserva.packAsignacion', 'packAsignacion')
      .leftJoinAndSelect('packAsignacion.pack', 'pack')
      .where('sede.id = :sedeId', { sedeId })
      .orderBy('reserva.fecha', 'DESC')
      .addOrderBy('reserva.horaInicio', 'ASC')
      .getMany();

    // Mapear reservas con información completa incluyendo pack
    return reservas.map(reserva => {
      const reservaData = {
        id: reserva.id,
        boxId: reserva.boxId,
        psicologoId: reserva.psicologoId,
        packAsignacionId: reserva.packAsignacionId,
        fecha: reserva.fecha,
        horaInicio: reserva.horaInicio,
        horaFin: reserva.horaFin,
        estado: reserva.estado,
        estadoPago: reserva.estadoPago,
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
      };

      // Agregar información del pack si la reserva pertenece a un pack
      if (reserva.packAsignacionId && reserva.packAsignacion) {
        reservaData['pack'] = {
          asignacionId: reserva.packAsignacion.id,
          packId: reserva.packAsignacion.pack?.id,
          packNombre: reserva.packAsignacion.pack?.nombre,
          packDescripcion: reserva.packAsignacion.pack?.descripcion,
          packPrecio: reserva.packAsignacion.pack?.precio,
          estadoAsignacion: reserva.packAsignacion.estado,
          recurrente: reserva.packAsignacion.recurrente,
          fechaAsignacion: reserva.packAsignacion.createdAt
        };
      } else {
        reservaData['pack'] = null;
      }

      return reservaData;
    });
  }

  /**
   * Actualizar el estado de pago de una reserva
   */
  async updateEstadoPago(reservaId: string, updateEstadoPagoDto: UpdateEstadoPagoDto): Promise<any> {
    const reserva = await this.reservaRepository.findOne({
      where: { id: reservaId },
      relations: ['box', 'box.sede', 'psicologo', 'packAsignacion', 'packAsignacion.pack']
    });

    if (!reserva) {
      throw new NotFoundException('Reserva no encontrada');
    }

    // Actualizar el estado de pago
    reserva.estadoPago = updateEstadoPagoDto.estadoPago;
    reserva.updatedAt = new Date();

    await this.reservaRepository.save(reserva);

    // Preparar respuesta con información completa
    const response: any = {
      id: reserva.id,
      boxId: reserva.boxId,
      psicologoId: reserva.psicologoId,
      packAsignacionId: reserva.packAsignacionId,
      fecha: reserva.fecha,
      horaInicio: reserva.horaInicio,
      horaFin: reserva.horaFin,
      estado: reserva.estado,
      estadoPago: reserva.estadoPago,
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
      },
      pack: null
    };

    // Agregar información del pack si existe
    if (reserva.packAsignacionId && reserva.packAsignacion) {
      response.pack = {
        asignacionId: reserva.packAsignacion.id,
        packId: reserva.packAsignacion.pack?.id,
        packNombre: reserva.packAsignacion.pack?.nombre,
        packDescripcion: reserva.packAsignacion.pack?.descripcion,
        packPrecio: reserva.packAsignacion.pack?.precio,
        estadoAsignacion: reserva.packAsignacion.estado,
        recurrente: reserva.packAsignacion.recurrente,
        fechaAsignacion: reserva.packAsignacion.createdAt
      };
    }

    return {
      message: 'Estado de pago actualizado correctamente',
      reserva: response,
      actualizacion: {
        estadoPagoAnterior: updateEstadoPagoDto.estadoPago === 'pagado' ? 'pendiente_pago' : 'pagado',
        estadoPagoNuevo: updateEstadoPagoDto.estadoPago,
        observaciones: updateEstadoPagoDto.observaciones,
        metodoPago: updateEstadoPagoDto.metodoPago,
        referenciaPago: updateEstadoPagoDto.referenciaPago,
        fechaActualizacion: new Date()
      }
    };
  }

  /**
   * Obtener historial de cambios de estado de pago de una reserva
   */
  async getHistorialPago(reservaId: string): Promise<any> {
    const reserva = await this.reservaRepository.findOne({
      where: { id: reservaId },
      relations: ['box', 'box.sede', 'psicologo']
    });

    if (!reserva) {
      throw new NotFoundException('Reserva no encontrada');
    }

    return {
      reservaId: reserva.id,
      psicologo: {
        id: reserva.psicologo?.id,
        nombre: reserva.psicologo?.nombre,
        apellido: reserva.psicologo?.apellido
      },
      box: {
        id: reserva.box?.id,
        numero: reserva.box?.numero,
        sede: reserva.box?.sede?.nombre
      },
      fecha: reserva.fecha,
      horaInicio: reserva.horaInicio,
      horaFin: reserva.horaFin,
      precio: reserva.precio,
      estadoActual: reserva.estado,
      estadoPagoActual: reserva.estadoPago,
      fechaCreacion: reserva.createdAt,
      ultimaActualizacion: reserva.updatedAt,
      mensaje: 'Para un historial completo de cambios, se recomienda implementar una tabla de auditoría'
    };
  }
}