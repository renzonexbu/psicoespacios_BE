import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReservasPsicologosController } from './reservas-psicologos.controller';
import { ReservasPsicologosService } from './reservas-psicologos.service';
import { ReservaPsicologo } from '../common/entities/reserva-psicologo.entity';
import { User } from '../common/entities/user.entity';
import { Psicologo } from '../common/entities/psicologo.entity';
import { Box } from '../common/entities/box.entity';
import { Paciente } from '../common/entities/paciente.entity';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReservaPsicologo, User, Psicologo, Box, Paciente]),
    MailModule,
  ],
  controllers: [ReservasPsicologosController],
  providers: [ReservasPsicologosService],
  exports: [ReservasPsicologosService],
})
export class ReservasPsicologosModule {} 