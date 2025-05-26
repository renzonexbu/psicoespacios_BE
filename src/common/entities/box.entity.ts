import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Sede } from './sede.entity';
import { Reserva } from './reserva.entity';

// Definición para uso interno, no se mapea directamente a la BD
export interface EquipamientoItem {
  nombre: string;
  cantidad: number;
  descripcion?: string;
}

@Entity('boxes')
export class Box {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  numero: string;

  @Column({ nullable: true })
  nombre: string;

  @Column({ default: 2 })
  capacidad: number;

  @Column({ type: 'text', array: true, nullable: true })
  equipamiento: string[];

  @Column({ default: 'DISPONIBLE' })
  estado: string;

  @ManyToOne(() => Sede, sede => sede.boxes, { nullable: true })
  sede: Sede;

  @OneToMany(() => Reserva, reserva => reserva.box)
  reservas: Reserva[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}