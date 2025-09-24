import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum EstadoReservaBox {
  PENDIENTE = 'pendiente',
  CONFIRMADA = 'confirmada',
  CANCELADA = 'cancelada',
  COMPLETADA = 'completada'
}

@Entity('reservas_boxes')
export class ReservaBox {
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
    enum: EstadoReservaBox,
    default: EstadoReservaBox.PENDIENTE
  })
  estado: EstadoReservaBox;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  precio: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}