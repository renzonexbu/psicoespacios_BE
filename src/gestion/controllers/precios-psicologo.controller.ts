import { Controller, Get, Patch, Param, Body, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { PsicologosService } from '../services/psicologos.service';
import { UpdatePreciosDto } from '../../psicologos/dto/precios.dto';

@Controller('api/v1/precios-psicologo')
export class PreciosPsicologoController {
  constructor(private readonly psicologosService: PsicologosService) {}

  @Get('usuario/:usuarioId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.TERAPEUTA, Role.PSICOLOGO)
  async getPreciosByUserId(
    @Param('usuarioId') usuarioId: string,
    @Request() req
  ) {
    // Verificar que el psicólogo solo puede ver sus propios precios
    if (req.user.role === Role.PSICOLOGO && req.user.id !== usuarioId) {
      throw new ForbiddenException('Solo puedes ver tus propios precios');
    }
    return this.psicologosService.getPrecios(usuarioId);
  }

  @Patch('usuario/:usuarioId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.TERAPEUTA, Role.PSICOLOGO)
  async updatePreciosByUserId(
    @Param('usuarioId') usuarioId: string,
    @Body() updatePreciosDto: UpdatePreciosDto,
    @Request() req
  ) {
    // Verificar que el psicólogo solo puede actualizar sus propios precios
    if (req.user.role === Role.PSICOLOGO && req.user.id !== usuarioId) {
      throw new ForbiddenException('Solo puedes actualizar tus propios precios');
    }
    return this.psicologosService.updatePrecios(usuarioId, updatePreciosDto);
  }
}
