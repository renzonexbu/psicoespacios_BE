import { Controller, Get, Post, Body, Param, Put, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PerfilesDerivacionService } from '../services/perfiles-derivacion.service';
import { CreatePerfilDerivacionDto, UpdatePerfilDerivacionDto, SearchPerfilDerivacionDto } from '../dto/perfil-derivacion.dto';

@Controller('api/v1/derivacion/perfiles')
@UseGuards(JwtAuthGuard)
export class PerfilesDerivacionController {
  constructor(private readonly perfilesService: PerfilesDerivacionService) {}

  @Get('mi-perfil')
  async findMiPerfil(@Request() req) {
    return this.perfilesService.findMiPerfil(req.user.id);
  }

  @Post()
  async createOrUpdate(
    @Body() createDto: CreatePerfilDerivacionDto,
    @Request() req,
  ) {
    return this.perfilesService.createOrUpdate(createDto, req.user.id);
  }

  @Get('search')
  async search(@Body() searchDto: SearchPerfilDerivacionDto) {
    return this.perfilesService.search(searchDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.perfilesService.findOne(id);
  }

  @Put(':id/aprobar')
  async aprobar(@Param('id') id: string) {
    return this.perfilesService.aprobar(id);
  }
}