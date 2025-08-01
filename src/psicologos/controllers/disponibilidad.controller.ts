import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { DisponibilidadService } from '../services/disponibilidad.service';
import { AvailabilityDataDto, AvailabilityResponseDto } from '../dto/disponibilidad.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('api/v1/psicologos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DisponibilidadController {
  constructor(private readonly disponibilidadService: DisponibilidadService) {}

  @Post(':userId/disponibilidad')
  @Roles('PSICOLOGO', 'ADMIN')
  async saveAvailability(
    @Param('userId') userId: string,
    @Body() data: AvailabilityDataDto
  ): Promise<AvailabilityResponseDto> {
    return this.disponibilidadService.saveAvailability(userId, data);
  }

  @Get(':userId/disponibilidad')
  @Roles('PSICOLOGO', 'ADMIN')
  async getAvailability(
    @Param('userId') userId: string
  ): Promise<AvailabilityResponseDto> {
    return this.disponibilidadService.getAvailability(userId);
  }
} 