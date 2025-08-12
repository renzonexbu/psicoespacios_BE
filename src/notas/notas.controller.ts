import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { NotasService } from './notas.service';
import { CreateNotaDto, UpdateNotaDto, QueryNotasDto } from './dto/nota.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { TipoNota } from '../common/entities/nota.entity';

@Controller('api/v1/notas')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.TERAPEUTA, Role.ADMIN, Role.PSICOLOGO)
export class NotasController {
  constructor(private readonly notasService: NotasService) {}

  /**
   * Crear una nueva nota
   */
  @Post()
  async create(@Body() createNotaDto: CreateNotaDto, @Request() req) {
    return this.notasService.create(createNotaDto, req.user.id);
  }

  /**
   * Obtener todas las notas del psicólogo
   */
  @Get()
  async findAll(@Query() query: QueryNotasDto, @Request() req) {
    return this.notasService.findAll(req.user.id, query);
  }

  /**
   * Obtener una nota específica
   */
  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    return this.notasService.findOne(id, req.user.id);
  }

  /**
   * Obtener notas de un paciente específico
   */
  @Get('paciente/:pacienteId')
  async findByPaciente(@Param('pacienteId') pacienteId: string, @Request() req) {
    return this.notasService.findByPaciente(pacienteId, req.user.id);
  }

  /**
   * Actualizar una nota
   */
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateNotaDto: UpdateNotaDto,
    @Request() req
  ) {
    return this.notasService.update(id, updateNotaDto, req.user.id);
  }

  /**
   * Eliminar una nota
   */
  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    await this.notasService.remove(id, req.user.id);
    return { message: 'Nota eliminada correctamente' };
  }

  /**
   * Obtener estadísticas de notas
   */
  @Get('stats/overview')
  async getStats(@Request() req) {
    return this.notasService.getStats(req.user.id);
  }

  /**
   * Obtener tipos de notas disponibles
   */
  @Get('tipos/disponibles')
  getTiposNota() {
    return Object.values(TipoNota);
  }
} 