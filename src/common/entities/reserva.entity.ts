import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Box } from './box.entity';
import { User } from './user.entity';

export enum EstadoReserva {
  PENDIENTE = 'pendiente',
  CONFIRMADA = 'confirmada',
  CANCELADA = 'cancelada',
  COMPLETADA = 'completada'
}

@Entity('reservas')
export class Reserva {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  boxId: string;

  @Column({ type: 'uuid' })
  psicologoId: string;

  @Column({ type: 'date' })
  fecha: Date;

  @Column({ type: 'varchar', length: 5 })
  horaInicio: string; // Formato "HH:00" (ej: "09:00")

  @Column({ type: 'varchar', length: 5 })
  horaFin: string; // Formato "HH:00" (ej: "10:00")

  @Column({
    type: 'enum',
    enum: EstadoReserva,
    default: EstadoReserva.PENDIENTE
  })
  estado: EstadoReserva;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  precio: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relaciones
  @ManyToOne(() => Box, { eager: true })
  @JoinColumn({ name: 'boxId' })
  box: Box;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'psicologoId' })
  psicologo: User;
}