import { Controller, Post, Get, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { VouchersService } from './vouchers.service';
import { CreateVoucherDto, UpdateVoucherDto } from '../common/dto/voucher.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('api/v1/vouchers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VouchersController {
  constructor(private readonly vouchersService: VouchersService) {}

  @Post()
  @Roles('ADMIN', 'PSICOLOGO')
  create(@Body() dto: CreateVoucherDto) {
    return this.vouchersService.create(dto);
  }

  @Get()
  @Roles('ADMIN', 'PSICOLOGO')
  findAll() {
    return this.vouchersService.findAll();
  }

  @Get(':id')
  @Roles('ADMIN', 'PSICOLOGO')
  findOne(@Param('id') id: string) {
    return this.vouchersService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'PSICOLOGO')
  update(@Param('id') id: string, @Body() dto: UpdateVoucherDto) {
    return this.vouchersService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN', 'PSICOLOGO')
  remove(@Param('id') id: string) {
    return this.vouchersService.remove(id);
  }

  @Get('psicologo/:psicologoUserId')
  @Roles('ADMIN', 'PSICOLOGO')
  findByPsicologoUserId(@Param('psicologoUserId') psicologoUserId: string) {
    return this.vouchersService.findByPsicologoUserId(psicologoUserId);
  }

  @Patch(':id/restore')
  @Roles('ADMIN')
  restore(@Param('id') id: string) {
    return this.vouchersService.restore(id);
  }
} 