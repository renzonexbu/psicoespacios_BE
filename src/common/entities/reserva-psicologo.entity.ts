
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Psicologo } from './psicologo.entity';

export enum EstadoReservaPsicologo {
  PENDIENTE = 'pendiente',
  PENDIENTE_PAGO = 'pendiente_pago',
  CONFIRMADA = 'confirmada',
  CANCELADA = 'cancelada',
  COMPLETADA = 'completada',
  NO_SHOW = 'no_show'
}

export enum ModalidadSesion {
  ONLINE = 'online',
  PRESENCIAL = 'presencial'
}

@Entity('reservas_sesiones')
export class ReservaPsicologo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Psicologo, { nullable: false })
  @JoinColumn({ name: 'psicologo_id' })
  psicologo: Psicologo;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'paciente_id' })
  paciente: User;

  @Column({ type: 'date' })
  fecha: Date;

  @Column({ type: 'varchar', length: 5, name: 'hora_inicio' })
  horaInicio: string; // Formato "HH:MM"

  @Column({ type: 'varchar', length: 5, name: 'hora_fin' })
  horaFin: string; // Formato "HH:MM"

  @Column({ type: 'uuid', nullable: true, name: 'box_id' })
  boxId: string; // Para sesiones presenciales, null para online

  @Column({
    type: 'enum',
    enum: ModalidadSesion,
    default: ModalidadSesion.PRESENCIAL
  })
  modalidad: ModalidadSesion;

  @Column({
    type: 'enum',
    enum: EstadoReservaPsicologo,
    default: EstadoReservaPsicologo.PENDIENTE
  })
  estado: EstadoReservaPsicologo;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @Column({ type: 'uuid', nullable: true, name: 'cupon_id' })
  cuponId: string; // ID del cupón usado

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'descuento_aplicado' })
  descuentoAplicado: number; // Monto del descuento aplicado

  @Column({ type: 'jsonb', nullable: true })
  metadatos: {
    motivo?: string;
    duracion?: number; // en minutos
    precio?: number;
    ubicacion?: string; // para sesiones presenciales
    link?: string; // para sesiones online
    [key: string]: any;
  };

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
} 