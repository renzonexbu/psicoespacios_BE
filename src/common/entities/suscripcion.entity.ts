import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Plan } from './plan.entity';
import { User } from './user.entity';

@Entity('suscripciones')
export class Suscripcion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  psicologo: User;

  @ManyToOne(() => Plan)
  plan: Plan;

  @Column({ type: 'timestamp' })
  fechaInicio: Date;

  @Column({ type: 'timestamp' })
  fechaFin: Date;

  @Column({
    type: 'enum',
    enum: ['ACTIVA', 'PENDIENTE_PAGO', 'CANCELADA', 'VENCIDA'],
    default: 'PENDIENTE_PAGO'
  })
  estado: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  precioTotal: number;

  @Column({ type: 'json', nullable: true })
  datosPago: any;

  @Column({ type: 'text', nullable: true })
  notasCancelacion: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}