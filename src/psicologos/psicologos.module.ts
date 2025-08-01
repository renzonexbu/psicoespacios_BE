import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PsicologosController } from './psicologos.controller';
import { PsicologosService } from './psicologos.service';
import { DisponibilidadController } from './controllers/disponibilidad.controller';
import { DisponibilidadService } from './services/disponibilidad.service';
import { Disponibilidad } from './entities/disponibilidad.entity';
import { User } from '../common/entities/user.entity';
import { Sede } from '../common/entities/sede.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Disponibilidad,
      User,
      Sede,
    ]),
  ],
  controllers: [PsicologosController, DisponibilidadController],
  providers: [PsicologosService, DisponibilidadService],
  exports: [DisponibilidadService],
})
export class PsicologosModule {}
