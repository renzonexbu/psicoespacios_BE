import { Controller, Post, Body, BadRequestException, Get, Param, Logger } from '@nestjs/common';
import { FlowService } from '../services/flow.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../common/entities/user.entity';
import { Pago, TipoPago, EstadoPago, MetodoPago } from '../../common/entities/pago.entity';
import { CreateFlowOrderDto } from '../dto/flow-order.dto';

@Controller('api/v1/flow')
export class FlowController {
  private readonly logger = new Logger(FlowController.name);

  constructor(
    private readonly flowService: FlowService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Pago)
    private readonly pagoRepository: Repository<Pago>,
  ) {}

  @Post('crear-orden')
  async crearOrden(@Body() body: CreateFlowOrderDto) {
    this.logger.log(`Creando orden de pago para usuario: ${body.userId}`);
    
    // Buscar el email del usuario
    const user = await this.userRepository.findOne({ where: { id: body.userId } });
    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }
    
    // Crear pago en Flow
    const result = await this.flowService.createPayment(body.amount, body.orderId, body.subject, user.email);
    
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
      fechaTransaccion: new Date()
    };
    pago.metadatos = {
      flowOrder: result.flowOrder,
      flowToken: result.token,
      subject: body.subject
    };
    
    await this.pagoRepository.save(pago);
    
    this.logger.log(`Pago guardado en BD con ID: ${pago.id}`);
    
    return {
      ...result,
      pagoId: pago.id,
      status: 'pending'
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
      // Buscar el pago por flowOrder
      const pago = await this.pagoRepository.findOne({
        where: { metadatos: { flowOrder: body.flowOrder } },
        relations: ['usuario']
      });
      
      if (!pago) {
        this.logger.error(`Pago no encontrado para flowOrder: ${body.flowOrder}`);
        return { status: 'error', message: 'Pago no encontrado' };
      }

      this.logger.log(`Actualizando pago ${pago.id} con status: ${body.status}`);
      
      // Actualizar estado del pago según la respuesta de Flow
      switch (body.status) {
        case 1: // Pago exitoso
          pago.estado = EstadoPago.COMPLETADO;
          pago.fechaCompletado = new Date();
                       pago.datosTransaccion = {
               ...pago.datosTransaccion,
               fechaTransaccion: new Date(),
               referencia: body.transactionId || body.flowOrder
             };
          this.logger.log(`Pago ${pago.id} marcado como COMPLETADO`);
          break;
          
        case 2: // Pago fallido
          pago.estado = EstadoPago.FALLIDO;
                         pago.datosTransaccion = {
                 ...pago.datosTransaccion,
                 fechaTransaccion: new Date(),
                 referencia: 'FAILED'
               };
          this.logger.log(`Pago ${pago.id} marcado como FALLIDO`);
          break;
          
                       case 3: // Pago anulado
                 pago.estado = EstadoPago.FALLIDO; // Usar FALLIDO en lugar de CANCELADO
                 pago.datosTransaccion = {
                   ...pago.datosTransaccion,
                   fechaTransaccion: new Date(),
                   referencia: 'CANCELLED'
                 };
          this.logger.log(`Pago ${pago.id} marcado como CANCELADO`);
          break;
          
        default:
          this.logger.warn(`Status desconocido de Flow: ${body.status}`);
      }
      
      await this.pagoRepository.save(pago);
      
      // Aquí podrías agregar lógica adicional como:
      // - Enviar email de confirmación
      // - Actualizar suscripciones
      // - Crear reservas automáticamente
      // - Notificar al frontend via WebSocket
      
      return { status: 'ok', pagoId: pago.id };
      
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
        relations: ['usuario']
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
          nombre: `${pago.usuario.nombre} ${pago.usuario.apellido}`
        },
        fechaCreacion: pago.createdAt,
        fechaCompletado: pago.fechaCompletado,
        datosTransaccion: pago.datosTransaccion
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
      relations: ['usuario']
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
        nombre: `${pago.usuario.nombre} ${pago.usuario.apellido}`
      },
      fechaCreacion: pago.createdAt,
      fechaCompletado: pago.fechaCompletado,
      datosTransaccion: pago.datosTransaccion,
      metadatos: pago.metadatos
    };
  }
} 