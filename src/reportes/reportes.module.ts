import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportesController } from './controllers/reportes.controller';
import { ReportesService } from './services/reportes.service';
import { Reporte } from '../common/entities/reporte.entity';
import { User } from '../common/entities/user.entity';
import { Reserva } from '../common/entities/reserva.entity';
import { Pago } from '../common/entities/pago.entity';
import { Paciente } from '../common/entities/paciente.entity';
import { SolicitudDerivacion } from '../common/entities/solicitud-derivacion.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Reporte,
      User,
      Reserva,
      Pago,
      Paciente,
      SolicitudDerivacion,
    ]),
  ],
  controllers: [ReportesController],
  providers: [ReportesService],
  exports: [ReportesService],
})
export class ReportesModule {}