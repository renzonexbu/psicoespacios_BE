import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PagosController } from './controllers/pagos.controller';
import { PagosService } from './services/pagos.service';
import { FlowController } from './controllers/flow.controller';
import { FlowService } from './services/flow.service';
import { SimulatePaymentController } from './controllers/simulate-payment.controller';
import { SimulatePaymentService } from './services/simulate-payment.service';
import { PagoSesionController } from './controllers/pago-sesion.controller';
import { PagoSesionService } from './services/pago-sesion.service';
import { Pago } from '../common/entities/pago.entity';
import { User } from '../common/entities/user.entity';
import { Suscripcion } from '../common/entities/suscripcion.entity';
import { Plan } from '../common/entities/plan.entity';
import { SolicitudDerivacion } from '../common/entities/solicitud-derivacion.entity';
import { Reserva } from '../common/entities/reserva.entity';
import { Psicologo } from '../common/entities/psicologo.entity';
import { Box } from '../common/entities/box.entity';
import { Voucher } from '../common/entities/voucher.entity';
import { ReservaPsicologo } from '../common/entities/reserva-psicologo.entity';
import { Paciente } from '../common/entities/paciente.entity';
import { MailModule } from '../mail/mail.module';
import { FlowSubscriptionsService } from './services/flow-subscriptions.service';
import { FlowSubscriptionsController } from './controllers/flow-subscriptions.controller';
import { FlowSubscriptionsReconciliationService } from './services/flow-subscriptions.reconciliation.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Pago,
      User,
      Suscripcion,
      Plan,
      SolicitudDerivacion,
      Reserva,
      Psicologo,
      Box,
      Voucher,
      ReservaPsicologo,
      Paciente,
    ]),
    MailModule,
  ],
  controllers: [
    PagosController,
    FlowController,
    FlowSubscriptionsController,
    SimulatePaymentController,
    PagoSesionController,
  ],
  providers: [
    PagosService,
    FlowService,
    FlowSubscriptionsService,
    FlowSubscriptionsReconciliationService,
    SimulatePaymentService,
    PagoSesionService,
  ],
  exports: [PagosService, PagoSesionService, FlowService, FlowSubscriptionsService],
})
export class PagosModule {}
