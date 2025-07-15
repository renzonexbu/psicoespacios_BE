import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('reservas')
export class Reserva {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  boxId: string;

  @Column({ type: 'uuid' })
  pacienteId: string;

  @Column({ type: 'uuid' })
  psicologoId: string;

  @Column({ type: 'date' })
  fecha: string;

  @Column({ type: 'varchar' })
  horario: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  precio: number;

  @Column({ type: 'varchar', default: 'PENDIENTE' })
  estado: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}