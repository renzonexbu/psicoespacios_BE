import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Sede } from './sede.entity';
import { Reserva } from './reserva.entity';

export interface Equipamiento {
  nombre: string;
  cantidad: number;
  descripcion?: string;
}

export interface Dimension {
  largo: number;
  ancho: number;
  alto: number;
  unidad: 'metros' | 'pies';
}

@Entity('boxes')
export class Box {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50 })
  numero: string;

  @Column()
  piso: number;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column()
  capacidad: number;

  @Column({ 
    type: 'decimal', 
    precision: 10, 
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    }
  })
  precioHora: number;

  @Column({ 
    type: 'decimal', 
    precision: 10, 
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    }
  })
  precioJornada: number;

  @Column({ type: 'jsonb', nullable: true })
  equipamiento: Equipamiento[];

  @Column({ type: 'jsonb', nullable: true })
  dimensiones: Dimension;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @Column({ type: 'text', array: true, nullable: true })
  caracteristicas: string[];

  @ManyToOne(() => Sede, sede => sede.boxes, { nullable: false })
  sede: Sede;

  @OneToMany(() => Reserva, reserva => reserva.box)
  reservas: Reserva[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}