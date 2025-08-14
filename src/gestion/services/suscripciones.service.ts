import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, LessThanOrEqual } from 'typeorm';
import { Suscripcion, EstadoSuscripcion } from '../../common/entities/suscripcion.entity';
import { User } from '../../common/entities/user.entity';
import { Plan } from '../../common/entities/plan.entity';
import { CreateSuscripcionDto, UpdateSuscripcionDto, ConfigurarRenovacionDto, RenovarSuscripcionDto } from '../dto/suscripcion.dto';

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

  // Método principal para registrar suscripción mensual
  async registrarSuscripcionMensual(createSuscripcionDto: CreateSuscripcionDto, userId: string) {
    const plan = await this.planRepository.findOne({
      where: { id: createSuscripcionDto.planId, activo: true },
    });

    if (!plan) {
      throw new NotFoundException('Plan no encontrado o inactivo');
    }

    const psicologo = await this.userRepository.findOne({
      where: { id: userId, role: 'PSICOLOGO' },
    });

    if (!psicologo) {
      throw new NotFoundException('Usuario no encontrado o no es psicólogo');
    }

    // Verificar si ya tiene una suscripción activa
    const suscripcionActiva = await this.suscripcionRepository.findOne({
      where: { usuarioId: userId, estado: EstadoSuscripcion.ACTIVA },
    });

    if (suscripcionActiva) {
      throw new BadRequestException('Ya tiene una suscripción activa');
    }

    const fechaInicio = new Date();
    const fechaFin = this.calcularFechaRenovacion(fechaInicio);
    const fechaProximaRenovacion = this.calcularFechaProximaRenovacion(fechaFin);

    const suscripcion = this.suscripcionRepository.create({
      ...createSuscripcionDto,
      usuarioId: userId,
      planId: plan.id,
      fechaInicio,
      fechaFin,
      fechaProximaRenovacion,
      precioRenovacion: plan.precio,
      renovacionAutomatica: createSuscripcionDto.renovacionAutomatica || false,
      estado: EstadoSuscripcion.PENDIENTE_PAGO,
      historialPagos: [{
        fecha: new Date(),
        monto: createSuscripcionDto.precioTotal,
        metodo: createSuscripcionDto.metodoPago || 'PENDIENTE',
        referencia: createSuscripcionDto.referenciaPago || '',
        estado: 'PENDIENTE'
      }]
    });

    return this.suscripcionRepository.save(suscripcion);
  }

  // Calcular fecha de renovación (siempre +1 mes)
  private calcularFechaRenovacion(fechaInicio: Date): Date {
    const fechaRenovacion = new Date(fechaInicio);
    fechaRenovacion.setMonth(fechaRenovacion.getMonth() + 1);
    return fechaRenovacion;
  }

  // Calcular fecha de próxima renovación (7 días antes del vencimiento)
  private calcularFechaProximaRenovacion(fechaFin: Date): Date {
    const fechaProximaRenovacion = new Date(fechaFin);
    fechaProximaRenovacion.setDate(fechaProximaRenovacion.getDate() - 7);
    return fechaProximaRenovacion;
  }

  // Activar una suscripción pendiente de pago
  async activarSuscripcion(suscripcionId: string, datosPago: any = {}): Promise<Suscripcion> {
    const suscripcion = await this.suscripcionRepository.findOne({
      where: { id: suscripcionId },
      relations: ['plan']
    });

    if (!suscripcion) {
      throw new NotFoundException('Suscripción no encontrada');
    }

    if (suscripcion.estado !== EstadoSuscripcion.PENDIENTE_PAGO) {
      throw new BadRequestException(`No se puede activar una suscripción con estado: ${suscripcion.estado}`);
    }

    // Actualizar estado a ACTIVA
    suscripcion.estado = EstadoSuscripcion.ACTIVA;
    
    // Actualizar datos de pago si se proporcionan
    if (datosPago && Object.keys(datosPago).length > 0) {
      suscripcion.datosPago = datosPago;
    }

    // Actualizar historial de pagos
    if (suscripcion.historialPagos) {
      suscripcion.historialPagos.push({
        fecha: new Date(),
        monto: suscripcion.precioTotal,
        metodo: datosPago.metodo || 'CONFIRMADO',
        referencia: datosPago.referencia || '',
        estado: 'CONFIRMADO'
      });
    }

    // Actualizar fecha de actualización
    suscripcion.fechaActualizacion = new Date();

    return this.suscripcionRepository.save(suscripcion);
  }

  // Obtener información de renovación mensual
  async getRenovacionMensualInfo(id: string): Promise<any> {
    const suscripcion = await this.suscripcionRepository.findOne({
      where: { id },
      relations: ['plan', 'psicologo']
    });

    if (!suscripcion) {
      throw new NotFoundException('Suscripción no encontrada');
    }

    return {
      id: suscripcion.id,
      plan: suscripcion.plan,
      fechaInicio: suscripcion.fechaInicio,
      fechaFin: suscripcion.fechaFin,
      fechaProximaRenovacion: suscripcion.fechaProximaRenovacion || null,
      renovacionAutomatica: suscripcion.renovacionAutomatica,
      estado: suscripcion.estado,
      precioRenovacion: suscripcion.precioRenovacion,
      ciclo: 'MENSUAL',
      diasRestantes: Math.ceil((suscripcion.fechaFin.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    };
  }

  // Configurar renovación automática mensual
  async configurarRenovacionMensual(id: string, configDto: ConfigurarRenovacionDto, userId: string): Promise<Suscripcion> {
    const suscripcion = await this.findOne(id);

    if (suscripcion.psicologo.id !== userId) {
      throw new ForbiddenException('No tienes permiso para configurar esta suscripción');
    }

    suscripcion.renovacionAutomatica = configDto.renovacionAutomatica;
    suscripcion.updatedAt = new Date();

    return this.suscripcionRepository.save(suscripcion);
  }

  // Obtener próximas renovaciones mensuales
  async getProximasRenovacionesMensuales(userId: string): Promise<any[]> {
    const suscripciones = await this.suscripcionRepository.find({
      where: {
        usuarioId: userId,
        estado: EstadoSuscripcion.ACTIVA,
        renovacionAutomatica: true
      },
      relations: ['plan']
    });

    return suscripciones.map(suscripcion => ({
      id: suscripcion.id,
      plan: suscripcion.plan.nombre,
      fechaProximaRenovacion: suscripcion.fechaProximaRenovacion,
      precioRenovacion: suscripcion.precioRenovacion,
      diasRestantes: suscripcion.fechaProximaRenovacion ? Math.ceil((suscripcion.fechaProximaRenovacion.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null
    }));
  }

  // Obtener historial de pagos
  async getHistorialPagos(id: string): Promise<any> {
    const suscripcion = await this.suscripcionRepository.findOne({
      where: { id },
      relations: ['plan']
    });

    if (!suscripcion) {
      throw new NotFoundException('Suscripción no encontrada');
    }

    return {
      id: suscripcion.id,
      plan: suscripcion.plan.nombre,
      historialPagos: suscripcion.historialPagos || [],
      totalPagos: suscripcion.historialPagos?.length || 0
    };
  }

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
      where: { usuarioId: userId, estado: EstadoSuscripcion.ACTIVA },
    });

    if (suscripcionActiva) {
      throw new BadRequestException('Ya tiene una suscripción activa');
    }

    const fechaInicio = new Date();
    const fechaFin = new Date();
    fechaFin.setMonth(fechaFin.getMonth() + plan.duracion);

    const suscripcion = this.suscripcionRepository.create({
      ...createSuscripcionDto,
      usuarioId: userId,
      planId: plan.id,
      fechaInicio,
      fechaFin,
      estado: EstadoSuscripcion.PENDIENTE_PAGO,
    });

    return this.suscripcionRepository.save(suscripcion);
  }

  async findMiSuscripcion(userId: string) {
    const suscripcion = await this.suscripcionRepository.findOne({
      where: { usuarioId: userId },
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

    if (updateSuscripcionDto.renovacionAutomatica !== undefined) {
      suscripcion.renovacionAutomatica = updateSuscripcionDto.renovacionAutomatica;
    }

    if (updateSuscripcionDto.notificacionesHabilitadas !== undefined) {
      suscripcion.notificacionesHabilitadas = updateSuscripcionDto.notificacionesHabilitadas;
    }

    suscripcion.updatedAt = new Date();
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

    suscripcion.estado = EstadoSuscripcion.CANCELADA;
    suscripcion.motivoCancelacion = updateDto.motivoCancelacion || 'Cancelada por el usuario';
    suscripcion.fechaCancelacion = new Date();
    suscripcion.renovacionAutomatica = false;
    suscripcion.updatedAt = new Date();

    return this.suscripcionRepository.save(suscripcion);
  }

  async renovar(id: string, userId: string, renovarDto?: RenovarSuscripcionDto): Promise<Suscripcion> {
    const suscripcion = await this.findOne(id);

    if (suscripcion.psicologo.id !== userId) {
      throw new ForbiddenException('No tienes permiso para renovar esta suscripción');
    }

    if (![EstadoSuscripcion.ACTIVA, EstadoSuscripcion.VENCIDA].includes(suscripcion.estado)) {
      throw new BadRequestException('Solo se pueden renovar suscripciones activas o vencidas');
    }

    // Verificar que no haya otra suscripción activa
    const suscripcionActiva = await this.suscripcionRepository.findOne({
      where: {
        usuarioId: userId,
        estado: EstadoSuscripcion.ACTIVA,
        id: Not(id),
      },
    });

    if (suscripcionActiva) {
      throw new BadRequestException('Ya tienes una suscripción activa');
    }

    const nuevaFechaFin = this.calcularFechaRenovacion(suscripcion.fechaFin);
    const nuevaFechaProximaRenovacion = this.calcularFechaProximaRenovacion(nuevaFechaFin);

    suscripcion.fechaFin = nuevaFechaFin;
    suscripcion.fechaProximaRenovacion = nuevaFechaProximaRenovacion;
    suscripcion.estado = EstadoSuscripcion.ACTIVA;
    suscripcion.updatedAt = new Date();

    // Si se proporcionan datos de renovación, agregar al historial
    if (renovarDto) {
      if (!suscripcion.historialPagos) {
        suscripcion.historialPagos = [];
      }
      
      suscripcion.historialPagos.push({
        fecha: new Date(),
        monto: renovarDto.precioTotal,
        metodo: renovarDto.metodoPago || 'RENOVACION_MANUAL',
        referencia: renovarDto.referenciaPago || `REN_${Date.now()}`,
        estado: 'PENDIENTE'
      });
    }

    return this.suscripcionRepository.save(suscripcion);
  }

  // Verificar suscripciones vencidas y actualizar estado
  async verificarSuscripcionesVencidas(): Promise<void> {
    const suscripcionesVencidas = await this.suscripcionRepository.find({
      where: {
        estado: EstadoSuscripcion.ACTIVA,
        fechaFin: LessThanOrEqual(new Date())
      }
    });

    for (const suscripcion of suscripcionesVencidas) {
      suscripcion.estado = EstadoSuscripcion.VENCIDA;
      suscripcion.updatedAt = new Date();
      await this.suscripcionRepository.save(suscripcion);
    }
  }
}