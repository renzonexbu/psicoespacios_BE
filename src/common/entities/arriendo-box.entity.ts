import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Box } from './box.entity';
import { User } from './user.entity';

export enum EstadoArriendo {
  PENDIENTE = 'PENDIENTE',
  ACTIVO = 'ACTIVO',
  SUSPENDIDO = 'SUSPENDIDO',
  CANCELADO = 'CANCELADO',
  VENCIDO = 'VENCIDO'
}

export enum TipoArriendo {
  MENSUAL = 'MENSUAL',
  TRIMESTRAL = 'TRIMESTRAL',
  SEMESTRAL = 'SEMESTRAL',
  ANUAL = 'ANUAL',
  PERSONALIZADO = 'PERSONALIZADO'
}

@Entity('arriendos_box')
export class ArriendoBox {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Box, { nullable: false })
  box: Box;

  @Column({ type: 'uuid' })
  boxId: string;

  @ManyToOne(() => User, { nullable: false })
  psicologo: User;

  @Column({ type: 'uuid' })
  psicologoId: string;

  @Column({
    type: 'enum',
    enum: TipoArriendo,
    default: TipoArriendo.MENSUAL
  })
  tipoArriendo: TipoArriendo;

  @Column({ type: 'date' })
  fechaInicio: Date;

  @Column({ type: 'date' })
  fechaFin: Date;

  @Column({ type: 'jsonb' })
  horarios: {
    dia: string; // 'lunes', 'martes', etc.
    horaInicio: string; // '09:00'
    horaFin: string; // '17:00'
    activo: boolean;
  }[];

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  precioMensual: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  precioTotal: number;

  @Column({
    type: 'enum',
    enum: EstadoArriendo,
    default: EstadoArriendo.PENDIENTE
  })
  estado: EstadoArriendo;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @Column({ type: 'jsonb', nullable: true })
  condicionesEspeciales: {
    equipamientoAdicional?: string[];
    restricciones?: string[];
    notas?: string;
  };

  @Column({ type: 'boolean', default: false })
  renovacionAutomatica: boolean;

  @Column({ type: 'date', nullable: true })
  fechaRenovacion: Date;

  @Column({ type: 'text', nullable: true })
  motivoCancelacion: string;

  @Column({ type: 'timestamp', nullable: true })
  fechaCancelacion: Date;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
} 