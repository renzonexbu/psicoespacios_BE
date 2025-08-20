import { Controller, Post, Body, UseGuards, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { PagoSesionService, ConfirmarSesionDto, CrearOrdenFlowDto } from '../services/pago-sesion.service';

@Controller('api/v1/pagos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PagoSesionController {
  constructor(private readonly pagoSesionService: PagoSesionService) {}

  /**
   * Crear orden en Flow y reserva temporal
   */
  @Post('crear-orden-flow')
  @Roles(Role.PACIENTE, Role.ADMIN)
  async crearOrdenFlow(@Body() crearOrdenFlowDto: CrearOrdenFlowDto) {
    return this.pagoSesionService.crearOrdenFlow(crearOrdenFlowDto);
  }

  /**
   * Confirmar pago desde webhook de Flow y activar reserva
   */
  @Post('confirmar-flow/:flowOrderId')
  @Roles(Role.ADMIN) // Solo admin puede confirmar pagos
  async confirmarPagoFlow(
    @Param('flowOrderId') flowOrderId: string,
    @Body() datosPago: any
  ) {
    return this.pagoSesionService.confirmarPagoFlow(flowOrderId, datosPago);
  }

  /**
   * Confirmar pago y crear reserva de sesión en una sola transacción
   */
  @Post('confirmar-sesion')
  @Roles(Role.PACIENTE, Role.ADMIN)
  async confirmarSesion(@Body() confirmarSesionDto: ConfirmarSesionDto) {
    return this.pagoSesionService.confirmarSesion(confirmarSesionDto);
  }
}
