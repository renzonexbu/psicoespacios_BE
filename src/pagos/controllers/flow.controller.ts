import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { FlowService } from '../services/flow.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../common/entities/user.entity';
import { Pago, TipoPago, EstadoPago, MetodoPago } from '../../common/entities/pago.entity';
import { CreateFlowOrderDto } from '../dto/flow-order.dto';

@Controller('api/v1/flow')
export class FlowController {
  constructor(
    private readonly flowService: FlowService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Pago)
    private readonly pagoRepository: Repository<Pago>,
  ) {}

  @Post('crear-orden')
  async crearOrden(@Body() body: CreateFlowOrderDto) {
    // Buscar el email del usuario
    const user = await this.userRepository.findOne({ where: { id: body.userId } });
    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }
    
    // Crear pago en Flow
    const result = await this.flowService.createPayment(body.amount, body.orderId, body.subject, user.email);
    


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
    
    return result;
  }

  @Post('confirm')
  async confirmarPago(@Body() body) {
    if (this.flowService.validateSignature(body)) {
      // Buscar el pago por flowOrder
      const pago = await this.pagoRepository.findOne({
        where: { metadatos: { flowOrder: body.flowOrder } }
      });
      
      if (pago) {
        // Actualizar estado del pago según la respuesta de Flow
        if (body.status === 1) { // Pago exitoso
          pago.estado = EstadoPago.COMPLETADO;
          pago.fechaCompletado = new Date();
        } else if (body.status === 2) { // Pago fallido
          pago.estado = EstadoPago.FALLIDO;
        }
        
        await this.pagoRepository.save(pago);
      }
      
      return { status: 'ok' };
    } else {
      return { status: 'error', message: 'Firma no válida' };
    }
  }
} 