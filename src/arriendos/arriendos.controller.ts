import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Delete, 
  Put, 
  Query, 
  UseGuards,
  Request,
  BadRequestException
} from '@nestjs/common';
import { ArriendosService } from './arriendos.service';
import { CreateArriendoBoxDto, UpdateArriendoBoxDto } from './dto/arriendo-box.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('arriendos')
@UseGuards(JwtAuthGuard)
export class ArriendosController {
  constructor(private readonly arriendosService: ArriendosService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'PSICOLOGO')
  async create(@Body() createArriendoDto: CreateArriendoBoxDto) {
    return this.arriendosService.create(createArriendoDto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async findAll() {
    return this.arriendosService.findAll();
  }

  @Get('activos')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'PSICOLOGO')
  async findActivos() {
    return this.arriendosService.findActivos();
  }

  @Get('por-vencer')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async findPorVencer(@Query('dias') dias?: string) {
    const diasNum = dias ? parseInt(dias) : 30;
    return this.arriendosService.findPorVencer(diasNum);
  }

  @Get('psicologo/:psicologoId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'PSICOLOGO')
  async findByPsicologo(@Param('psicologoId') psicologoId: string) {
    return this.arriendosService.findByPsicologo(psicologoId);
  }

  @Get('box/:boxId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async findByBox(@Param('boxId') boxId: string) {
    return this.arriendosService.findByBox(boxId);
  }

  @Get('disponibilidad/:boxId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'PSICOLOGO')
  async verificarDisponibilidad(
    @Param('boxId') boxId: string,
    @Query('fecha') fecha: string,
    @Body() horarios: any[]
  ) {
    if (!fecha) {
      throw new BadRequestException('La fecha es requerida');
    }
    return this.arriendosService.verificarDisponibilidad(boxId, new Date(fecha), horarios);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'PSICOLOGO')
  async findOne(@Param('id') id: string) {
    return this.arriendosService.findOne(id);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'PSICOLOGO')
  async update(
    @Param('id') id: string, 
    @Body() updateArriendoDto: UpdateArriendoBoxDto
  ) {
    return this.arriendosService.update(id, updateArriendoDto);
  }

  @Post(':id/cancelar')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'PSICOLOGO')
  async cancelar(
    @Param('id') id: string,
    @Body() body: { motivo: string }
  ) {
    if (!body.motivo) {
      throw new BadRequestException('El motivo de cancelación es requerido');
    }
    return this.arriendosService.cancelar(id, body.motivo);
  }

  @Post(':id/renovar')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'PSICOLOGO')
  async renovar(@Param('id') id: string) {
    return this.arriendosService.renovar(id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async remove(@Param('id') id: string) {
    return this.arriendosService.remove(id);
  }
} 