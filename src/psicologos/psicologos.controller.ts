import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { PsicologosService } from '../gestion/services/psicologos.service';
import { CreatePsicologoDto, UpdatePsicologoDto } from '../common/dto/psicologo.dto';
import { Role } from '../common/enums/role.enum';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AgendaService } from './services/agenda.service';
import { AgendaDisponibilidadDto, PsicologoDisponibilidadDto, BoxDisponibleDto } from './dto/agenda-disponibilidad.dto';

@Controller('api/v1/psicologos')
export class PsicologosController {
  constructor(
    private readonly psicologosService: PsicologosService,
    private readonly agendaService: AgendaService
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  create(@Body() createPsicologoDto: CreatePsicologoDto) {
    return this.psicologosService.create(createPsicologoDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.PSICOLOGO)
  findAll() {
    return this.psicologosService.findAll();
  }

  // Endpoint público para obtener todos los psicólogos activos (sin datos sensibles)
  @Get('public')
  async findAllPublic() {
    return this.psicologosService.findAllPublic();
  }

  // Endpoint público para obtener un psicólogo específico por ID (sin datos sensibles)
  @Get('public/:id')
  async findOnePublic(@Param('id') id: string) {
    return this.psicologosService.findOnePublic(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.PSICOLOGO)
  update(@Param('id') id: string, @Body() updatePsicologoDto: UpdatePsicologoDto) {
    return this.psicologosService.update(id, updatePsicologoDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.psicologosService.remove(id);
  }

  // Endpoint para agenda completa (con boxes)
  @Get('disponibilidad/agenda')
  async getAgendaDisponibilidad(@Query() query: AgendaDisponibilidadDto) {
    return this.agendaService.getAgendaDisponibilidad(query);
  }

  // Nuevo endpoint para disponibilidad del psicólogo (sin boxes)
  @Get('disponibilidad/psicologo')
  async getPsicologoDisponibilidad(@Query() query: PsicologoDisponibilidadDto) {
    return this.agendaService.getPsicologoDisponibilidad(query);
  }

  // Endpoint para obtener box disponible en un horario específico (presencial)
  @Get('box-disponible')
  async getBoxDisponible(@Query() query: BoxDisponibleDto) {
    return this.agendaService.getBoxDisponible(query);
  }

  // Endpoint para obtener datos de un box específico
  @Get('box/:id')
  async getBoxById(@Param('id') id: string) {
    return this.agendaService.getBoxById(id);
  }

  // Endpoint para obtener un psicólogo específico por ID (debe estar al final)
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.PSICOLOGO, Role.PACIENTE)
  findOne(@Param('id') id: string) {
    return this.psicologosService.findOne(id);
  }
}
