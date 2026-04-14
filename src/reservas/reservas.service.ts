import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Reserva, EstadoReserva } from '../common/entities/reserva.entity';
import { User } from '../common/entities/user.entity';
import { Box } from '../common/entities/box.entity';
import { PackAsignacion } from '../packs/entities/pack-asignacion.entity';
import { PackHora } from '../packs/entities/pack-hora.entity';
import {
  CreateReservaDto,
  UpdateReservaDto,
  UpdateEstadoPagoDto,
  BulkUpdateEstadoPagoDto,
} from './dto/reserva.dto';
import { MailService } from '../mail/mail.service';

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
    private dataSource: DataSource,
    private mailService: MailService,
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

  async cancel(
    id: string,
    updateDto: UpdateReservaDto,
    userId: string,
  ): Promise<Reserva> {
    const reserva = await this.findOne(id);
    if (reserva.psicologoId !== userId) {
      throw new ForbiddenException(
        'No tienes permiso para cancelar esta reserva',
      );
    }
    if (reserva.estado === EstadoReserva.CANCELADA) {
      throw new BadRequestException('La reserva ya está cancelada');
    }
    if (reserva.estado === EstadoReserva.COMPLETADA) {
      throw new BadRequestException('No se puede cancelar una reserva completada');
    }

    const MS_24H = 24 * 60 * 60 * 1000;
    const inicioReserva = this.getInicioReserva(reserva);
    if (inicioReserva.getTime() - Date.now() < MS_24H) {
      throw new BadRequestException(
        'Solo puedes cancelar con al menos 24 horas de anticipación respecto del inicio de la reserva.',
      );
    }

    reserva.estado = updateDto.estado || EstadoReserva.CANCELADA;
    const saved = await this.reservaRepository.save(reserva);
    // Enviar email de cancelación al psicólogo (cuenta default)
    try {
      const usuario = await this.userRepository.findOne({
        where: { id: saved.psicologoId },
      });
      if (usuario?.email) {
        const fechaStr = new Date(saved.fecha).toISOString().split('T')[0];
        const box = saved.boxId
          ? await this.boxRepository.findOne({
              where: { id: saved.boxId },
              relations: ['sede'],
            })
          : null;
        const sedeNombre = box?.sede?.nombre?.trim() || '';
        const boxNombre = box
          ? box.nombre?.trim() || `Box ${box.numero}`
          : '';
        await this.mailService.sendReservaBoxCancelada(
          usuario.email,
          fechaStr,
          saved.horaInicio,
          false,
          sedeNombre,
          boxNombre,
        );
      }
    } catch (error) {
      // No bloquear por error de email
      console.error(
        `Error al enviar email de cancelación de box a psicólogo ${saved.psicologoId}:`,
        error,
      );
    }
    return saved;
  }

  async findByPsicologoAndFecha(
    psicologoId: string,
    fecha: string,
  ): Promise<any[]> {
    const reservas = await this.reservaRepository.find({
      where: { psicologoId, fecha: new Date(fecha) },
    });

    // Mapear reservas con info del psicólogo
    return reservas.map((reserva) => {
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
    return reservas.map((reserva) => {
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
            email: reserva.box?.sede?.email,
          },
        },
        psicologo: {
          id: reserva.psicologo?.id,
          nombre: reserva.psicologo?.nombre,
          apellido: reserva.psicologo?.apellido,
          email: reserva.psicologo?.email,
          telefono: reserva.psicologo?.telefono,
        },
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
          fechaAsignacion: reserva.packAsignacion.createdAt,
        };
      } else {
        reservaData['pack'] = null;
      }

      return reservaData;
    });
  }

  /**
   * Obtener todas las reservas de un usuario específico (para administradores)
   */
  async findByUsuario(usuarioId: string): Promise<any[]> {
    // Verificar que el usuario existe
    const usuario = await this.userRepository.findOne({
      where: { id: usuarioId },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const reservas = await this.reservaRepository
      .createQueryBuilder('reserva')
      .leftJoinAndSelect('reserva.box', 'box')
      .leftJoinAndSelect('box.sede', 'sede')
      .leftJoinAndSelect('reserva.psicologo', 'psicologo')
      .leftJoinAndSelect('reserva.packAsignacion', 'packAsignacion')
      .leftJoinAndSelect('packAsignacion.pack', 'pack')
      .where('reserva.psicologoId = :usuarioId', { usuarioId })
      .orderBy('reserva.fecha', 'DESC')
      .addOrderBy('reserva.horaInicio', 'ASC')
      .getMany();

    // Mapear reservas con información completa incluyendo pack
    return reservas.map((reserva) => {
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
            email: reserva.box?.sede?.email,
          },
        },
        psicologo: {
          id: reserva.psicologo?.id,
          nombre: reserva.psicologo?.nombre,
          apellido: reserva.psicologo?.apellido,
          email: reserva.psicologo?.email,
          telefono: reserva.psicologo?.telefono,
        },
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
          fechaAsignacion: reserva.packAsignacion.createdAt,
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
  async updateEstadoPago(
    reservaId: string,
    updateEstadoPagoDto: UpdateEstadoPagoDto,
  ): Promise<any> {
    const reserva = await this.reservaRepository.findOne({
      where: { id: reservaId },
      relations: [
        'box',
        'box.sede',
        'psicologo',
        'packAsignacion',
        'packAsignacion.pack',
      ],
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
          email: reserva.box?.sede?.email,
        },
      },
      psicologo: {
        id: reserva.psicologo?.id,
        nombre: reserva.psicologo?.nombre,
        apellido: reserva.psicologo?.apellido,
        email: reserva.psicologo?.email,
        telefono: reserva.psicologo?.telefono,
      },
      pack: null,
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
        fechaAsignacion: reserva.packAsignacion.createdAt,
      };
    }

    return {
      message: 'Estado de pago actualizado correctamente',
      reserva: response,
      actualizacion: {
        estadoPagoAnterior:
          updateEstadoPagoDto.estadoPago === 'pagado'
            ? 'pendiente_pago'
            : 'pagado',
        estadoPagoNuevo: updateEstadoPagoDto.estadoPago,
        observaciones: updateEstadoPagoDto.observaciones,
        metodoPago: updateEstadoPagoDto.metodoPago,
        referenciaPago: updateEstadoPagoDto.referenciaPago,
        fechaActualizacion: new Date(),
      },
    };
  }

  /**
   * Obtener historial de cambios de estado de pago de una reserva
   */
  async getHistorialPago(reservaId: string): Promise<any> {
    const reserva = await this.reservaRepository.findOne({
      where: { id: reservaId },
      relations: ['box', 'box.sede', 'psicologo'],
    });

    if (!reserva) {
      throw new NotFoundException('Reserva no encontrada');
    }

    return {
      reservaId: reserva.id,
      psicologo: {
        id: reserva.psicologo?.id,
        nombre: reserva.psicologo?.nombre,
        apellido: reserva.psicologo?.apellido,
      },
      box: {
        id: reserva.box?.id,
        numero: reserva.box?.numero,
        sede: reserva.box?.sede?.nombre,
      },
      fecha: reserva.fecha,
      horaInicio: reserva.horaInicio,
      horaFin: reserva.horaFin,
      precio: reserva.precio,
      estadoActual: reserva.estado,
      estadoPagoActual: reserva.estadoPago,
      fechaCreacion: reserva.createdAt,
      ultimaActualizacion: reserva.updatedAt,
      mensaje:
        'Para un historial completo de cambios, se recomienda implementar una tabla de auditoría',
    };
  }

  /**
   * Actualizar múltiples estados de pago de reservas de manera masiva
   */
  async bulkUpdateEstadoPago(
    bulkUpdateDto: BulkUpdateEstadoPagoDto,
  ): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const resultados: any[] = [];
      const errores: Array<{ reservaId: string; error: string }> = [];

      for (const actualizacion of bulkUpdateDto.actualizaciones) {
        try {
          // Verificar que la reserva existe
          const reserva = await queryRunner.manager.findOne(Reserva, {
            where: { id: actualizacion.reservaId },
            relations: [
              'box',
              'box.sede',
              'psicologo',
              'packAsignacion',
              'packAsignacion.pack',
            ],
          });

          if (!reserva) {
            errores.push({
              reservaId: actualizacion.reservaId,
              error: 'Reserva no encontrada',
            });
            continue;
          }

          // Guardar el estado anterior
          const estadoAnterior = reserva.estadoPago;

          // Actualizar el estado de pago
          reserva.estadoPago = actualizacion.estadoPago;
          reserva.updatedAt = new Date();

          await queryRunner.manager.save(reserva);

          // Preparar respuesta para esta reserva
          const reservaActualizada: any = {
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
                email: reserva.box?.sede?.email,
              },
            },
            psicologo: {
              id: reserva.psicologo?.id,
              nombre: reserva.psicologo?.nombre,
              apellido: reserva.psicologo?.apellido,
              email: reserva.psicologo?.email,
              telefono: reserva.psicologo?.telefono,
            },
            pack: null,
          };

          // Agregar información del pack si existe
          if (reserva.packAsignacionId && reserva.packAsignacion) {
            reservaActualizada.pack = {
              asignacionId: reserva.packAsignacion.id,
              packId: reserva.packAsignacion.pack?.id,
              packNombre: reserva.packAsignacion.pack?.nombre,
              packDescripcion: reserva.packAsignacion.pack?.descripcion,
              packPrecio: reserva.packAsignacion.pack?.precio,
              estadoAsignacion: reserva.packAsignacion.estado,
              recurrente: reserva.packAsignacion.recurrente,
              fechaAsignacion: reserva.packAsignacion.createdAt,
            };
          }

          resultados.push({
            reserva: reservaActualizada,
            actualizacion: {
              estadoPagoAnterior: estadoAnterior,
              estadoPagoNuevo: actualizacion.estadoPago,
              observaciones: actualizacion.observaciones,
              metodoPago: actualizacion.metodoPago,
              referenciaPago: actualizacion.referenciaPago,
              fechaActualizacion: new Date(),
            },
          });
        } catch (error) {
          errores.push({
            reservaId: actualizacion.reservaId,
            error: error.message || 'Error desconocido',
          });
        }
      }

      await queryRunner.commitTransaction();

      return {
        message: `Actualización masiva completada. ${resultados.length} reservas actualizadas exitosamente.`,
        resumen: {
          totalProcesadas: bulkUpdateDto.actualizaciones.length,
          exitosas: resultados.length,
          errores: errores.length,
        },
        resultados,
        errores: errores.length > 0 ? errores : undefined,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(
        `Error en actualización masiva: ${error.message}`,
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Inicio de la reserva en hora local del servidor (fecha calendario + horaInicio).
   * Para columnas `date` de Postgres se usan componentes UTC del día almacenado.
   */
  private getInicioReserva(reserva: Reserva): Date {
    const raw = reserva.fecha as Date | string;
    let y: number;
    let m: number;
    let d: number;
    if (raw instanceof Date) {
      y = raw.getUTCFullYear();
      m = raw.getUTCMonth();
      d = raw.getUTCDate();
    } else {
      const parts = String(raw).slice(0, 10).split('-').map(Number);
      y = parts[0];
      m = parts[1] - 1;
      d = parts[2];
    }
    const [hh, mm] = reserva.horaInicio.split(':').map((n) => parseInt(n, 10));
    return new Date(y, m, d, hh, mm || 0, 0, 0);
  }
}
