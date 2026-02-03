import {
  Controller,
  Post,
  Body,
  BadRequestException,
  Get,
  Param,
  Logger,
  Res,
  Query,
} from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { FlowService } from '../services/flow.service';
import { PagoSesionService } from '../services/pago-sesion.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../common/entities/user.entity';
import {
  Pago,
  TipoPago,
  EstadoPago,
  MetodoPago,
} from '../../common/entities/pago.entity';
import {
  ReservaPsicologo,
  EstadoReservaPsicologo,
} from '../../common/entities/reserva-psicologo.entity';
import { CreateFlowOrderDto } from '../dto/flow-order.dto';

@Controller('api/v1/flow')
export class FlowController {
  private readonly logger = new Logger(FlowController.name);

  constructor(
    private readonly flowService: FlowService,
    private readonly pagoSesionService: PagoSesionService,
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Pago)
    private readonly pagoRepository: Repository<Pago>,
    @InjectRepository(ReservaPsicologo)
    private readonly reservaRepository: Repository<ReservaPsicologo>,
  ) {}

  @Post('crear-orden')
  async crearOrden(@Body() body: CreateFlowOrderDto) {
    this.logger.log(`Creando orden de pago para usuario: ${body.userId}`);

    // Buscar el email del usuario
    const user = await this.userRepository.findOne({
      where: { id: body.userId },
    });
    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }

    // Crear pago en Flow
    const result = await this.flowService.createPayment(
      body.amount,
      body.orderId,
      body.subject,
      user.email,
    );

    this.logger.log(`Orden creada en Flow: ${result.flowOrder}`);

    // Guardar orden en la base de datos
    const pago = new Pago();
    pago.usuario = user;
    pago.tipo = body.tipo;
    pago.monto = body.amount;
    pago.estado = EstadoPago.PENDIENTE;
    pago.datosTransaccion = {
      metodoPago: MetodoPago.TARJETA,
      referencia: body.orderId,
      fechaTransaccion: new Date(),
    };
    pago.metadatos = {
      flowOrder: result.flowOrder,
      flowToken: result.token,
      subject: body.subject,
    };

    await this.pagoRepository.save(pago);

    this.logger.log(`Pago guardado en BD con ID: ${pago.id}`);

    return {
      ...result,
      pagoId: pago.id,
      status: 'pending',
    };
  }

  @Post('confirm')
  async confirmarPago(@Body() body: any) {
    this.logger.log(`Callback recibido de Flow: ${JSON.stringify(body)}`);

    if (!this.flowService.validateSignature(body)) {
      this.logger.error('Firma de Flow no válida');
      return { status: 'error', message: 'Firma no válida' };
    }

    try {
      // Solo procesar si el pago fue exitoso (status = 1)
      if (body.status !== 1) {
        this.logger.log(
          `Pago ${body.flowOrder} no exitoso (status: ${body.status}), no se procesará`,
        );
        return { status: 'ok', message: 'Pago no exitoso, no procesado' };
      }

      // 1. Primero verificar si es una orden de sesión (buscar en reservas temporales)
      // Buscar todas las reservas pendientes de pago y filtrar por flowOrderId
      const reservasPendientes = await this.reservaRepository.find({
        where: {
          estado: EstadoReservaPsicologo.PENDIENTE_PAGO,
        },
        relations: ['psicologo', 'psicologo.usuario', 'paciente'],
      });

      // Filtrar por flowOrderId en los metadatos
      const reservaTemporal = reservasPendientes.find(
        (r) => r.metadatos?.flowOrderId === body.flowOrder,
      );

      if (reservaTemporal) {
        this.logger.log(
          `Reserva temporal encontrada para flowOrder: ${body.flowOrder}, confirmando pago de sesión`,
        );

        // Preparar datos del pago para el servicio de sesiones
        const datosPago = {
          paymentMethod: body.paymentMethod || 'credit_card',
          cardLast4: body.cardLast4,
          cardBrand: body.cardBrand,
          transactionId: body.transactionId || body.flowOrder,
        };

        // Confirmar pago de sesión usando el servicio especializado
        const resultado = await this.pagoSesionService.confirmarPagoFlow(
          body.flowOrder,
          datosPago,
        );

        this.logger.log(
          `Pago de sesión confirmado: reserva ${resultado.reserva.id}, pago ${resultado.pago.id}`,
        );

        return {
          status: 'ok',
          tipo: 'sesion',
          pagoId: resultado.pago.id,
          reservaId: resultado.reserva.id,
        };
      }

      // 2. Si no es una sesión, buscar en la tabla de pagos generales
      const pago = await this.pagoRepository.findOne({
        where: { metadatos: { flowOrder: body.flowOrder } },
        relations: ['usuario'],
      });

      if (!pago) {
        this.logger.error(
          `Pago no encontrado para flowOrder: ${body.flowOrder}`,
        );
        return { status: 'error', message: 'Pago no encontrado' };
      }

      this.logger.log(
        `Actualizando pago general ${pago.id} con status: ${body.status}`,
      );

      // Actualizar estado del pago según la respuesta de Flow
      pago.estado = EstadoPago.COMPLETADO;
      pago.fechaCompletado = new Date();
      pago.datosTransaccion = {
        ...pago.datosTransaccion,
        fechaTransaccion: new Date(),
        referencia: body.transactionId || body.flowOrder,
      };

      await this.pagoRepository.save(pago);

      this.logger.log(`Pago general ${pago.id} marcado como COMPLETADO`);

      return {
        status: 'ok',
        tipo: 'general',
        pagoId: pago.id,
      };
    } catch (error) {
      this.logger.error(`Error procesando callback de Flow: ${error.message}`);
      return { status: 'error', message: 'Error interno' };
    }
  }

  @Get('status/:flowOrder')
  async obtenerEstadoPago(@Param('flowOrder') flowOrder: string) {
    this.logger.log(`Consultando estado de pago: ${flowOrder}`);

    try {
      // Primero buscar en nuestra BD
      const pago = await this.pagoRepository.findOne({
        where: { metadatos: { flowOrder: flowOrder } },
        relations: ['usuario'],
      });

      if (!pago) {
        throw new BadRequestException('Pago no encontrado');
      }

      // Consultar estado en Flow
      const flowStatus = await this.flowService.getPaymentStatus(flowOrder);

      return {
        pagoId: pago.id,
        flowOrder: flowOrder,
        estadoLocal: pago.estado,
        estadoFlow: flowStatus.status,
        monto: pago.monto,
        usuario: {
          id: pago.usuario.id,
          email: pago.usuario.email,
          nombre: `${pago.usuario.nombre} ${pago.usuario.apellido}`,
        },
        fechaCreacion: pago.createdAt,
        fechaCompletado: pago.fechaCompletado,
        datosTransaccion: pago.datosTransaccion,
      };
    } catch (error) {
      this.logger.error(`Error consultando estado: ${error.message}`);
      throw new BadRequestException('Error al consultar estado del pago');
    }
  }

  @Get('pago/:pagoId')
  async obtenerPago(@Param('pagoId') pagoId: string) {
    const pago = await this.pagoRepository.findOne({
      where: { id: pagoId },
      relations: ['usuario'],
    });

    if (!pago) {
      throw new BadRequestException('Pago no encontrado');
    }

    return {
      id: pago.id,
      estado: pago.estado,
      monto: pago.monto,
      tipo: pago.tipo,
      usuario: {
        id: pago.usuario.id,
        email: pago.usuario.email,
        nombre: `${pago.usuario.nombre} ${pago.usuario.apellido}`,
      },
      fechaCreacion: pago.createdAt,
      fechaCompletado: pago.fechaCompletado,
      datosTransaccion: pago.datosTransaccion,
      metadatos: pago.metadatos,
    };
  }

  /**
   * Endpoint que recibe el retorno de Flow después del pago
   * Flow hace POST aquí, verificamos/confirmamos la reserva y redirigimos al frontend
   * ENDPOINT PÚBLICO - No requiere autenticación
   *
   * IMPORTANTE: Este endpoint también confirma la reserva si el webhook no lo hizo aún
   */
  @Post('return')
  async retornoFlow(
    @Body() body: any,
    @Res() res: Response,
    @Query() query: any,
  ) {
    this.logger.log(
      `Retorno de Flow recibido: ${JSON.stringify({ body, query })}`,
    );

    try {
      // Verificar si hay un error de procesamiento
      const error = body.error || query.error;
      if (error === 'processing') {
        this.logger.warn('Error de procesamiento detectado en retorno de Flow');

        // Flow puede enviar datos en el body o en query params
        const flowOrder = body.flowOrder || query.flowOrder;
        const token = body.token || query.token;

        // Buscar la reserva para cancelarla
        let reservaTemporal: ReservaPsicologo | null = null;

        if (flowOrder) {
          reservaTemporal = await this.reservaRepository
            .createQueryBuilder('reserva')
            .where('reserva.estado IN (:...estados)', {
              estados: [
                EstadoReservaPsicologo.PENDIENTE_PAGO,
                EstadoReservaPsicologo.CONFIRMADA,
              ],
            })
            .andWhere("reserva.metadatos->>'flowOrderId' = :flowOrder", {
              flowOrder,
            })
            .getOne();
        }

        // Si no se encontró por flowOrder, intentar por token
        if (!reservaTemporal && token) {
          reservaTemporal = await this.reservaRepository
            .createQueryBuilder('reserva')
            .where('reserva.estado IN (:...estados)', {
              estados: [
                EstadoReservaPsicologo.PENDIENTE_PAGO,
                EstadoReservaPsicologo.CONFIRMADA,
              ],
            })
            .andWhere("reserva.metadatos->>'flowToken' = :token", { token })
            .getOne();
        }

        // Si encontramos la reserva, cancelarla
        if (
          reservaTemporal &&
          reservaTemporal.estado !== EstadoReservaPsicologo.CANCELADA
        ) {
          this.logger.log(
            `Cancelando reserva ${reservaTemporal.id} debido a error de procesamiento`,
          );
          reservaTemporal.estado = EstadoReservaPsicologo.CANCELADA;
          await this.reservaRepository.save(reservaTemporal);
          this.logger.log(
            `Reserva ${reservaTemporal.id} cancelada exitosamente`,
          );

          // Redirigir con el ID de la reserva cancelada
          const frontUrl = this.getFrontUrl();
          const redirectUrl = `${frontUrl}/agenda/confirmacion-sesion?reservaId=${reservaTemporal.id}`;
          this.logger.log(
            `Redirigiendo a frontend con reserva cancelada: ${redirectUrl}`,
          );
          return res.redirect(redirectUrl);
        } else if (reservaTemporal) {
          // Ya estaba cancelada, solo redirigir
          const frontUrl = this.getFrontUrl();
          const redirectUrl = `${frontUrl}/agenda/confirmacion-sesion?reservaId=${reservaTemporal.id}`;
          return res.redirect(redirectUrl);
        } else {
          // No se encontró la reserva, redirigir con error
          this.logger.warn(
            'No se encontró reserva para cancelar en caso de error de procesamiento',
          );
          const frontUrl = this.getFrontUrl();
          return res.redirect(
            `${frontUrl}/agenda/confirmacion-sesion?error=processing`,
          );
        }
      }

      // Flow puede enviar datos en el body o en query params
      const flowOrder = body.flowOrder || query.flowOrder;
      const token = body.token || query.token;

      this.logger.log(
        `Datos recibidos de Flow - flowOrder: ${flowOrder}, token: ${token}`,
      );

      if (!flowOrder && !token) {
        this.logger.error(
          'No se recibió flowOrder ni token en el retorno de Flow',
        );
        // Redirigir al frontend de todas formas
        return res.redirect(
          `${this.getFrontUrl()}/agenda/confirmacion-sesion?error=no-order`,
        );
      }

      // Obtener el estado real del pago desde Flow usando getStatus
      // Según documentación: https://developers.flow.cl/docs/tutorial-basics/status
      let statusReal = null;
      let pagoExitoso = false;

      try {
        // Priorizar token (requerido por getStatus), sino usar flowOrder con getStatusByFlowOrder
        if (token) {
          this.logger.log(
            `Consultando estado del pago en Flow con token: ${token}`,
          );
          const estadoPago = await this.flowService.getPaymentStatus(token);
          statusReal = estadoPago.status;
          pagoExitoso = estadoPago.status === 2; // Según doc: 2 = pagada, 1 = pendiente

          this.logger.log(
            `Estado del pago obtenido de Flow - status: ${statusReal}, flowOrder: ${estadoPago.flowOrder}, pagoExitoso: ${pagoExitoso}`,
          );
        } else if (flowOrder) {
          this.logger.log(
            `Consultando estado del pago en Flow con flowOrder: ${flowOrder}`,
          );
          const estadoPago =
            await this.flowService.getPaymentStatusByFlowOrder(flowOrder);
          statusReal = estadoPago.status;
          pagoExitoso = estadoPago.status === 2; // Según doc: 2 = pagada, 1 = pendiente

          this.logger.log(
            `Estado del pago obtenido de Flow - status: ${statusReal}, flowOrder: ${estadoPago.flowOrder}, pagoExitoso: ${pagoExitoso}`,
          );
        } else {
          this.logger.warn(
            'No hay token ni flowOrder para consultar estado del pago',
          );
          pagoExitoso = false;
        }
      } catch (error) {
        this.logger.error(
          `Error al consultar estado del pago en Flow: ${error.message}`,
        );
        // Si falla la consulta, asumir que el pago no fue exitoso
        pagoExitoso = false;
      }

      // Buscar la reserva temporal por flowOrderId o token en los metadatos
      // Usar query builder para buscar en JSONB de forma más eficiente
      let reservaTemporal: ReservaPsicologo | null = null;

      if (flowOrder) {
        reservaTemporal = await this.reservaRepository
          .createQueryBuilder('reserva')
          .where('reserva.estado IN (:...estados)', {
            estados: [
              EstadoReservaPsicologo.PENDIENTE_PAGO,
              EstadoReservaPsicologo.CONFIRMADA,
            ],
          })
          .andWhere("reserva.metadatos->>'flowOrderId' = :flowOrder", {
            flowOrder,
          })
          .leftJoinAndSelect('reserva.psicologo', 'psicologo')
          .leftJoinAndSelect('psicologo.usuario', 'usuario')
          .leftJoinAndSelect('reserva.paciente', 'paciente')
          .getOne();
      }

      // Si no se encontró por flowOrder, intentar por token
      if (!reservaTemporal && token) {
        reservaTemporal = await this.reservaRepository
          .createQueryBuilder('reserva')
          .where('reserva.estado IN (:...estados)', {
            estados: [
              EstadoReservaPsicologo.PENDIENTE_PAGO,
              EstadoReservaPsicologo.CONFIRMADA,
            ],
          })
          .andWhere("reserva.metadatos->>'flowToken' = :token", { token })
          .leftJoinAndSelect('reserva.psicologo', 'psicologo')
          .leftJoinAndSelect('psicologo.usuario', 'usuario')
          .leftJoinAndSelect('reserva.paciente', 'paciente')
          .getOne();
      }

      this.logger.log(
        `Buscando reserva para flowOrder: ${flowOrder || token}, encontrada: ${reservaTemporal?.id || 'no encontrada'}`,
      );

      const frontUrl = this.getFrontUrl();

      if (!reservaTemporal) {
        // Si no encontramos la reserva, redirigir con error
        const redirectUrl = `${frontUrl}/agenda/confirmacion-sesion?error=not-found`;
        this.logger.warn(
          `Reserva no encontrada para flowOrder: ${flowOrder || token}`,
        );
        return res.redirect(redirectUrl);
      }

      // Verificar si el pago fue exitoso (status = 1) y la reserva aún no está confirmada
      const reservaPendiente =
        reservaTemporal.estado === EstadoReservaPsicologo.PENDIENTE_PAGO;

      this.logger.log(
        `Evaluación de pago - status obtenido de Flow: ${statusReal}, pagoExitoso: ${pagoExitoso}, reservaPendiente: ${reservaPendiente}, estado actual: ${reservaTemporal.estado}`,
      );

      // SIEMPRE intentar confirmar si el pago fue exitoso, independientemente del estado actual
      // Esto asegura que la reserva se confirme incluso si el webhook no llegó
      if (pagoExitoso) {
        if (reservaPendiente) {
          // El webhook puede no haber procesado aún, confirmar la reserva aquí
          this.logger.log(
            `Pago exitoso detectado en retorno, confirmando reserva ${reservaTemporal.id}`,
          );

          try {
            // Preparar datos del pago para confirmar
            const datosPago = {
              paymentMethod: body.paymentMethod || 'credit_card',
              cardLast4: body.cardLast4,
              cardBrand: body.cardBrand,
              transactionId: body.transactionId || flowOrder || token,
            };

            // Confirmar el pago usando el ID de la reserva directamente (más eficiente)
            await this.pagoSesionService.confirmarPagoPorReservaId(
              reservaTemporal.id,
              datosPago,
            );
            this.logger.log(
              `✅ Reserva ${reservaTemporal.id} confirmada desde endpoint return`,
            );

            // Recargar la reserva desde la BD para obtener el estado actualizado
            if (reservaTemporal) {
              const reservaRecargada = await this.reservaRepository.findOne({
                where: { id: reservaTemporal.id },
                relations: ['psicologo', 'psicologo.usuario', 'paciente'],
              });

              if (reservaRecargada) {
                reservaTemporal = reservaRecargada;
                this.logger.log(
                  `✅ Reserva recargada - Estado actualizado: ${reservaTemporal.estado}`,
                );
              }
            }
          } catch (error) {
            // Si falla la confirmación, loguear pero continuar
            this.logger.error(
              `❌ Error al confirmar reserva desde return: ${error.message}`,
              error.stack,
            );
            // Recargar la reserva por si acaso el webhook la confirmó
            if (reservaTemporal) {
              const reservaRecargada = await this.reservaRepository.findOne({
                where: { id: reservaTemporal.id },
                relations: ['psicologo', 'psicologo.usuario', 'paciente'],
              });
              if (reservaRecargada) {
                reservaTemporal = reservaRecargada;
                this.logger.log(
                  `Reserva recargada después de error - Estado: ${reservaTemporal.estado}`,
                );
              }
            }
          }
        } else {
          // Ya está confirmada, solo recargar para asegurar estado actualizado
          this.logger.log(
            `Reserva ${reservaTemporal.id} ya está confirmada, recargando estado...`,
          );
          const reservaRecargada = await this.reservaRepository.findOne({
            where: { id: reservaTemporal.id },
            relations: ['psicologo', 'psicologo.usuario', 'paciente'],
          });
          if (reservaRecargada) {
            reservaTemporal = reservaRecargada;
          }
        }
      } else {
        // Pago no exitoso
        this.logger.log(
          `⚠️ Pago no exitoso (status: ${status}), reserva ${reservaTemporal.id} permanece pendiente`,
        );
      }

      // Asegurarse de tener la reserva más actualizada antes de redirigir
      if (!reservaTemporal) {
        // Si no hay reserva, redirigir con error
        const redirectUrl = `${frontUrl}/agenda/confirmacion-sesion?error=not-found`;
        this.logger.error(
          'Reserva no encontrada después de procesar el retorno',
        );
        return res.redirect(redirectUrl);
      }

      // Recargar la reserva para obtener el estado más actualizado
      const reservaActualizada = await this.reservaRepository.findOne({
        where: { id: reservaTemporal.id },
        relations: ['psicologo', 'psicologo.usuario', 'paciente'],
      });

      if (reservaActualizada) {
        reservaTemporal = reservaActualizada;
      }

      // Redirigir al frontend solo con reservaId
      const redirectUrl = `${frontUrl}/agenda/confirmacion-sesion?reservaId=${reservaTemporal.id}`;
      this.logger.log(
        `Redirigiendo a frontend: ${redirectUrl} - Estado de reserva: ${reservaTemporal.estado}`,
      );
      return res.redirect(redirectUrl);
    } catch (error) {
      this.logger.error(`Error procesando retorno de Flow: ${error.message}`);
      // Redirigir al frontend incluso si hay error
      const frontUrl = this.getFrontUrl();
      return res.redirect(
        `${frontUrl}/agenda/confirmacion-sesion?error=processing`,
      );
    }
  }

  /**
   * Helper para obtener la URL del frontend
   */
  private getFrontUrl(): string {
    return this.configService.get<string>('FRONT_URL', 'http://localhost:3001');
  }
}
