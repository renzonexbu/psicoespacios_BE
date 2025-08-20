import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Pago } from '../../common/entities/pago.entity';
import { Voucher } from '../../common/entities/voucher.entity';
import { ReservaPsicologo } from '../../common/entities/reserva-psicologo.entity';
import { Psicologo } from '../../common/entities/psicologo.entity';
import { User } from '../../common/entities/user.entity';
import { Paciente } from '../../common/entities/paciente.entity';
import { Box } from '../../common/entities/box.entity';
import { EstadoReservaPsicologo, ModalidadSesion } from '../../common/entities/reserva-psicologo.entity';
import { TipoPago, EstadoPago, MetodoPago } from '../../common/entities/pago.entity';

export interface ConfirmarSesionDto {
  psicologoId: string;
  pacienteId: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  boxId?: string;
  modalidad: ModalidadSesion;
  cuponId?: string;
  precio: number;
  observaciones?: string;
  datosTransaccion: {
    metodoPago: MetodoPago;
    referencia?: string;
    datosTarjeta?: {
      ultimos4: string;
      marca: string;
    };
    datosTransferencia?: {
      banco: string;
      numeroOperacion: string;
    };
    fechaTransaccion: Date;
  };
}

export interface CrearOrdenFlowDto {
  psicologoId: string;
  pacienteId: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  boxId?: string;
  modalidad: ModalidadSesion;
  cuponId?: string;
  precio: number;
  observaciones?: string;
}

export interface OrdenFlowResponse {
  flowOrderId: string;
  flowUrl: string;
  monto: number;
  descuentoAplicado: number;
  montoFinal: number;
  cupon?: {
    id: string;
    nombre: string;
    porcentaje: number;
  };
  reservaTemporalId: string;
}

export interface SesionConfirmadaResponse {
  pago: {
    id: string;
    monto: number;
    descuentoAplicado: number;
    montoFinal: number;
    estado: EstadoPago;
    cuponId?: string;
  };
  reserva: {
    id: string;
    fecha: Date;
    horaInicio: string;
    horaFin: string;
    modalidad: ModalidadSesion;
    estado: EstadoReservaPsicologo;
    boxId?: string;
  };
  cupon?: {
    id: string;
    nombre: string;
    porcentaje: number;
  };
}

@Injectable()
export class PagoSesionService {
  private readonly logger = new Logger(PagoSesionService.name);

