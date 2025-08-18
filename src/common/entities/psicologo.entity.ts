import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('psicologo')
export class Psicologo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, { nullable: false })
  @JoinColumn()
  usuario: User;

  // Coincidencias Diagnósticas (35%)
  @Column({ type: 'text', array: true, default: [] })
  diagnosticos_experiencia: string[];

  // Coincidencias Temáticas (25%)
  @Column({ type: 'text', array: true, default: [] })
  temas_experiencia: string[];

  // Coincidencias de Estilo Terapéutico (20%)
  @Column({ type: 'text', array: true, default: [] })
  estilo_terapeutico: string[];

  // Enfoque teórico (10%)
  @Column({ type: 'text', array: true, default: [] })
  enfoque_teorico: string[];

  // Afinidad Personal (10%)
  @Column({ type: 'text', array: true, default: [] })
  afinidad_paciente_preferida: string[];

  // Filtros Logísticos
  @Column({ length: 1 })
  genero: string; // M, F, N (no binario)

  @Column({ type: 'text', array: true, default: [] })
  modalidad_atencion: string[]; // ['Online', 'Presencial', 'Ambas']

  // Campos adicionales existentes
  @Column({ nullable: true })
  numeroRegistroProfesional: string;

  @Column({ nullable: true, type: 'integer' })
  experiencia: number; // años de experiencia

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  precioPresencial: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  precioOnline: number;

  @Column({ type: 'jsonb', nullable: true })
  disponibilidad: any; // horarios disponibles

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
