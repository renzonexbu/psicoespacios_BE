import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { PackAsignacion } from './pack-asignacion.entity';
import { User } from '../../common/entities/user.entity';

export enum EstadoPagoPackMensual {
  PENDIENTE_PAGO = 'pendiente_pago',
  PAGADO = 'pagado',
  REEMBOLSADO = 'reembolsado',
  CANCELADO = 'cancelado'
}

@Entity('packs_pagos_mensuales')
@Index(['asignacionId', 'mes', 'año'], { unique: true }) // Un pago por pack por mes
export class PackPagoMensual {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  asignacionId: string;

  @ManyToOne(() => PackAsignacion, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'asignacionId' })
  asignacion: PackAsignacion;

  @Column({ type: 'uuid' })
  usuarioId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'usuarioId' })
  usuario: User;

  @Column({ type: 'integer' })
  mes: number; // 1-12

  @Column({ type: 'integer' })
  año: number; // 2024, 2025, etc.

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  monto: number; // Monto del pack para este mes

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  montoPagado: number; // Monto efectivamente pagado

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  montoReembolsado: number; // Monto reembolsado si aplica

  @Column({ 
    type: 'enum', 
    enum: EstadoPagoPackMensual, 
    default: EstadoPagoPackMensual.PENDIENTE_PAGO 
  })
  estado: EstadoPagoPackMensual;

  @Column({ type: 'date', nullable: true })
  fechaPago: Date | null; // Fecha cuando se pagó

  @Column({ type: 'date', nullable: true })
  fechaVencimiento: Date | null; // Fecha límite de pago

  @Column({ type: 'text', nullable: true })
  observaciones: string | null; // Observaciones sobre el pago

  @Column({ type: 'varchar', length: 100, nullable: true })
  metodoPago: string | null; // Método de pago utilizado

  @Column({ type: 'varchar', length: 200, nullable: true })
  referenciaPago: string | null; // Referencia del pago (transacción, etc.)

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
