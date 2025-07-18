import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PagosController } from './controllers/pagos.controller';
import { PagosService } from './services/pagos.service';
import { FlowController } from './controllers/flow.controller';
import { FlowService } from './services/flow.service';
import { Pago } from '../common/entities/pago.entity';
import { User } from '../common/entities/user.entity';
import { Suscripcion } from '../common/entities/suscripcion.entity';
import { SolicitudDerivacion } from '../common/entities/solicitud-derivacion.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Pago,
      User,
      Suscripcion,
      SolicitudDerivacion,
    ]),
  ],
  controllers: [PagosController, FlowController],
  providers: [PagosService, FlowService],
  exports: [PagosService],
})
export class PagosModule {}