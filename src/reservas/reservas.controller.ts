import { Controller, Get, Post, Body, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { ReservasService } from './reservas.service';
import { CreateReservaDto, UpdateReservaDto } from './dto/reserva.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('reservas')
@UseGuards(JwtAuthGuard)
export class ReservasController {
  constructor(private readonly reservasService: ReservasService) {}

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.reservasService.findOne(id);
  }

  @Post()
  async create(@Body() createReservaDto: CreateReservaDto) {
    return this.reservasService.create(createReservaDto);
  }

  @Post(':id/cancel')
  @UseGuards(RolesGuard)
  @Roles('PSICOLOGO')
  async cancel(
    @Param('id') id: string,
    @Body() updateReservaDto: UpdateReservaDto,
    @Request() req,
  ) {
    return this.reservasService.cancel(id, updateReservaDto, req.user.id);
  }
}