import { Controller, Get, Query, UseGuards, Request, Param, BadRequestException, Res } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ConsolidadoService } from './consolidado.service';
import { QueryConsolidadoMensualDto, ConsolidadoMensualDto, QueryConsolidadoMensualGlobalDto } from './dto/consolidado-mensual.dto';
import { Response } from 'express';

@Controller('api/v1/consolidado')
export class ConsolidadoController {
  constructor(private readonly consolidadoService: ConsolidadoService) {}

  @Get('mensual')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PSICOLOGO', 'ADMIN')
  async getConsolidadoMensual(
    @Query() query: QueryConsolidadoMensualDto,
    @Request() req
  ): Promise<ConsolidadoMensualDto> {
    // Si es psicólogo, solo puede ver su propio consolidado
    const psicologoId = req.user.role === 'PSICOLOGO' 
      ? req.user.id 
      : query.psicologoId;

    if (!psicologoId) {
      throw new BadRequestException('Psicólogo ID es requerido');
    }

    return this.consolidadoService.getConsolidadoMensual(psicologoId, query.mes);
  }

  @Get('mensual/:psicologoId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getConsolidadoMensualAdmin(
    @Param('psicologoId') psicologoId: string,
    @Query('mes') mes: string
  ): Promise<ConsolidadoMensualDto> {
    // Validar que el mes esté en el formato correcto
    if (!mes || !/^\d{4}-\d{2}$/.test(mes)) {
      throw new BadRequestException('El mes debe tener el formato YYYY-MM (ej: 2024-01)');
    }

    // Validar que el psicologoId sea un UUID válido
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(psicologoId)) {
      throw new BadRequestException('ID de psicólogo inválido');
    }

    return this.consolidadoService.getConsolidadoMensual(psicologoId, mes);
  }

  @Get('mensual-global')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getConsolidadoMensualGlobal(
    @Query() query: QueryConsolidadoMensualGlobalDto,
    @Request() _req,
    @Res() res: Response,
  ) {
    const data = await this.consolidadoService.getConsolidadoMensualGlobal(query.mes);
    const formato = (query.formato || 'json').toLowerCase();
    if (formato === 'csv') {
      const csv = this.consolidadoService.generarCsvConsolidadoGlobal(data);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=consolidado_global_${query.mes}.csv`);
      return res.status(200).send(csv);
    }
    return res.status(200).json(data);
  }

  @Get('admin/usuarios')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getUsuariosParaConsolidado() {
    return this.consolidadoService.getUsuariosParaConsolidado();
  }
}









