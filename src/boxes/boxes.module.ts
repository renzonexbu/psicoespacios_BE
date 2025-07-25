import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BoxesController } from './boxes.controller';
import { BoxesService } from './boxes.service';
import { Box } from '../common/entities/box.entity';
import { Sede } from '../common/entities/sede.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Box, Sede])],
  controllers: [BoxesController],
  providers: [BoxesService],
  exports: [BoxesService],
})
export class BoxesModule {} 