import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArriendosController } from './arriendos.controller';
import { ArriendosService } from './arriendos.service';
import { ArriendoBox } from '../common/entities/arriendo-box.entity';
import { Box } from '../common/entities/box.entity';
import { User } from '../common/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ArriendoBox, Box, User])],
  controllers: [ArriendosController],
  providers: [ArriendosService],
  exports: [ArriendosService],
})
export class ArriendosModule {} 