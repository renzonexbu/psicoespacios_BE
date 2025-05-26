import { Entity, Column, PrimaryGeneratedColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum TipoPlan {
  BASICO = 'BASICO',
  INTERMEDIO = 'INTERMEDIO',
  PREMIUM = 'PREMIUM'
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

  @Column()
  precio: number;

  @Column()
  duracion: number;

  @Column({ default: 4 })
  horasIncluidas: number;

  @Column({ type: 'text', array: true, nullable: true })
  beneficios: string[];

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