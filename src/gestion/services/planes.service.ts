import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plan } from '../../common/entities/plan.entity';
import { CreatePlanDto, UpdatePlanDto, PlanPublicDto } from '../dto/plan.dto';
import { FlowSubscriptionsService } from '../../pagos/services/flow-subscriptions.service';

@Injectable()
export class PlanesService {
  constructor(
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
    private readonly flowSubscriptionsService: FlowSubscriptionsService,
  ) {}

  async findAllPublic(): Promise<PlanPublicDto[]> {
    const planes = await this.planRepository.find({
      where: { activo: true },
      order: { precio: 'ASC' },
    });

    return planes.map((plan) => ({
      id: plan.id,
      tipo: plan.tipo,
      nombre: plan.nombre,
      descripcion: plan.descripcion,
      precio: plan.precio,
      duracion: plan.duracion,
      horasIncluidas: plan.horasIncluidas,
      beneficios: plan.beneficios,
      activo: plan.activo,
      proximamente: (plan as any).proximamente,
    }));
  }

  async findOnePublic(id: string): Promise<PlanPublicDto> {
    const plan = await this.planRepository.findOne({
      where: { id, activo: true },
    });

    if (!plan) {
      throw new NotFoundException('Plan no encontrado');
    }

    return {
      id: plan.id,
      tipo: plan.tipo,
      nombre: plan.nombre,
      descripcion: plan.descripcion,
      precio: plan.precio,
      duracion: plan.duracion,
      horasIncluidas: plan.horasIncluidas,
      beneficios: plan.beneficios,
      activo: plan.activo,
      proximamente: (plan as any).proximamente,
    };
  }

  async findAll() {
    return this.planRepository.find({
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
    const saved = await this.planRepository.save(plan);
    // Best-effort: crear/sincronizar plan en Flow si es necesario
    try {
      await this.flowSubscriptionsService.syncFlowPlanFromLocal(saved.id);
    } catch {
      // No bloquear la creación del plan si Flow falla
    }
    return saved;
  }

  async update(id: string, updatePlanDto: UpdatePlanDto) {
    const plan = await this.findOne(id);
    const updatedPlan = Object.assign(plan, updatePlanDto);
    const saved = await this.planRepository.save(updatedPlan);
    try {
      await this.flowSubscriptionsService.syncFlowPlanFromLocal(saved.id);
    } catch {
      // no bloquear
    }
    return saved;
  }

  async remove(id: string) {
    const plan = await this.findOne(id);
    plan.activo = false;
    return this.planRepository.save(plan);
  }
}
