import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PagosService } from '../services/pagos.service';
import { CreatePagoDto, UpdatePagoDto } from '../dto/pago.dto';

@Controller('api/v1/pagos')
@UseGuards(JwtAuthGuard)
export class PagosController {
  constructor(private readonly pagosService: PagosService) {}

  @Post('suscripcion')
  async createPagoSuscripcion(@Body() createPagoDto: CreatePagoDto, @Request() req) {
    return this.pagosService.createPagoSuscripcion(createPagoDto, req.user.id);
  }

  @Post('derivacion')
  async createPagoDerivacion(@Body() createPagoDto: CreatePagoDto, @Request() req) {
    return this.pagosService.createPagoDerivacion(createPagoDto, req.user.id);
  }

  @Get()
  async findAll(@Request() req) {
    return this.pagosService.findAll(req.user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    return this.pagosService.findOne(id, req.user.id);
  }

  @Post(':id/reembolsar')
  async reembolsar(
    @Param('id') id: string,
    @Body() reembolsoDto: { motivo: string },
    @Request() req,
  ) {
    return this.pagosService.reembolsar(id, reembolsoDto.motivo);
  }
}