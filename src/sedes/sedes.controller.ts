import { Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards, BadRequestException, ParseUUIDPipe } from '@nestjs/common';
import { SedesService } from './sedes.service';
import { CreateSedeDto, UpdateSedeDto } from './dto/sede.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('api/v1/sedes')
export class SedesController {
  constructor(private readonly sedesService: SedesService) {}

  @Get('public')
  async findAllPublic() {
    return this.sedesService.findAllPublic();
  }

  @Get('public/:id')
  async findOnePublic(@Param('id', ParseUUIDPipe) id: string) {
    return this.sedesService.findOnePublic(id);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll() {
    return this.sedesService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.sedesService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async create(@Body() createSedeDto: CreateSedeDto) {
    return this.sedesService.create(createSedeDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSedeDto: UpdateSedeDto,
  ) {
    return this.sedesService.update(id, updateSedeDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.sedesService.remove(id);
    return { message: 'Sede eliminada correctamente' };
  }

  @Get(':sede_id/boxes')
  @UseGuards(JwtAuthGuard)
  async findBoxesBySede(@Param('sede_id', ParseUUIDPipe) sedeId: string) {
    return this.sedesService.findBoxesBySede(sedeId);
  }

  @Get(':sede_id/disponibilidad')
  @UseGuards(JwtAuthGuard)
  async checkBoxAvailability(
    @Param('sede_id', ParseUUIDPipe) sedeId: string,
    @Query('fecha') fecha: string,
    @Query('hora_inicio') horaInicio: string,
    @Query('hora_fin') horaFin: string,
  ) {
    // Validar que todos los parámetros requeridos estén presentes
    if (!fecha) {
      throw new BadRequestException('El parámetro fecha es obligatorio');
    }
    
    if (!horaInicio) {
      throw new BadRequestException('El parámetro hora_inicio es obligatorio');
    }
    
    if (!horaFin) {
      throw new BadRequestException('El parámetro hora_fin es obligatorio');
    }

    // Validar el formato de la fecha (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      throw new BadRequestException('Formato de fecha inválido. Use YYYY-MM-DD');
    }
    
    // Crear objeto de fecha y validar que sea una fecha válida
    const fechaObj = new Date(fecha);
    if (isNaN(fechaObj.getTime())) {
      throw new BadRequestException('Fecha inválida');
    }
    
    // Validar que la fecha no sea pasada
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    if (fechaObj < hoy) {
      throw new BadRequestException('La fecha debe ser igual o posterior a hoy');
    }
    
    // Validar formato de hora (HH:MM o HH:MM:SS)
    const horaRegex = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/;
    if (!horaRegex.test(horaInicio)) {
      throw new BadRequestException(`Formato de hora inicio inválido: ${horaInicio}. Use formato HH:MM o HH:MM:SS`);
    }
    
    if (!horaRegex.test(horaFin)) {
      throw new BadRequestException(`Formato de hora fin inválido: ${horaFin}. Use formato HH:MM o HH:MM:SS`);
    }
    
    return this.sedesService.checkBoxAvailability(
      sedeId,
      fechaObj,
      horaInicio,
      horaFin,
    );
  }
}