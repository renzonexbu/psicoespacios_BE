import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { Plan } from './plan.entity';
import { User } from './user.entity';

export enum EstadoSuscripcion {
  PENDIENTE_PAGO = 'PENDIENTE_PAGO',
  ACTIVA = 'ACTIVA',
  CANCELADA = 'CANCELADA',
  VENCIDA = 'VENCIDA'
}

@Entity('suscripciones')
export class Suscripcion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'fechaInicio', type: 'timestamp' })
  fechaInicio: Date;

  @Column({ name: 'fechaFin', type: 'timestamp' })
  fechaFin: Date;

  @Column({ 
    name: 'estado', 
    type: 'enum',
    enum: EstadoSuscripcion,
    default: EstadoSuscripcion.PENDIENTE_PAGO
  })
  estado: EstadoSuscripcion;

  @Column({ name: 'precioTotal', type: 'numeric', precision: 10, scale: 2 })
  precioTotal: number;

  @Column({ name: 'planId', type: 'uuid', nullable: true })
  planId: string;

  @ManyToOne(() => Plan)
  @JoinColumn({ name: 'planId' })
  plan: Plan;

  @Column({ name: 'usuarioId', type: 'uuid', nullable: true })
  usuarioId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'usuarioId' })
  psicologo: User;

  @Column({ name: 'horasConsumidas', type: 'integer', default: 0 })
  horasConsumidas: number;

  @Column({ name: 'horasDisponibles', type: 'integer', default: 0 })
  horasDisponibles: number;

  @Column({ name: 'fechaCreacion', type: 'timestamp', default: () => 'now()' })
  fechaCreacion: Date;

  @Column({ name: 'fechaActualizacion', type: 'timestamp', default: () => 'now()' })
  fechaActualizacion: Date;

  // Campos adicionales que pueden no estar en la base de datos pero se usan en el código
  @Column({ type: 'timestamp', nullable: true })
  fechaProximaRenovacion?: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  precioRenovacion?: number;

  @Column({ type: 'boolean', default: false })
  renovacionAutomatica?: boolean;

  @Column({ type: 'json', nullable: true })
  datosPago?: any;

  @Column({ type: 'text', nullable: true })
  notasCancelacion?: string;

  @Column({ type: 'text', nullable: true })
  motivoCancelacion?: string;

  @Column({ type: 'timestamp', nullable: true })
  fechaCancelacion?: Date;

  @Column({ type: 'boolean', default: true })
  notificacionesHabilitadas?: boolean;

  @Column({ type: 'jsonb', nullable: true })
  historialPagos?: {
    fecha: Date;
    monto: number;
    metodo: string;
    referencia: string;
    estado: string;
  }[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}