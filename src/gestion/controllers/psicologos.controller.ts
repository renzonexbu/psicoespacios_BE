import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Request, ForbiddenException } from '@nestjs/common';
import { PsicologosService } from '../services/psicologos.service';
import { CreatePsicologoDto, UpdatePsicologoDto } from '../../common/dto/psicologo.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

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
  @Roles(Role.ADMIN)
  create(@Body() createPsicologoDto: CreatePsicologoDto) {
    return this.psicologosService.create(createPsicologoDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.TERAPEUTA, Role.PSICOLOGO)
  findAll() {
    return this.psicologosService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.TERAPEUTA, Role.PACIENTE)
  findOne(@Param('id') id: string) {
    return this.psicologosService.findOne(id);
  }

  @Get('usuario/:usuarioId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.TERAPEUTA, Role.PSICOLOGO)
  async findByUserId(@Param('usuarioId') usuarioId: string, @Request() req) {
    // Verificar que el psicólogo solo puede ver su propio perfil
    if (req.user.role === Role.PSICOLOGO && req.user.id !== usuarioId) {
      throw new ForbiddenException('Solo puedes ver tu propio perfil');
    }
    return this.psicologosService.findByUserId(usuarioId);
  }

  @Get('usuario/:usuarioId/descripcion')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.TERAPEUTA, Role.PSICOLOGO)
  async getDescripcionByUserId(@Param('usuarioId') usuarioId: string, @Request() req) {
    // Verificar que el psicólogo solo puede ver su propia descripción
    if (req.user.role === Role.PSICOLOGO && req.user.id !== usuarioId) {
      throw new ForbiddenException('Solo puedes ver tu propia descripción');
    }
    const psicologo = await this.psicologosService.findByUserId(usuarioId);
    return { descripcion: psicologo.descripcion };
  }

  @Get(':id/disponibilidad/dias')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.TERAPEUTA, Role.PSICOLOGO)
  async disponibilidadDias(
    @Param('id') id: string,
    @Query('mes') mes: number,
    @Query('anio') anio: number,
    @Request() req
  ) {
    // Verificar que el psicólogo solo puede ver su propia disponibilidad
    if (req.user.role === Role.PSICOLOGO && req.user.id !== id) {
      throw new ForbiddenException('Solo puedes ver tu propia disponibilidad');
    }
    return this.psicologosService.disponibilidadDias(id, mes, anio);
  }

  @Get(':id/disponibilidad/horarios')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.TERAPEUTA, Role.PSICOLOGO)
  async disponibilidadHorarios(
    @Param('id') id: string,
    @Query('fecha') fecha: string,
    @Request() req
  ) {
    // Verificar que el psicólogo solo puede ver su propia disponibilidad
    if (req.user.role === Role.PSICOLOGO && req.user.id !== id) {
      throw new ForbiddenException('Solo puedes ver tu propia disponibilidad');
    }
    return this.psicologosService.disponibilidadHorarios(id, fecha);
  }

  @Get(':psicologoId/pacientes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.TERAPEUTA, Role.PSICOLOGO)
  async getPacientesAsignados(
    @Param('psicologoId') psicologoId: string,
    @Request() req
  ) {
    // Debug: mostrar información del usuario y parámetros
    console.log('[DEBUG] Usuario del token:', {
      id: req.user.id,
      role: req.user.role,
      psicologoId: req.user.psicologoId
    });
    console.log('[DEBUG] Parámetro psicologoId:', psicologoId);
    
    // Verificar que el psicólogo solo puede ver sus propios pacientes
    if (req.user.role === Role.PSICOLOGO && req.user.psicologoId !== psicologoId) {
      console.log('[DEBUG] Acceso denegado - psicologoId del token:', req.user.psicologoId, 'vs parámetro:', psicologoId);
      throw new ForbiddenException('Solo puedes ver tus propios pacientes');
    }
    
    console.log('[DEBUG] Acceso permitido');
    return this.psicologosService.getPacientesAsignados(psicologoId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.TERAPEUTA)
  update(@Param('id') id: string, @Body() updatePsicologoDto: UpdatePsicologoDto) {
    console.log('[PsicologosController] PATCH recibido - id:', id, 'body:', updatePsicologoDto);
    return this.psicologosService.update(id, updatePsicologoDto);
  }

  @Patch('usuario/:usuarioId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.TERAPEUTA, Role.PSICOLOGO)
  async updateByUserId(
    @Param('usuarioId') usuarioId: string, 
    @Body() updatePsicologoDto: UpdatePsicologoDto,
    @Request() req
  ) {
    // Verificar que el psicólogo solo puede actualizar su propio perfil
    if (req.user.role === Role.PSICOLOGO && req.user.id !== usuarioId) {
      throw new ForbiddenException('Solo puedes actualizar tu propio perfil');
    }
    const psicologo = await this.psicologosService.findByUserId(usuarioId);
    return this.psicologosService.update(psicologo.id, updatePsicologoDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.psicologosService.remove(id);
  }
}
