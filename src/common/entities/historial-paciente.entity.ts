import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('historial_paciente')
export class HistorialPaciente {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  tipo: string;

  @Column({ type: 'uuid' })
  idUsuarioPaciente: string;

  @Column({ type: 'text' })
  descripcion: string;

  @Column({ type: 'varchar', nullable: true })
  url?: string;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;
} 