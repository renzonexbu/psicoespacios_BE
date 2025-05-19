import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContactoService } from './contacto.service';
import { ContactoController } from './contacto.controller';
import { Contacto } from '../common/entities/contacto.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Contacto])],
  controllers: [ContactoController],
  providers: [ContactoService],
  exports: [ContactoService],
})
export class ContactoModule {}
