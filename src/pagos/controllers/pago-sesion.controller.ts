import { Controller, Post, Get, Body, UseGuards, Param, Query, BadRequestException, Request, ForbiddenException } from '@nestjs/common';
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
   * ENDPOINT PRINCIPAL - Todos los pagos pasan por Flow
   * 
   * Este es el endpoint que debe usar el frontend para crear cualquier reserva.
   * Siempre crea una orden en Flow y devuelve la URL para que el usuario complete el pago.
   */
  @Post('crear-orden-flow')
  @Roles(Role.PACIENTE, Role.ADMIN)
  async crearOrdenFlow(@Body() crearOrdenFlowDto: CrearOrdenFlowDto) {
    return this.pagoSesionService.crearOrdenFlow(crearOrdenFlowDto);
  }

  /**
   * @deprecated Usar 'crear-orden-flow' en su lugar
   * Este endpoint ahora también redirige a Flow en lugar de procesar pagos directos
   * 
   * Mantenido por compatibilidad, pero internamente usa Flow
   */
  @Post('crear-orden')
  @Roles(Role.PACIENTE, Role.ADMIN)
  async crearOrden(@Body() crearOrdenFlowDto: CrearOrdenFlowDto) {
    // Redirigir al método que usa Flow
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
   * @deprecated Usar 'crear-orden-flow' en su lugar
   * 
   * Este endpoint está deprecado. Todos los pagos ahora deben pasar por Flow.
   * 
   * Si necesitas procesar un pago directo (transferencia, efectivo) sin Flow,
   * contacta al equipo de desarrollo para habilitar esta funcionalidad.
   * 
   * Por defecto, este endpoint ahora redirige a crear una orden en Flow.
   */
  @Post('confirmar-sesion')
  @Roles(Role.PACIENTE, Role.ADMIN)
  async confirmarSesion(@Body() confirmarSesionDto: ConfirmarSesionDto) {
    // Convertir ConfirmarSesionDto a CrearOrdenFlowDto y usar Flow
    const crearOrdenDto: CrearOrdenFlowDto = {
      psicologoId: confirmarSesionDto.psicologoId,
      pacienteId: confirmarSesionDto.pacienteId,
      fecha: confirmarSesionDto.fecha,
      horaInicio: confirmarSesionDto.horaInicio,
      horaFin: confirmarSesionDto.horaFin,
      boxId: confirmarSesionDto.boxId,
      modalidad: confirmarSesionDto.modalidad,
      fonasa: confirmarSesionDto.fonasa,
      cuponId: confirmarSesionDto.cuponId,
      precio: confirmarSesionDto.precio,
      observaciones: confirmarSesionDto.observaciones,
    };
    
    // Usar Flow en lugar de procesar directamente
    return this.pagoSesionService.crearOrdenFlow(crearOrdenDto);
  }

  /**
   * Verificar estado de una reserva temporal después del pago en Flow
   * Útil cuando el usuario regresa de Flow y queremos verificar si ya se confirmó
   * 
   * Valida que el usuario autenticado sea el paciente que creó la reserva
   * 
   * Puede recibir:
   * - reservaTemporalId como parámetro de ruta
   * - flowOrder como query parameter (alternativa)
   */
  @Get('verificar-reserva/:reservaTemporalId')
  @Roles(Role.PACIENTE, Role.ADMIN)
  async verificarReserva(
    @Param('reservaTemporalId') reservaTemporalId: string,
    @Request() req: any
  ) {
    return this.pagoSesionService.verificarEstadoReserva(reservaTemporalId, req.user?.id, req.user?.role);
  }

  /**
   * Verificar estado de una reserva temporal por flowOrder
   * Alternativa al endpoint anterior cuando solo se tiene el flowOrder
   * 
   * Valida que el usuario autenticado sea el paciente que creó la reserva
   */
  @Get('verificar-reserva-flow/:flowOrder')
  @Roles(Role.PACIENTE, Role.ADMIN)
  async verificarReservaPorFlowOrder(
    @Param('flowOrder') flowOrder: string,
    @Request() req: any
  ) {
    return this.pagoSesionService.verificarEstadoReservaPorFlowOrder(flowOrder, req.user?.id, req.user?.role);
  }
}
