import { Controller, Get, Post, Body, Param, Put, Patch, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { ReservasPsicologosService } from './reservas-psicologos.service';
import { CreateReservaPsicologoDto, UpdateReservaPsicologoDto, QueryReservasPsicologoDto, ActualizarPagoDto } from './dto/reserva-psicologo.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { EstadoReservaPsicologo, ModalidadSesion } from '../common/entities/reserva-psicologo.entity';

@Controller('api/v1/reservas-sesiones')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReservasPsicologosController {
  constructor(private readonly reservasPsicologosService: ReservasPsicologosService) {}

  /**
   * Crear una nueva reserva de sesión con psicólogo
   */
  @Post()
  @Roles(Role.PSICOLOGO, Role.ADMIN, Role.PACIENTE)
  async create(@Body() createReservaDto: CreateReservaPsicologoDto) {
    return this.reservasPsicologosService.create(createReservaDto);
  }

  /**
   * Obtener todas las reservas con filtros
   */
  @Get()
  @Roles(Role.PSICOLOGO, Role.ADMIN)
  async findAll(@Query() query: QueryReservasPsicologoDto) {
    return this.reservasPsicologosService.findAll(query);
  }

  /**
   * Obtener una reserva específica
   */
  @Get(':id')
  @Roles(Role.PSICOLOGO, Role.ADMIN, Role.PACIENTE)
  async findOne(@Param('id') id: string) {
    return this.reservasPsicologosService.findOne(id);
  }

  /**
   * Obtener reservas de un psicólogo específico
   */
  @Get('psicologo/:psicologoId')
  @Roles(Role.PSICOLOGO, Role.ADMIN)
  async findByPsicologo(@Param('psicologoId') psicologoId: string) {
    return this.reservasPsicologosService.findByPsicologo(psicologoId);
  }

  /**
   * Obtener reservas de un paciente específico por su ID de paciente
   */
  @Get('paciente/:pacienteId')
  @Roles(Role.PSICOLOGO, Role.ADMIN, Role.PACIENTE)
  async findByPaciente(@Param('pacienteId') pacienteId: string) {
    return this.reservasPsicologosService.findByPaciente(pacienteId);
  }

  /**
   * Obtener reservas de un paciente por su usuarioId
   */
  @Get('usuario-paciente/:usuarioId')
  @Roles(Role.PSICOLOGO, Role.ADMIN, Role.PACIENTE)
  async findByUsuarioPaciente(@Param('usuarioId') usuarioId: string) {
    return this.reservasPsicologosService.findByUsuarioPaciente(usuarioId);
  }

  /**
   * Obtener reservas de un psicólogo por su usuarioId (Dashboard)
   */
  @Get('usuario/:usuarioId/sesiones')
  @Roles(Role.PSICOLOGO, Role.ADMIN)
  async findByUsuarioPsicologo(@Param('usuarioId') usuarioId: string) {
    return this.reservasPsicologosService.findByUsuarioPsicologo(usuarioId);
  }

  /**
   * Actualizar una reserva
   */
  @Put(':id')
  @Roles(Role.PSICOLOGO, Role.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateReservaDto: UpdateReservaPsicologoDto
  ) {
    return this.reservasPsicologosService.update(id, updateReservaDto);
  }

  /**
   * Cancelar una reserva
   */
  @Post(':id/cancel')
  @Roles(Role.PSICOLOGO, Role.ADMIN, Role.PACIENTE)
  async cancel(@Param('id') id: string) {
    return this.reservasPsicologosService.cancel(id);
  }

  /**
   * Actualizar pagoId en una reserva (cuando se confirma el pago)
   */
  @Patch(':id/pago')
  @Roles(Role.ADMIN, Role.PSICOLOGO)
  async actualizarPagoId(
    @Param('id') id: string,
    @Body() actualizarPagoDto: ActualizarPagoDto
  ) {
    return this.reservasPsicologosService.actualizarPagoId(id, actualizarPagoDto.pagoId);
  }

  /**
   * Eliminar una reserva
   */
  @Delete(':id')
  @Roles(Role.PSICOLOGO, Role.ADMIN)
  async remove(@Param('id') id: string) {
    await this.reservasPsicologosService.remove(id);
    return { message: 'Reserva eliminada correctamente' };
  }

  /**
   * Obtener estados de reserva disponibles
   */
  @Get('estados/disponibles')
  getEstadosReserva() {
    return Object.values(EstadoReservaPsicologo);
  }

  /**
   * Obtener modalidades de sesión disponibles
   */
  @Get('modalidades/disponibles')
  getModalidadesSesion() {
    return Object.values(ModalidadSesion);
  }
} 