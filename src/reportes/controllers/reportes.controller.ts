import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ReportesService } from '../services/reportes.service';
import { CreateReporteDto } from '../dto/reporte.dto';
import { TipoReporte } from '../../common/entities/reporte.entity';

@Controller('api/v1/reportes')
@UseGuards(JwtAuthGuard)
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Post()
  async create(@Body() createReporteDto: CreateReporteDto, @Request() req) {
    return await this.reportesService.create(createReporteDto, req.user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    return await this.reportesService.findOne(id, req.user.id);
  }

  @Get()
  async findAll(@Request() req) {
    return this.reportesService.findAll(req.user.id);
  }

  @Get('tipos')
  getTiposReporte() {
    return Object.values(TipoReporte);
  }
}