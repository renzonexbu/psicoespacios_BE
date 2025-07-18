import { Controller, Post, Body } from '@nestjs/common';
import { FlowService } from '../services/flow.service';

@Controller('flow')
export class FlowController {
  constructor(private readonly flowService: FlowService) {}

  @Post('crear-pago')
  async crearPago(@Body() body) {
    const { amount, orderId, subject, email } = body;
    return this.flowService.createPayment(amount, orderId, subject, email);
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