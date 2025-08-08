import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { PsicologosService } from '../gestion/services/psicologos.service';
import { CreatePsicologoDto, UpdatePsicologoDto } from '../common/dto/psicologo.dto';
import { Role } from '../common/enums/role.enum';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AgendaService } from './services/agenda.service';
import { AgendaDisponibilidadDto, PsicologoDisponibilidadDto } from './dto/agenda-disponibilidad.dto';

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
  @Roles(Role.ADMIN, Role.TERAPEUTA)
  findAll() {
    return this.psicologosService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.TERAPEUTA, Role.PACIENTE)
  findOne(@Param('id') id: string) {
    return this.psicologosService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.TERAPEUTA)
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
}
