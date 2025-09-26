import { Controller, Get, Query, UseGuards, Request, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ConsolidadoService } from './consolidado.service';
import { QueryConsolidadoMensualDto, ConsolidadoMensualDto } from './dto/consolidado-mensual.dto';

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
      throw new Error('Psicólogo ID es requerido');
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
    return this.consolidadoService.getConsolidadoMensual(psicologoId, mes);
  }
}





