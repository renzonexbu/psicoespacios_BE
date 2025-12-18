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
import { Reserva, EstadoReserva, EstadoPagoReserva } from '../../common/entities/reserva.entity';
import { MailService } from '../../mail/mail.service';

export interface ConfirmarSesionDto {
  psicologoId: string;
  pacienteId: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  boxId?: string;
  modalidad: ModalidadSesion;
  fonasa?: boolean;
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
  fonasa?: boolean;
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
    datosTransaccion?: {
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
  };
  reserva: {
    id: string;
    fecha: Date;
    horaInicio: string;
    horaFin: string;
    modalidad: ModalidadSesion;
    fonasa: boolean;
    estado: EstadoReservaPsicologo;
    boxId?: string;
    observaciones?: string;
    psicologoId: string;
    pacienteId: string;
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
    private mailService: MailService,
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
        cupon = await this.validarYUsarCupon(dto.cuponId, queryRunner, dto.modalidad);
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
        fonasa: dto.fonasa || false,
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

      // Enviar email de confirmación (cuenta ALT) al paciente
      try {
        const pacienteEmail = reservaTemporal.paciente?.email;
        const nombrePaciente = reservaTemporal.paciente
          ? `${reservaTemporal.paciente.nombre} ${reservaTemporal.paciente.apellido || ''}`.trim()
          : undefined;
        const psicologoNombre = reservaTemporal.psicologo?.usuario
          ? `${reservaTemporal.psicologo.usuario.nombre} ${reservaTemporal.psicologo.usuario.apellido || ''}`.trim()
          : 'tu psicólogo/a';
        const fechaStr = reservaTemporal.fecha.toISOString().split('T')[0];
        const modalidad = (reservaTemporal as any).modalidad || 'online';
        let duracion: string | undefined;
        if (reservaTemporal.horaInicio && reservaTemporal.horaFin) {
          const hIni = parseInt(reservaTemporal.horaInicio.split(':')[0], 10);
          const hFin = parseInt(reservaTemporal.horaFin.split(':')[0], 10);
          if (!isNaN(hIni) && !isNaN(hFin) && hFin > hIni) {
            const diff = hFin - hIni;
            duracion = `${diff} hora${diff > 1 ? 's' : ''}`;
          }
        }
        const especialidad = reservaTemporal.psicologo?.usuario?.especialidad;
        const emailPsicologo = reservaTemporal.psicologo?.usuario?.email;
        const ubicacion =
          modalidad === 'presencial'
            ? (reservaTemporal.metadatos && reservaTemporal.metadatos.ubicacion) || undefined
            : undefined;

        if (pacienteEmail) {
          await this.mailService.sendSesionConfirmadaDerivacion(
            pacienteEmail,
            psicologoNombre,
            fechaStr,
            reservaTemporal.horaInicio,
            modalidad,
            duracion,
            nombrePaciente,
            especialidad,
            emailPsicologo,
            ubicacion,
          );
        }

        // Enviar email al psicólogo
        if (emailPsicologo) {
          await this.mailService.sendSesionConfirmadaPsicologo(
            emailPsicologo,
            nombrePaciente || 'Paciente',
            fechaStr,
            reservaTemporal.horaInicio,
            modalidad,
            ubicacion,
          );
        }
      } catch (error) {
        this.logger.warn(`No se pudo enviar email de confirmación de sesión (Flow): ${error?.message || error}`);
      }

      return {
        pago: {
          id: pagoGuardado.id,
          monto: pagoGuardado.monto,
          descuentoAplicado: pagoGuardado.descuentoAplicado,
          montoFinal: pagoGuardado.montoFinal,
          estado: pagoGuardado.estado,
          cuponId: pagoGuardado.cuponId,
          datosTransaccion: pagoGuardado.datosTransaccion,
        },
        reserva: {
          id: reservaTemporal.id,
          fecha: reservaTemporal.fecha,
          horaInicio: reservaTemporal.horaInicio,
          horaFin: reservaTemporal.horaFin,
          modalidad: reservaTemporal.modalidad,
          fonasa: reservaTemporal.fonasa || false,
          estado: reservaTemporal.estado,
          boxId: reservaTemporal.boxId,
          observaciones: reservaTemporal.observaciones,
          psicologoId: reservaTemporal.psicologo.id,
          pacienteId: reservaTemporal.paciente.id,
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
        cupon = await this.validarYUsarCupon(dto.cuponId, queryRunner, dto.modalidad);
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

      // 4. Obtener información del psicólogo
      const psicologo = await queryRunner.manager.findOne(Psicologo, {
        where: { id: dto.psicologoId },
        relations: ['usuario']
      });

      if (!psicologo) {
        throw new NotFoundException('Psicólogo no encontrado');
      }

      // 5. Crear o actualizar paciente
      await this.crearOActualizarPaciente(dto.pacienteId, dto.psicologoId, queryRunner);

      // 6. Crear el pago
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

      // 7. Crear la reserva
      // Corregir problema de timezone: crear fecha en zona horaria local
      const fechaLocal = new Date(dto.fecha + 'T00:00:00');
      
      // Log para debugging de fechas
      this.logger.log(`📅 [confirmarSesion] Fecha recibida: ${dto.fecha}`);
      this.logger.log(`📅 [confirmarSesion] Fecha procesada: ${fechaLocal.toISOString()}`);
      this.logger.log(`📅 [confirmarSesion] Hora inicio: ${dto.horaInicio}, Hora fin: ${dto.horaFin}`);
      
      const reserva = queryRunner.manager.create(ReservaPsicologo, {
        psicologo: { id: dto.psicologoId },
        paciente: { id: dto.pacienteId },
        fecha: fechaLocal,
        horaInicio: dto.horaInicio,
        horaFin: dto.horaFin,
        boxId: dto.boxId,
        modalidad: dto.modalidad,
        fonasa: dto.fonasa || false,
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

      // 8. Crear reserva de box automáticamente para sesiones presenciales
      this.logger.log(`🔍 Verificando condiciones para reserva de box:`);
      this.logger.log(`   - Modalidad: ${dto.modalidad}`);
      this.logger.log(`   - ModalidadSesion.PRESENCIAL: ${ModalidadSesion.PRESENCIAL}`);
      this.logger.log(`   - boxId: ${dto.boxId}`);
      this.logger.log(`   - Condición modalidad: ${dto.modalidad === ModalidadSesion.PRESENCIAL}`);
      this.logger.log(`   - Condición boxId: ${!!dto.boxId}`);
      
      if (dto.modalidad === ModalidadSesion.PRESENCIAL && dto.boxId) {
        this.logger.log(`✅ Creando reserva de box automática para sesión presencial`);
        
        // Obtener información del box para calcular precio
        const box = await queryRunner.manager.findOne(Box, {
          where: { id: dto.boxId },
          relations: ['sede']
        });

        if (box) {
          // Calcular precio del box
          const precioBox = this.calcularPrecioBox(box, dto.horaInicio, dto.horaFin);
          
          // Crear reserva de box en la tabla reservas
          const reservaBox = queryRunner.manager.create(Reserva, {
            boxId: dto.boxId,
            psicologoId: psicologo.usuario.id, // Usar el ID del usuario psicólogo
            fecha: fechaLocal,
            horaInicio: dto.horaInicio,
            horaFin: dto.horaFin,
            precio: precioBox,
            estado: EstadoReserva.CONFIRMADA,
            estadoPago: EstadoPagoReserva.PENDIENTE_PAGO // El box debe estar pendiente de pago por separado
          });

          const savedReservaBox = await queryRunner.manager.save(Reserva, reservaBox);
          this.logger.log(`Reserva de box creada con ID: ${savedReservaBox.id} - Precio: $${precioBox}`);
          
          // Actualizar metadatos de la sesión con información del box
          reservaGuardada.metadatos = {
            ...reservaGuardada.metadatos,
            reservaBoxId: savedReservaBox.id,
            precioBox: precioBox,
            ubicacion: `${box.sede?.nombre || 'Sede'} - ${box.sede?.direccion || ''}${box.sede?.ciudad ? ', ' + box.sede.ciudad : ''} - Box ${box.numero}`
          };
          
          await queryRunner.manager.save(ReservaPsicologo, reservaGuardada);
        } else {
          this.logger.warn(`❌ Box no encontrado con ID: ${dto.boxId}`);
        }
      } else {
        this.logger.log(`❌ No se creará reserva de box - Modalidad: ${dto.modalidad}, boxId: ${dto.boxId}`);
      }

      // 9. El uso del cupón ya se incrementó en validarYUsarCupon
      await queryRunner.commitTransaction();

      this.logger.log(`Sesión confirmada: pago ${pagoGuardado.id}, reserva ${reservaGuardada.id}`);

      // Enviar email de confirmación (cuenta ALT) al paciente
      try {
        const paciente = await this.userRepository.findOne({ where: { id: dto.pacienteId } });
        const nombrePaciente = paciente
          ? `${paciente.nombre} ${paciente.apellido || ''}`.trim()
          : undefined;
        const psicologoNombre = psicologo?.usuario
          ? `${psicologo.usuario.nombre} ${psicologo.usuario.apellido || ''}`.trim()
          : 'tu psicólogo/a';
        const modalidad = (dto as any).modalidad || 'online';
        let duracion: string | undefined;
        if (dto.horaInicio && dto.horaFin) {
          const hIni = parseInt(dto.horaInicio.split(':')[0], 10);
          const hFin = parseInt(dto.horaFin.split(':')[0], 10);
          if (!isNaN(hIni) && !isNaN(hFin) && hFin > hIni) {
            const diff = hFin - hIni;
            duracion = `${diff} hora${diff > 1 ? 's' : ''}`;
          }
        }
        const especialidad = psicologo?.usuario?.especialidad;
        const emailPsicologo = psicologo?.usuario?.email;
        const ubicacion =
          modalidad === 'presencial'
            ? (reservaGuardada.metadatos && reservaGuardada.metadatos.ubicacion) || undefined
            : undefined;

        if (paciente?.email) {
          await this.mailService.sendSesionConfirmadaDerivacion(
            paciente.email,
            psicologoNombre,
            dto.fecha,
            dto.horaInicio,
            modalidad,
            duracion,
            nombrePaciente,
            especialidad,
            emailPsicologo,
            ubicacion,
          );
        }

        // Enviar email al psicólogo
        if (emailPsicologo) {
          await this.mailService.sendSesionConfirmadaPsicologo(
            emailPsicologo,
            nombrePaciente || 'Paciente',
            dto.fecha,
            dto.horaInicio,
            modalidad,
            ubicacion,
          );
        }
      } catch (error) {
        this.logger.warn(`No se pudo enviar email de confirmación de sesión: ${error?.message || error}`);
      }

      return {
        pago: {
          id: pagoGuardado.id,
          monto: pagoGuardado.monto,
          descuentoAplicado: pagoGuardado.descuentoAplicado,
          montoFinal: pagoGuardado.montoFinal,
          estado: pagoGuardado.estado,
          cuponId: pagoGuardado.cuponId,
          datosTransaccion: pagoGuardado.datosTransaccion,
        },
        reserva: {
          id: reservaGuardada.id,
          fecha: reservaGuardada.fecha,
          horaInicio: reservaGuardada.horaInicio,
          horaFin: reservaGuardada.horaFin,
          modalidad: reservaGuardada.modalidad,
          fonasa: reservaGuardada.fonasa || false,
          estado: reservaGuardada.estado,
          boxId: reservaGuardada.boxId,
          observaciones: reservaGuardada.observaciones,
          psicologoId: dto.psicologoId,
          pacienteId: dto.pacienteId,
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

  private async validarYUsarCupon(
    cuponId: string,
    queryRunner: any,
    modalidadSesion?: ModalidadSesion
  ): Promise<Voucher> {
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

    // Validar modalidad: permite 'ambas' o coincidencia exacta con la modalidad de la sesión
    if (modalidadSesion) {
      const modalidadCupon = (cupon.modalidad || '').toLowerCase();
      const modalidadSesionStr = String(modalidadSesion).toLowerCase();
      const aplica = modalidadCupon === 'ambas' || modalidadCupon === modalidadSesionStr;
      if (!aplica) {
        throw new BadRequestException(`El cupón no aplica para la modalidad ${modalidadSesionStr}`);
      }
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
    // Normalizar fecha a LOCAL (YYYY-MM-DD) para evitar desfases por timezone
    const [yy, mm, dd] = (fecha || '').split('-').map(Number);
    const fechaLocal = new Date(yy, (mm || 1) - 1, dd || 1);
    const fechaStr = fechaLocal.toISOString().split('T')[0];

    // Verificar conflictos de horario para el psicólogo:
    // - Mismo día (comparado por string YYYY-MM-DD)
    // - Estados que bloquean (CONFIRMADA o PENDIENTE_PAGO)
    // - Solapamiento de horas (inicio < finExistente y fin > inicioExistente)
    const conflictos = await queryRunner.manager
      .createQueryBuilder(ReservaPsicologo, 'rs')
      .where('rs.psicologo_id = :psicologoId', { psicologoId })
      .andWhere('rs.fecha = :fecha', { fecha: fechaStr })
      // Solo bloquear si hay reservas ya confirmadas (evita error con enums no existentes)
      .andWhere('rs.estado IN (:...estados)', { estados: [EstadoReservaPsicologo.CONFIRMADA] })
      .andWhere('(rs.hora_inicio < :horaFin AND rs.hora_fin > :horaInicio)', { horaInicio, horaFin })
      .getCount();

    if (conflictos > 0) {
      throw new BadRequestException('Ya existe una reserva en ese horario para este psicólogo');
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
      throw new BadRequestException('box no disponible');
    }

    // Construir fecha LOCAL para evitar desfases
    const [yy, mm, dd] = (fecha || '').split('-').map(Number);
    const fechaLocal = new Date(yy, (mm || 1) - 1, dd || 1);

    // Verificar conflicto en reservas de sesiones (reservas_sesiones)
    const conflictoSesion = await queryRunner.manager
      .createQueryBuilder(ReservaPsicologo, 'rs')
      .where('rs.boxId = :boxId', { boxId })
      .andWhere('rs.fecha = :fecha', { fecha: fechaLocal.toISOString().split('T')[0] })
      .andWhere('rs.estado IN (:...estados)', { estados: [EstadoReservaPsicologo.CONFIRMADA, EstadoReservaPsicologo.PENDIENTE] })
      .andWhere('(rs.horaInicio < :horaFin AND rs.horaFin > :horaInicio)', { horaInicio, horaFin })
      .getCount();

    if (conflictoSesion > 0) {
      throw new BadRequestException('box no disponible');
    }

    // Verificar conflicto en reservas de box (reservas)
    const conflictoBox = await queryRunner.manager
      .createQueryBuilder(Reserva, 'rb')
      .where('rb.boxId = :boxId', { boxId })
      .andWhere('rb.fecha = :fecha', { fecha: fechaLocal.toISOString().split('T')[0] })
      .andWhere('rb.estado IN (:...estados)', { estados: [EstadoReserva.CONFIRMADA, EstadoReserva.PENDIENTE] })
      .andWhere('(rb.horaInicio < :horaFin AND rb.horaFin > :horaInicio)', { horaInicio, horaFin })
      .getCount();

    if (conflictoBox > 0) {
      throw new BadRequestException('box no disponible');
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

  /**
   * Calcular precio del box basado en duración y capacidad
   */
  private calcularPrecioBox(box: Box, horaInicio: string, horaFin: string): number {
    const [horaIni, minIni] = horaInicio.split(':').map(Number);
    const [horaFinNum, minFin] = horaFin.split(':').map(Number);
    
    const inicioMinutos = horaIni * 60 + minIni;
    const finMinutos = horaFinNum * 60 + minFin;
    const duracionMinutos = finMinutos - inicioMinutos;
    const duracionHoras = duracionMinutos / 60;

    let precioPorHora = 5000; // $5,000 CLP por hora base

    if (box.capacidad >= 6) {
      precioPorHora = 8000; // Box grande
    } else if (box.capacidad >= 4) {
      precioPorHora = 6000; // Box mediano
    }

    const precioTotal = Math.round(precioPorHora * duracionHoras);
    this.logger.log(`Precio calculado para Box ${box.numero}: $${precioTotal} (${duracionHoras}h × $${precioPorHora}/h)`);
    return precioTotal;
  }
}
