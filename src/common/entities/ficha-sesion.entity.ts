import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Paciente } from './paciente.entity';

export interface DocumentoAdjunto {
  nombre: string;
  tipo: string;
  url: string;
  tamaño: number;
  fechaSubida: Date;
}

@Entity('fichas_sesion')
export class FichaSesion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Paciente, { nullable: false })
  paciente: Paciente;

  @Column({ type: 'timestamp' })
  fechaSesion: Date;

  @Column({ type: 'text' })
  motivo: string;

  @Column({ type: 'text' })
  observaciones: string;

  @Column({ type: 'text', nullable: true })
  tareas: string;

  @Column({ type: 'text', nullable: true })
  acuerdos: string;

  @Column({ type: 'jsonb', nullable: true })
  documentosAdjuntos: DocumentoAdjunto[];

  @Column({ type: 'boolean', default: false })
  seguimientoRequerido: boolean;

  @Column({ type: 'date', nullable: true })
  proximaSesion: Date;

  @Column({ type: 'text', array: true, nullable: true })
  etiquetas: string[];

  @Column({ type: 'int', nullable: true })
  duracionMinutos: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}