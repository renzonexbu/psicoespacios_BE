import { Entity, Column, PrimaryGeneratedColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum TipoPlan {
  BASICO = 'BASICO',
  INTERMEDIO = 'INTERMEDIO',
  PREMIUM = 'PREMIUM'
}

interface Caracteristica {
  nombre: string;
  descripcion: string;
  incluido: boolean;
}

@Entity('planes')
export class Plan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: TipoPlan,
    default: TipoPlan.BASICO
  })
  tipo: TipoPlan;

  @Column({ length: 100, unique: true })
  nombre: string;

  @Column({ type: 'text' })
  descripcion: string;

  @Column({ 
    type: 'decimal', 
    precision: 10, 
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    }
  })
  precio: number;

  @Column()
  duracionMeses: number;

  @Column({ type: 'jsonb' })
  caracteristicas: Caracteristica[];

  @Column({ 
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    }
  })
  descuento: number;

  @Column({ default: true })
  activo: boolean;

  @OneToMany('Suscripcion', 'plan', {
    eager: false
  })
  suscripciones: any[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}