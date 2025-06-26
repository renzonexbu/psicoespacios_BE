import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
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

  @Patch(':id')
  @Roles('ADMIN', 'PSICOLOGO')
  update(@Param('id') id: string, @Body() updatePsicologoDto: UpdatePsicologoDto) {
    return this.psicologosService.update(id, updatePsicologoDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.psicologosService.remove(id);
  }
}
