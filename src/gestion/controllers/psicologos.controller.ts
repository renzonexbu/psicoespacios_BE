import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { PsicologosService } from '../services/psicologos.service';
import { CreatePsicologoDto, UpdatePsicologoDto } from '../../common/dto/psicologo.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('psicologos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PsicologosController {
  constructor(private readonly psicologosService: PsicologosService) {}

  @Post()
  @Roles('ADMIN')
  create(@Body() createPsicologoDto: CreatePsicologoDto) {
    return this.psicologosService.create(createPsicologoDto);
  }

  @Get()
  @Roles('ADMIN', 'PSICOLOGO')
  findAll() {
    return this.psicologosService.findAll();
  }

  @Get(':id')
  @Roles('ADMIN', 'PSICOLOGO')
  findOne(@Param('id') id: string) {
    return this.psicologosService.findOne(id);
  }

  @Get('usuario/:usuarioId')
  @Roles('ADMIN', 'PSICOLOGO')
  findByUserId(@Param('usuarioId') usuarioId: string) {
    return this.psicologosService.findByUserId(usuarioId);
  }

  @Get('usuario/:usuarioId/descripcion')
  @Roles('ADMIN', 'PSICOLOGO')
  async getDescripcionByUserId(@Param('usuarioId') usuarioId: string) {
    const psicologo = await this.psicologosService.findByUserId(usuarioId);
    return { descripcion: psicologo.descripcion };
  }

  @Get(':id/disponibilidad/dias')
  @Roles('ADMIN', 'PSICOLOGO')
  async disponibilidadDias(
    @Param('id') id: string,
    @Query('mes') mes: number,
    @Query('anio') anio: number
  ) {
    return this.psicologosService.disponibilidadDias(id, mes, anio);
  }

  @Get(':id/disponibilidad/horarios')
  @Roles('ADMIN', 'PSICOLOGO')
  async disponibilidadHorarios(
    @Param('id') id: string,
    @Query('fecha') fecha: string
  ) {
    return this.psicologosService.disponibilidadHorarios(id, fecha);
  }

  @Get(':usuarioId/pacientes')
  @Roles('ADMIN', 'PSICOLOGO')
  async getPacientesAsignados(@Param('usuarioId') usuarioId: string) {
    return this.psicologosService.getPacientesAsignados(usuarioId);
  }

  @Patch(':id')
  @Roles('ADMIN', 'PSICOLOGO')
  update(@Param('id') id: string, @Body() updatePsicologoDto: UpdatePsicologoDto) {
    console.log('[PsicologosController] PATCH recibido - id:', id, 'body:', updatePsicologoDto);
    return this.psicologosService.update(id, updatePsicologoDto);
  }

  @Patch('usuario/:usuarioId')
  @Roles('ADMIN', 'PSICOLOGO')
  async updateByUserId(@Param('usuarioId') usuarioId: string, @Body() updatePsicologoDto: UpdatePsicologoDto) {
    const psicologo = await this.psicologosService.findByUserId(usuarioId);
    return this.psicologosService.update(psicologo.id, updatePsicologoDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.psicologosService.remove(id);
  }
}
