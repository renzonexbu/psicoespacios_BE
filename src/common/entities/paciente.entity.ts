import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('pacientes')
export class Paciente {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  idUsuarioPaciente: string;

  @Column({ type: 'uuid', nullable: true })
  idUsuarioPsicologo: string;

  @Column({ type: 'timestamp', nullable: false })
  primeraSesionRegistrada: Date;

  @Column({ type: 'timestamp', nullable: true })
  proximaSesion: Date | null;

  @Column({ type: 'varchar', nullable: true })
  estado: string | null;

  // Sistema de Matching - Perfil del Paciente
  
  // Coincidencias Diagnósticas (35%)
  @Column({ type: 'text', array: true, default: [] })
  diagnosticos_principales: string[];

  // Coincidencias Temáticas (25%)
  @Column({ type: 'text', array: true, default: [] })
  temas_principales: string[];

  // Coincidencias de Estilo Terapéutico (20%)
  @Column({ type: 'text', array: true, default: [] })
  estilo_terapeutico_preferido: string[];

  // Enfoque teórico (10%)
  @Column({ type: 'text', array: true, default: [] })
  enfoque_teorico_preferido: string[];

  // Afinidad Personal (10%)
  @Column({ type: 'text', array: true, default: [] })
  afinidad_personal_preferida: string[];

  // Filtros Logísticos
  @Column({ length: 1, nullable: true })
  genero: string; // M, F, N (no binario)

  @Column({ type: 'text', array: true, default: [] })
  modalidad_preferida: string[]; // ['Online', 'Presencial', 'Indiferente']

  @Column({ type: 'text', array: true, default: [] })
  genero_psicologo_preferido: string[]; // ['Hombre', 'Mujer', 'No binario', 'Indiferente']

  // Campos de tracking del matching
  @Column({ type: 'boolean', nullable: true, default: false })
  perfil_matching_completado: boolean;

  @Column({ type: 'timestamp', nullable: true })
  ultima_actualizacion_matching: Date;

  // Sistema de Tags - Asignado por el psicólogo
  @Column({ type: 'varchar', length: 100, nullable: true })
  tag: string | null;
}