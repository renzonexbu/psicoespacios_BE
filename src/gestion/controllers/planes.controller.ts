import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PlanesService } from '../services/planes.service';
import { CreatePlanDto, UpdatePlanDto } from '../dto/plan.dto';

@Controller('api/v1/gestion/planes')
@UseGuards(JwtAuthGuard)
export class PlanesController {
  constructor(private readonly planesService: PlanesService) {}

  @Get()
  async findAll() {
    return this.planesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.planesService.findOne(id);
  }

  @Post()
  async create(@Body() createPlanDto: CreatePlanDto) {
    return this.planesService.create(createPlanDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updatePlanDto: UpdatePlanDto) {
    return this.planesService.update(id, updatePlanDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.planesService.remove(id);
  }
}