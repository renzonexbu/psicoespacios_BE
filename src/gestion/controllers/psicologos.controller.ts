import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { PsicologosService } from '../services/psicologos.service';
import { CreatePsicologoDto, UpdatePsicologoDto } from '../../common/dto/psicologo.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('psicologos')
export class PsicologosController {
  constructor(private readonly psicologosService: PsicologosService) {}

  @Get('public')
  async findAllPublic() {
    return this.psicologosService.findAllPublic();
  }

  @Get('public/:id')
  async findOnePublic(@Param('id') id: string) {
    return this.psicologosService.findOnePublic(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  create(@Body() createPsicologoDto: CreatePsicologoDto) {
    return this.psicologosService.create(createPsicologoDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PSICOLOGO')
  findAll() {
    return this.psicologosService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PSICOLOGO')
  findOne(@Param('id') id: string) {
    return this.psicologosService.findOne(id);
  }

  @Get('usuario/:usuarioId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PSICOLOGO')
  findByUserId(@Param('usuarioId') usuarioId: string) {
    return this.psicologosService.findByUserId(usuarioId);
  }

  @Get('usuario/:usuarioId/descripcion')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PSICOLOGO')
  async getDescripcionByUserId(@Param('usuarioId') usuarioId: string) {
    const psicologo = await this.psicologosService.findByUserId(usuarioId);
    return { descripcion: psicologo.descripcion };
  }

  @Get(':id/disponibilidad/dias')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PSICOLOGO')
  async disponibilidadDias(
    @Param('id') id: string,
    @Query('mes') mes: number,
    @Query('anio') anio: number
  ) {
    return this.psicologosService.disponibilidadDias(id, mes, anio);
  }

  @Get(':id/disponibilidad/horarios')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PSICOLOGO')
  async disponibilidadHorarios(
    @Param('id') id: string,
    @Query('fecha') fecha: string
  ) {
    return this.psicologosService.disponibilidadHorarios(id, fecha);
  }

  @Get(':usuarioId/pacientes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PSICOLOGO')
  async getPacientesAsignados(@Param('usuarioId') usuarioId: string) {
    return this.psicologosService.getPacientesAsignados(usuarioId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PSICOLOGO')
  update(@Param('id') id: string, @Body() updatePsicologoDto: UpdatePsicologoDto) {
    console.log('[PsicologosController] PATCH recibido - id:', id, 'body:', updatePsicologoDto);
    return this.psicologosService.update(id, updatePsicologoDto);
  }

  @Patch('usuario/:usuarioId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PSICOLOGO')
  async updateByUserId(@Param('usuarioId') usuarioId: string, @Body() updatePsicologoDto: UpdatePsicologoDto) {
    const psicologo = await this.psicologosService.findByUserId(usuarioId);
    return this.psicologosService.update(psicologo.id, updatePsicologoDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.psicologosService.remove(id);
  }
}
