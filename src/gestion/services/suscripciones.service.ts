import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Suscripcion } from '../../common/entities/suscripcion.entity';
import { User } from '../../common/entities/user.entity';
import { Plan } from '../../common/entities/plan.entity';
import { CreateSuscripcionDto, UpdateSuscripcionDto } from '../dto/suscripcion.dto';

@Injectable()
export class SuscripcionesService {
  constructor(
    @InjectRepository(Suscripcion)
    private suscripcionRepository: Repository<Suscripcion>,
    @InjectRepository(Plan)
    private planRepository: Repository<Plan>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createSuscripcionDto: CreateSuscripcionDto, userId: string) {
    const plan = await this.planRepository.findOne({
      where: { id: createSuscripcionDto.planId },
    });

    if (!plan) {
      throw new NotFoundException('Plan no encontrado');
    }

    const psicologo = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!psicologo) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Verificar si ya tiene una suscripción activa
    const suscripcionActiva = await this.suscripcionRepository.findOne({
      where: { psicologo: { id: userId }, estado: 'ACTIVA' },
    });

    if (suscripcionActiva) {
      throw new BadRequestException('Ya tiene una suscripción activa');
    }

    const fechaInicio = new Date();
    const fechaFin = new Date();
    fechaFin.setMonth(fechaFin.getMonth() + plan.duracionMeses);

    const suscripcion = this.suscripcionRepository.create({
      ...createSuscripcionDto,
      psicologo,
      plan,
      fechaInicio,
      fechaFin,
      estado: 'PENDIENTE_PAGO',
    });

    return this.suscripcionRepository.save(suscripcion);
  }

  async findMiSuscripcion(userId: string) {
    const suscripcion = await this.suscripcionRepository.findOne({
      where: { psicologo: { id: userId } },
      relations: ['plan'],
      order: { createdAt: 'DESC' },
    });

    if (!suscripcion) {
      throw new NotFoundException('No se encontró suscripción activa');
    }

    return suscripcion;
  }

  async update(id: string, updateSuscripcionDto: UpdateSuscripcionDto) {
    const suscripcion = await this.suscripcionRepository.findOne({
      where: { id },
    });

    if (!suscripcion) {
      throw new NotFoundException('Suscripción no encontrada');
    }

    if (updateSuscripcionDto.notasCancelacion !== undefined) {
      suscripcion.notasCancelacion = updateSuscripcionDto.notasCancelacion || '';
    }

    if (updateSuscripcionDto.estado !== undefined) {
      suscripcion.estado = updateSuscripcionDto.estado;
    }

    return this.suscripcionRepository.save(suscripcion);
  }

  async findOne(id: string) {
    const suscripcion = await this.suscripcionRepository.findOne({
      where: { id },
      relations: ['psicologo', 'plan'],
    });

    if (!suscripcion) {
      throw new NotFoundException('Suscripción no encontrada');
    }

    return suscripcion;
  }

  async cancel(id: string, updateDto: any, userId: string): Promise<Suscripcion> {
    const suscripcion = await this.findOne(id);

    if (suscripcion.psicologo.id !== userId) {
      throw new ForbiddenException('No tienes permiso para cancelar esta suscripción');
    }

    suscripcion.estado = 'CANCELADA';
    suscripcion.updatedAt = new Date();
    return this.suscripcionRepository.save(suscripcion);
  }

  async renovar(id: string, userId: string): Promise<Suscripcion> {
    const suscripcion = await this.findOne(id);

    if (suscripcion.psicologo.id !== userId) {
      throw new ForbiddenException('No tienes permiso para renovar esta suscripción');
    }

    if (!['ACTIVA', 'VENCIDA'].includes(suscripcion.estado)) {
      throw new BadRequestException('Solo se pueden renovar suscripciones activas o vencidas');
    }

    // Verificar que no haya otra suscripción activa
    const suscripcionActiva = await this.suscripcionRepository.findOne({
      where: {
        psicologo: { id: userId },
        estado: 'ACTIVA',
        id: Not(id),
      },
    });

    if (suscripcionActiva) {
      throw new BadRequestException('Ya tienes una suscripción activa');
    }

    const nuevaFechaFin = new Date(suscripcion.fechaFin);
    nuevaFechaFin.setMonth(nuevaFechaFin.getMonth() + suscripcion.plan.duracionMeses);

    suscripcion.fechaFin = nuevaFechaFin;
    suscripcion.estado = 'ACTIVA';
    suscripcion.updatedAt = new Date();

    return this.suscripcionRepository.save(suscripcion);
  }
}