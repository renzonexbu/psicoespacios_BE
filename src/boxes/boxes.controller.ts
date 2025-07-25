import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { BoxesService } from './boxes.service';
import { CreateBoxDto, UpdateBoxDto } from './dto/box.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('api/v1/boxes')
@UseGuards(JwtAuthGuard)
export class BoxesController {
  constructor(private readonly boxesService: BoxesService) {}

  @Get()
  async findAll() {
    return this.boxesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.boxesService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async create(@Body() createBoxDto: CreateBoxDto) {
    return this.boxesService.create(createBoxDto);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBoxDto: UpdateBoxDto,
  ) {
    return this.boxesService.update(id, updateBoxDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.boxesService.remove(id);
    return { message: 'Box eliminado correctamente' };
  }

  @Get('sede/:sedeId')
  async findBySede(@Param('sedeId', ParseUUIDPipe) sedeId: string) {
    return this.boxesService.findBySede(sedeId);
  }
} 