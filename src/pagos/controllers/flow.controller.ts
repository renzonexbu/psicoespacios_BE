import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { FlowService } from '../services/flow.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../common/entities/user.entity';

@Controller('api/v1/flow')
export class FlowController {
  constructor(
    private readonly flowService: FlowService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  @Post('crear-orden')
  async crearOrden(@Body() body: { amount: number, orderId: string, subject: string, userId: string }) {
    // Buscar el email del usuario
    const user = await this.userRepository.findOne({ where: { id: body.userId } });
    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }
    const result = await this.flowService.createPayment(body.amount, body.orderId, body.subject, user.email);
    return result;
  }

  @Post('confirm')
  async confirmarPago(@Body() body) {
    if (this.flowService.validateSignature(body)) {
      // Actualizar estado del pedido, guardar pago, etc.
      return { status: 'ok' };
    } else {
      return { status: 'error', message: 'Firma no válida' };
    }
  }
} 