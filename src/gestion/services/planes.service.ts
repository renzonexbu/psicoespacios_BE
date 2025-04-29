import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plan } from '../../common/entities/plan.entity';
import { CreatePlanDto, UpdatePlanDto } from '../dto/plan.dto';

@Injectable()
export class PlanesService {
  constructor(
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
  ) {}

  async findAll() {
    return this.planRepository.find({
      where: { activo: true },
      order: { precio: 'ASC' },
    });
  }

  async findOne(id: string) {
    const plan = await this.planRepository.findOne({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException('Plan no encontrado');
    }

    return plan;
  }

  async create(createPlanDto: CreatePlanDto) {
    const plan = this.planRepository.create(createPlanDto);
    return this.planRepository.save(plan);
  }

  async update(id: string, updatePlanDto: UpdatePlanDto) {
    const plan = await this.findOne(id);
    const updatedPlan = Object.assign(plan, updatePlanDto);
    return this.planRepository.save(updatedPlan);
  }

  async remove(id: string) {
    const plan = await this.findOne(id);
    plan.activo = false;
    return this.planRepository.save(plan);
  }
}