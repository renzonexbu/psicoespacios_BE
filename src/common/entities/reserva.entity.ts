import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Box } from './box.entity';
import { User } from './user.entity';

export enum TipoReserva {
  HORA = 'HORA',
  JORNADA = 'JORNADA'
}

export enum EstadoReserva {
  PENDIENTE = 'PENDIENTE',
  CONFIRMADA = 'CONFIRMADA',
  CANCELADA = 'CANCELADA'
}

@Entity('reservas')
export class Reserva {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Box, box => box.reservas)
  box: Box;

  @ManyToOne(() => User)
  psicologo: User;

  @Column({ type: 'timestamp' })
  fechaInicio: Date;

  @Column({ type: 'timestamp' })
  fechaFin: Date;

  @Column({
    type: 'enum',
    enum: TipoReserva,
    default: TipoReserva.HORA
  })
  tipo: TipoReserva;

  @Column({
    type: 'enum',
    enum: EstadoReserva,
    default: EstadoReserva.PENDIENTE
  })
  estado: EstadoReserva;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  precio: number;

  @Column({ type: 'text', nullable: true })
  notasCancelacion: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}