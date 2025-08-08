import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PagosController } from './controllers/pagos.controller';
import { PagosService } from './services/pagos.service';
import { FlowController } from './controllers/flow.controller';
import { FlowService } from './services/flow.service';
import { SimulatePaymentController } from './controllers/simulate-payment.controller';
import { SimulatePaymentService } from './services/simulate-payment.service';
import { Pago } from '../common/entities/pago.entity';
import { User } from '../common/entities/user.entity';
import { Suscripcion } from '../common/entities/suscripcion.entity';
import { SolicitudDerivacion } from '../common/entities/solicitud-derivacion.entity';
import { Reserva } from '../common/entities/reserva.entity';
import { Psicologo } from '../common/entities/psicologo.entity';
import { Box } from '../common/entities/box.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Pago,
      User,
      Suscripcion,
      SolicitudDerivacion,
      Reserva,
      Psicologo,
      Box,
    ]),
  ],
  controllers: [PagosController, FlowController, SimulatePaymentController],
  providers: [PagosService, FlowService, SimulatePaymentService],
  exports: [PagosService],
})
export class PagosModule {}