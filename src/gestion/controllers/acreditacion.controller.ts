import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { AcreditacionService } from '../services/acreditacion.service';
import { CreateAcreditacionDto, UpdateAcreditacionDto } from '../dto/acreditacion.dto';

@Controller('api/v1/gestion/acreditaciones')
export class AcreditacionController {
  constructor(private readonly acreditacionService: AcreditacionService) {}

  @Post()
  async create(@Body() dto: CreateAcreditacionDto) {
    return this.acreditacionService.create(dto);
  }

  @Get()
  async findAll() {
    return this.acreditacionService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.acreditacionService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateAcreditacionDto) {
    return this.acreditacionService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.acreditacionService.remove(id);
  }

  @Get('psicologo/:idPsicologo')
  async findByPsicologo(@Param('idPsicologo') idPsicologo: string) {
    return this.acreditacionService.findByPsicologo(idPsicologo);
  }
} 