  constructor(
    @InjectRepository(Pago)
    private pagoRepository: Repository<Pago>,
    @InjectRepository(Voucher)
    private voucherRepository: Repository<Voucher>,
    @InjectRepository(ReservaPsicologo)
    private reservaRepository: Repository<ReservaPsicologo>,
    @InjectRepository(Psicologo)
    private psicologoRepository: Repository<Psicologo>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Paciente)
    private pacienteRepository: Repository<Paciente>,
    @InjectRepository(Box)
    private boxRepository: Repository<Box>,
    private dataSource: DataSource,
  ) {}

  /**
   * Crear orden en Flow y reserva temporal
   */
  async crearOrdenFlow(dto: CrearOrdenFlowDto): Promise<OrdenFlowResponse> {
    this.logger.log(`Creando orden Flow: psicólogo ${dto.psicologoId}, paciente ${dto.pacienteId}`);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Validar y usar cupón si existe
      let cupon: Voucher | undefined = undefined;
      let descuentoAplicado = 0;

      if (dto.cuponId) {
        cupon = await this.validarYUsarCupon(dto.cuponId, queryRunner);
        descuentoAplicado = this.calcularDescuento(dto.precio, cupon.porcentaje);
      }

      const montoFinal = dto.precio - descuentoAplicado;

      // 2. Validar disponibilidad del psicólogo
      await this.validarDisponibilidadPsicologo(
        dto.psicologoId,
        dto.fecha,
        dto.horaInicio,
        dto.horaFin,
        queryRunner
      );

      // 3. Validar box para sesiones presenciales
      if (dto.modalidad === ModalidadSesion.PRESENCIAL) {
        if (!dto.boxId) {
          throw new BadRequestException('boxId es requerido para sesiones presenciales');
        }
        await this.validarBoxDisponible(dto.boxId, dto.fecha, dto.horaInicio, dto.horaFin, queryRunner);
      }

      // 4. Crear o actualizar paciente
      await this.crearOActualizarPaciente(dto.pacienteId, dto.psicologoId, queryRunner);

      // 5. Crear reserva temporal con estado PENDIENTE_PAGO
      const reservaTemporal = queryRunner.manager.create(ReservaPsicologo, {
        psicologo: { id: dto.psicologoId },
        paciente: { id: dto.pacienteId },
        fecha: new Date(dto.fecha),
        horaInicio: dto.horaInicio,
        horaFin: dto.horaFin,
        boxId: dto.boxId,
        modalidad: dto.modalidad,
        estado: EstadoReservaPsicologo.PENDIENTE_PAGO,
        observaciones: dto.observaciones,
        cuponId: cupon?.id,
        descuentoAplicado,
        metadatos: {
          precio: dto.precio,
          cuponInfo: cupon ? {
            id: cupon.id,
            nombre: cupon.nombre,
            porcentaje: cupon.porcentaje,
            modalidad: cupon.modalidad,
          } : undefined,
          esTemporal: true,
        }
      });

      const reservaGuardada = await queryRunner.manager.save(ReservaPsicologo, reservaTemporal);

      // 6. Crear orden en Flow (aquí iría la integración real con Flow)
      const flowOrderId = `flow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const flowUrl = `https://flow.cl/pay/${flowOrderId}`;

      // 7. Guardar referencia de Flow en metadatos
      reservaGuardada.metadatos = {
        ...reservaGuardada.metadatos,
        flowOrderId,
        flowUrl,
      };
      await queryRunner.manager.save(ReservaPsicologo, reservaGuardada);

      await queryRunner.commitTransaction();

      this.logger.log(`Orden Flow creada: ${flowOrderId}, reserva temporal: ${reservaGuardada.id}`);

      return {
        flowOrderId,
        flowUrl,
        monto: dto.precio,
        descuentoAplicado,
        montoFinal,
        cupon: cupon ? {
          id: cupon.id,
          nombre: cupon.nombre,
          porcentaje: cupon.porcentaje,
        } : undefined,
        reservaTemporalId: reservaGuardada.id,
      };

    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error al crear orden Flow: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Confirmar pago desde webhook de Flow y activar reserva
   */
  async confirmarPagoFlow(flowOrderId: string, datosPago: any): Promise<SesionConfirmadaResponse> {
    this.logger.log(`Confirmando pago Flow: ${flowOrderId}`);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Buscar reserva temporal por flowOrderId
      const reservaTemporal = await queryRunner.manager.findOne(ReservaPsicologo, {
        where: {
          estado: EstadoReservaPsicologo.PENDIENTE_PAGO
        },
        relations: ['psicologo', 'psicologo.usuario', 'paciente']
      });

      // Filtrar por flowOrderId en los metadatos
      if (!reservaTemporal || reservaTemporal.metadatos?.flowOrderId !== flowOrderId) {
        throw new NotFoundException('Reserva temporal no encontrada');
      }

      if (!reservaTemporal) {
        throw new NotFoundException('Reserva temporal no encontrada');
      }

      // 2. Crear el pago
      const precio = reservaTemporal.metadatos?.precio || 0;
      const descuento = reservaTemporal.descuentoAplicado || 0;
      const montoFinal = precio - descuento;

      const pago = queryRunner.manager.create(Pago, {
        tipo: TipoPago.SESION,
        monto: precio,
        cuponId: reservaTemporal.cuponId,
        descuentoAplicado: descuento,
        montoFinal: montoFinal,
        estado: EstadoPago.COMPLETADO,
        datosTransaccion: {
          metodoPago: datosPago.paymentMethod === 'credit_card' ? MetodoPago.TARJETA : MetodoPago.TRANSFERENCIA,
          referencia: flowOrderId,
          datosTarjeta: datosPago.cardLast4 ? {
            ultimos4: datosPago.cardLast4,
            marca: datosPago.cardBrand || 'unknown',
          } : undefined,
          fechaTransaccion: new Date(),
        },
        fechaCompletado: new Date(),
        metadatos: {
          tipoSesion: 'psicologo',
          psicologoId: reservaTemporal.psicologo.id,
          pacienteId: reservaTemporal.paciente.id,
          fecha: reservaTemporal.fecha,
          horaInicio: reservaTemporal.horaInicio,
          horaFin: reservaTemporal.horaFin,
          modalidad: reservaTemporal.modalidad,
          boxId: reservaTemporal.boxId,
          flowOrderId,
        }
      });

      const pagoGuardado = await queryRunner.manager.save(Pago, pago);

      // 3. Actualizar reserva a CONFIRMADA y vincular con pago
      reservaTemporal.estado = EstadoReservaPsicologo.CONFIRMADA;
      reservaTemporal.metadatos = {
        ...reservaTemporal.metadatos,
        pagoId: pagoGuardado.id,
        confirmadoEn: new Date(),
        esTemporal: false,
      };
      await queryRunner.manager.save(ReservaPsicologo, reservaTemporal);

      // 4. Incrementar uso del cupón si existe
      if (reservaTemporal.cuponId) {
        const cupon = await queryRunner.manager.findOne(Voucher, {
          where: { id: reservaTemporal.cuponId }
        });
        if (cupon) {
          cupon.usosActuales += 1;
          await queryRunner.manager.save(Voucher, cupon);
        }
      }

      await queryRunner.commitTransaction();

      this.logger.log(`Pago Flow confirmado: pago ${pagoGuardado.id}, reserva ${reservaTemporal.id}`);

      return {
        pago: {
          id: pagoGuardado.id,
          monto: pagoGuardado.monto,
          descuentoAplicado: pagoGuardado.descuentoAplicado,
          montoFinal: pagoGuardado.montoFinal,
          estado: pagoGuardado.estado,
          cuponId: pagoGuardado.cuponId,
        },
        reserva: {
          id: reservaTemporal.id,
          fecha: reservaTemporal.fecha,
          horaInicio: reservaTemporal.horaInicio,
          horaFin: reservaTemporal.horaFin,
          modalidad: reservaTemporal.modalidad,
          estado: reservaTemporal.estado,
          boxId: reservaTemporal.boxId,
        },
        cupon: reservaTemporal.cuponId ? {
          id: reservaTemporal.cuponId,
          nombre: reservaTemporal.metadatos.cuponInfo?.nombre || 'Cupón',
          porcentaje: reservaTemporal.metadatos.cuponInfo?.porcentaje || 0,
        } : undefined,
      };

    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error al confirmar pago Flow: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Confirmar pago y crear reserva de sesión en una sola transacción
   */
  async confirmarSesion(dto: ConfirmarSesionDto): Promise<SesionConfirmadaResponse> {
    this.logger.log(`Confirmando sesión: psicólogo ${dto.psicologoId}, paciente ${dto.pacienteId}`);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Validar y usar cupón si existe
      let cupon: Voucher | undefined = undefined;
      let descuentoAplicado = 0;

      if (dto.cuponId) {
        cupon = await this.validarYUsarCupon(dto.cuponId, queryRunner);
        descuentoAplicado = this.calcularDescuento(dto.precio, cupon.porcentaje);
      }

      const montoFinal = dto.precio - descuentoAplicado;

      // 2. Validar disponibilidad del psicólogo
      await this.validarDisponibilidadPsicologo(
        dto.psicologoId,
        dto.fecha,
        dto.horaInicio,
        dto.horaFin,
        queryRunner
      );

      // 3. Validar box para sesiones presenciales
      if (dto.modalidad === ModalidadSesion.PRESENCIAL) {
        if (!dto.boxId) {
          throw new BadRequestException('boxId es requerido para sesiones presenciales');
        }
        await this.validarBoxDisponible(dto.boxId, dto.fecha, dto.horaInicio, dto.horaFin, queryRunner);
      }

      // 4. Crear o actualizar paciente
      await this.crearOActualizarPaciente(dto.pacienteId, dto.psicologoId, queryRunner);

      // 5. Crear el pago
      const pago = queryRunner.manager.create(Pago, {
        tipo: TipoPago.SESION,
        monto: dto.precio,
        cuponId: cupon?.id,
        descuentoAplicado,
        montoFinal,
        estado: EstadoPago.COMPLETADO,
        datosTransaccion: dto.datosTransaccion,
        fechaCompletado: new Date(),
        metadatos: {
          tipoSesion: 'psicologo',
          psicologoId: dto.psicologoId,
          pacienteId: dto.pacienteId,
          fecha: dto.fecha,
          horaInicio: dto.horaInicio,
          horaFin: dto.horaFin,
          modalidad: dto.modalidad,
          boxId: dto.boxId,
        }
      });

      const pagoGuardado = await queryRunner.manager.save(Pago, pago);

      // 6. Crear la reserva
      const reserva = queryRunner.manager.create(ReservaPsicologo, {
        psicologo: { id: dto.psicologoId },
        paciente: { id: dto.pacienteId },
        fecha: new Date(dto.fecha),
        horaInicio: dto.horaInicio,
        horaFin: dto.horaFin,
        boxId: dto.boxId,
        modalidad: dto.modalidad,
        estado: EstadoReservaPsicologo.CONFIRMADA,
        observaciones: dto.observaciones,
        cuponId: cupon?.id,
        descuentoAplicado,
        metadatos: {
          pagoId: pagoGuardado.id,
          precio: dto.precio,
          cuponInfo: cupon ? {
            id: cupon.id,
            nombre: cupon.nombre,
            porcentaje: cupon.porcentaje,
            modalidad: cupon.modalidad,
          } : undefined,
        }
      });

      const reservaGuardada = await queryRunner.manager.save(ReservaPsicologo, reserva);

      // 7. El uso del cupón ya se incrementó en validarYUsarCupon
      await queryRunner.commitTransaction();

      this.logger.log(`Sesión confirmada: pago ${pagoGuardado.id}, reserva ${reservaGuardada.id}`);

      return {
        pago: {
          id: pagoGuardado.id,
          monto: pagoGuardado.monto,
          descuentoAplicado: pagoGuardado.descuentoAplicado,
          montoFinal: pagoGuardado.montoFinal,
          estado: pagoGuardado.estado,
          cuponId: pagoGuardado.cuponId,
        },
        reserva: {
          id: reservaGuardada.id,
          fecha: reservaGuardada.fecha,
          horaInicio: reservaGuardada.horaInicio,
          horaFin: reservaGuardada.horaFin,
          modalidad: reservaGuardada.modalidad,
          estado: reservaGuardada.estado,
          boxId: reservaGuardada.boxId,
        },
        cupon: cupon ? {
          id: cupon.id,
          nombre: cupon.nombre,
          porcentaje: cupon.porcentaje,
        } : undefined,
      };

    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error al confirmar sesión: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async validarYUsarCupon(cuponId: string, queryRunner: any): Promise<Voucher> {
    const cupon = await queryRunner.manager.findOne(Voucher, {
      where: { id: cuponId },
      relations: ['psicologo', 'psicologo.usuario']
    });

    if (!cupon) {
      throw new NotFoundException('Cupón no encontrado');
    }

    if (cupon.vencimiento < new Date()) {
      throw new BadRequestException('Cupón expirado');
    }

    if (cupon.usosActuales >= cupon.limiteUsos) {
      throw new BadRequestException('Cupón agotado');
    }

    // Incrementar uso del cupón ANTES de retornarlo
    cupon.usosActuales += 1;
    await queryRunner.manager.save(Voucher, cupon);
    
    this.logger.log(`Cupón ${cupon.nombre} usado. Usos actuales: ${cupon.usosActuales}`);

    return cupon;
  }

  private calcularDescuento(monto: number, porcentaje: number): number {
    return (monto * porcentaje) / 100;
  }

  private async validarDisponibilidadPsicologo(
    psicologoId: string,
    fecha: string,
    horaInicio: string,
    horaFin: string,
    queryRunner: any
  ): Promise<void> {
    const conflicto = await queryRunner.manager.findOne(ReservaPsicologo, {
      where: {
        psicologo: { id: psicologoId },
        fecha: new Date(fecha),
        estado: EstadoReservaPsicologo.CONFIRMADA,
      }
    });

    if (conflicto) {
      // Verificar si hay solapamiento de horarios
      if (
        (horaInicio < conflicto.horaFin && horaFin > conflicto.horaInicio)
      ) {
        throw new BadRequestException('Ya existe una reserva en ese horario para este psicólogo');
      }
    }
  }

  private async validarBoxDisponible(
    boxId: string,
    fecha: string,
    horaInicio: string,
    horaFin: string,
    queryRunner: any
  ): Promise<void> {
    const box = await queryRunner.manager.findOne(Box, {
      where: { id: boxId }
    });

    if (!box) {
      throw new NotFoundException('Box no encontrado');
    }

    if (box.estado !== 'DISPONIBLE') {
      throw new BadRequestException('El box seleccionado no está disponible');
    }

    // Verificar conflicto de horarios para el box
    const conflictoBox = await queryRunner.manager.findOne(ReservaPsicologo, {
      where: {
        boxId,
        fecha: new Date(fecha),
        estado: EstadoReservaPsicologo.CONFIRMADA,
      }
    });

    if (conflictoBox) {
      if (
        (horaInicio < conflictoBox.horaFin && horaFin > conflictoBox.horaInicio)
      ) {
        throw new BadRequestException('Ya existe una reserva en ese horario para este box');
      }
    }
  }

  private async crearOActualizarPaciente(
    pacienteId: string,
    psicologoId: string,
    queryRunner: any
  ): Promise<void> {
    let pacienteRecord = await queryRunner.manager.findOne(Paciente, {
      where: { idUsuarioPaciente: pacienteId }
    });

    if (pacienteRecord) {
      // Actualizar psicólogo existente
      pacienteRecord.idUsuarioPsicologo = psicologoId;
      pacienteRecord.ultima_actualizacion_matching = new Date();
      pacienteRecord.estado = 'ACTIVO';
    } else {
      // Crear nuevo paciente
      pacienteRecord = queryRunner.manager.create(Paciente, {
        idUsuarioPaciente: pacienteId,
        idUsuarioPsicologo: psicologoId,
        primeraSesionRegistrada: new Date(),
        estado: 'ACTIVO',
        perfil_matching_completado: false,
        diagnosticos_principales: [],
        temas_principales: [],
        estilo_terapeutico_preferido: [],
        enfoque_teorico_preferido: [],
        afinidad_personal_preferida: [],
        modalidad_preferida: [],
        genero_psicologo_preferido: []
      });
    }

    await queryRunner.manager.save(Paciente, pacienteRecord);
  }
}
