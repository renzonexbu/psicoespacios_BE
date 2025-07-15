import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Voucher } from '../common/entities/voucher.entity';
import { Psicologo } from '../common/entities/psicologo.entity';
import { VouchersService } from './vouchers.service';
import { VouchersController } from './vouchers.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Voucher, Psicologo])],
  providers: [VouchersService],
  controllers: [VouchersController],
  exports: [VouchersService],
})
export class VouchersModule {} 