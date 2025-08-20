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
import { SolicitudDerivacion } from '../common/entities/solicitud-derivacion.entity';
import { Reserva } from '../common/entities/reserva.entity';
import { Psicologo } from '../common/entities/psicologo.entity';
import { Box } from '../common/entities/box.entity';
import { Voucher } from '../common/entities/voucher.entity';
import { ReservaPsicologo } from '../common/entities/reserva-psicologo.entity';
import { Paciente } from '../common/entities/paciente.entity';

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
      Voucher,
      ReservaPsicologo,
      Paciente,
    ]),
  ],
  controllers: [PagosController, FlowController, SimulatePaymentController, PagoSesionController],
  providers: [PagosService, FlowService, SimulatePaymentService, PagoSesionService],
  exports: [PagosService, PagoSesionService],
})
export class PagosModule {}