import { Controller, Post, Body, Get, Logger } from '@nestjs/common';
import { SimulatePaymentService } from '../services/simulate-payment.service';
import { SimulatePaymentDto } from '../dto/simulate-payment.dto';

@Controller('api/v1/simulate')
export class SimulatePaymentController {
  private readonly logger = new Logger(SimulatePaymentController.name);

  constructor(private readonly simulatePaymentService: SimulatePaymentService) {}

  @Post('payment')
  async simulatePayment(@Body() simulateDto: SimulatePaymentDto) {
    this.logger.log(`Solicitud de simulación de pago recibida`);
    return this.simulatePaymentService.simulatePayment(simulateDto);
  }

  @Get('stats')
  async getSimulationStats() {
    this.logger.log(`Consultando estadísticas de simulaciones`);
    return this.simulatePaymentService.getSimulationStats();
  }

  @Post('payment/success')
  async simulateSuccessfulPayment(@Body() simulateDto: SimulatePaymentDto) {
    this.logger.log(`Simulando pago exitoso`);
    return this.simulatePaymentService.simulatePayment({
      ...simulateDto,
      simulateStatus: 'success'
    });
  }

  @Post('payment/failed')
  async simulateFailedPayment(@Body() simulateDto: SimulatePaymentDto) {
    this.logger.log(`Simulando pago fallido`);
    return this.simulatePaymentService.simulatePayment({
      ...simulateDto,
      simulateStatus: 'failed'
    });
  }

  @Post('payment/pending')
  async simulatePendingPayment(@Body() simulateDto: SimulatePaymentDto) {
    this.logger.log(`Simulando pago pendiente`);
    return this.simulatePaymentService.simulatePayment({
      ...simulateDto,
      simulateStatus: 'pending'
    });
  }

  @Post('payment/cancelled')
  async simulateCancelledPayment(@Body() simulateDto: SimulatePaymentDto) {
    this.logger.log(`Simulando pago cancelado`);
    return this.simulatePaymentService.simulatePayment({
      ...simulateDto,
      simulateStatus: 'cancelled'
    });
  }
} 