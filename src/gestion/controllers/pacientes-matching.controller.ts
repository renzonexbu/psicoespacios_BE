import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { PacientesMatchingService } from '../services/pacientes-matching.service';
import { CreatePacienteMatchingDto, UpdatePacienteMatchingDto } from '../../common/dto/paciente.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('pacientes-matching')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PacientesMatchingController {
  constructor(private readonly pacientesMatchingService: PacientesMatchingService) {}

  @Post()
  @Roles('ADMIN', 'PACIENTE')
  create(@Body() createPacienteDto: CreatePacienteMatchingDto) {
    return this.pacientesMatchingService.create(createPacienteDto);
  }

  @Get()
  @Roles('ADMIN', 'PSICOLOGO')
  findAll() {
    return this.pacientesMatchingService.findAll();
  }

  @Get(':id')
  @Roles('ADMIN', 'PSICOLOGO', 'PACIENTE')
  findOne(@Param('id') id: string) {
    return this.pacientesMatchingService.findOne(id);
  }

  @Get('usuario/:usuarioId')
  @Roles('ADMIN', 'PSICOLOGO', 'PACIENTE')
  findByUserId(@Param('usuarioId') usuarioId: string) {
    return this.pacientesMatchingService.findByUserId(usuarioId);
  }

  @Get(':id/matches')
  @Roles('ADMIN', 'PSICOLOGO', 'PACIENTE')
  findMatches(@Param('id') id: string) {
    return this.pacientesMatchingService.findMatches(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'PACIENTE')
  update(@Param('id') id: string, @Body() updatePacienteDto: UpdatePacienteMatchingDto) {
    return this.pacientesMatchingService.update(id, updatePacienteDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.pacientesMatchingService.remove(id);
  }
}
