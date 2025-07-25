import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PlanesService } from '../services/planes.service';
import { CreatePlanDto, UpdatePlanDto } from '../dto/plan.dto';

@Controller('api/v1/gestion/planes')
export class PlanesController {
  constructor(private readonly planesService: PlanesService) {}

  @Get('public')
  async findAllPublic() {
    return this.planesService.findAllPublic();
  }

  @Get('public/:id')
  async findOnePublic(@Param('id') id: string) {
    return this.planesService.findOnePublic(id);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll() {
    return this.planesService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string) {
    return this.planesService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createPlanDto: CreatePlanDto) {
    return this.planesService.create(createPlanDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() updatePlanDto: UpdatePlanDto) {
    return this.planesService.update(id, updatePlanDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string) {
    return this.planesService.remove(id);
  }
}