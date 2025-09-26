import { Controller, Post, Get, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { BoxReservationService } from '../services/box-reservation.service';
import { CreateBoxReservationDto, UpdateBoxReservationDto, UpdateBoxReservationPaymentDto, BoxReservationResponseDto } from '../dto/box-reservation.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('api/v1/boxes/reservations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BoxReservationController {
  constructor(private readonly boxReservationService: BoxReservationService) {}

  @Post()
  @Roles('PSICOLOGO', 'ADMIN')
  async createReservation(@Body() dto: CreateBoxReservationDto): Promise<BoxReservationResponseDto> {
    return this.boxReservationService.createReservation(dto);
  }

  @Get(':id')
  @Roles('PSICOLOGO', 'ADMIN')
  async getReservation(@Param('id') id: string): Promise<BoxReservationResponseDto> {
    return this.boxReservationService.getReservation(id);
  }

  @Put(':id/status')
  @Roles('PSICOLOGO', 'ADMIN')
  async updateReservationStatus(
    @Param('id') id: string,
    @Body() dto: UpdateBoxReservationDto
  ): Promise<BoxReservationResponseDto> {
    return this.boxReservationService.updateReservationStatus(id, dto);
  }

  @Put(':id/payment-status')
  @Roles('PSICOLOGO', 'ADMIN')
  async updateReservationPaymentStatus(
    @Param('id') id: string,
    @Body() dto: UpdateBoxReservationPaymentDto
  ): Promise<BoxReservationResponseDto> {
    return this.boxReservationService.updateReservationPaymentStatus(id, dto);
  }

  @Put(':id/cancel')
  @Roles('PSICOLOGO', 'ADMIN')
  async cancelReservation(@Param('id') id: string): Promise<BoxReservationResponseDto> {
    return this.boxReservationService.cancelReservation(id);
  }

  @Get('psicologo/:psicologoId')
  @Roles('PSICOLOGO', 'ADMIN')
  async getReservationsByPsicologo(@Param('psicologoId') psicologoId: string): Promise<BoxReservationResponseDto[]> {
    return this.boxReservationService.getReservationsByPsicologo(psicologoId);
  }

  @Get('box/:boxId')
  @Roles('PSICOLOGO', 'ADMIN')
  async getReservationsByBox(@Param('boxId') boxId: string): Promise<BoxReservationResponseDto[]> {
    return this.boxReservationService.getReservationsByBox(boxId);
  }

  @Get('box/:boxId/availability')
  @Roles('PSICOLOGO', 'ADMIN')
  async getBoxAvailability(
    @Param('boxId') boxId: string,
    @Query('mes') mes: number,
    @Query('anio') anio: number
  ): Promise<any[]> {
    return this.boxReservationService.getBoxAvailability(boxId, mes, anio);
  }

  @Get('box/:boxId/availability/:fecha')
  @Roles('PSICOLOGO', 'ADMIN')
  async getBoxAvailabilityByDate(
    @Param('boxId') boxId: string,
    @Param('fecha') fecha: string
  ): Promise<any> {
    return this.boxReservationService.getBoxAvailabilityByDate(boxId, fecha);
  }

  // Endpoint de debug para verificar reservas
  @Get('debug/box/:boxId/fecha/:fecha')
  @Roles('ADMIN')
  async debugBoxReservations(
    @Param('boxId') boxId: string,
    @Param('fecha') fecha: string
  ): Promise<any> {
    return this.boxReservationService.debugBoxReservations(boxId, fecha);
  }
} 