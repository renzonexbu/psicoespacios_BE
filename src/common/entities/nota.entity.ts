import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { User } from './user.entity';

export enum TipoNota {
  SESION = 'sesion',
  EVALUACION = 'evaluacion',
  OBSERVACION = 'observacion',
  PLAN_TRATAMIENTO = 'plan_tratamiento',
  PROGRESO = 'progreso',
  OTRO = 'otro'
}

@Entity('notas')
export class Nota {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'psicologo_id' })
  psicologo: User;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'paciente_id' })
  paciente: User;

  @Column({ type: 'text' })
  contenido: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  titulo: string;

  @Column({
    type: 'enum',
    enum: TipoNota,
    default: TipoNota.OTRO
  })
  tipo: TipoNota;

  @Column({ name: 'es_privada', type: 'boolean', default: false })
  esPrivada: boolean; // Para notas que solo ve el psicólogo

  @Column({ type: 'jsonb', nullable: true })
  metadatos: {
    tags?: string[];
    prioridad?: 'baja' | 'media' | 'alta';
    estado?: 'borrador' | 'completada' | 'archivada';
    fechaSesion?: string; // Si la nota está relacionada con una sesión específica
    [key: string]: any;
  };

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
} 