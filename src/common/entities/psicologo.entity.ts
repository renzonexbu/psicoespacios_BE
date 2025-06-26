import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('psicologo')
export class Psicologo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, { nullable: false })
  @JoinColumn()
  usuario: User;

  @Column({ type: 'text', array: true, default: [] })
  diagnosticos_experiencia: string[];

  @Column({ type: 'text', array: true, default: [] })
  temas_experiencia: string[];

  @Column({ type: 'text', array: true, default: [] })
  estilo_terapeutico: string[];

  @Column({ type: 'text', array: true, default: [] })
  afinidad_paciente_preferida: string[];

  @Column({ length: 1 })
  genero: string; // M o F

  @Column({ nullable: true })
  numeroRegistroProfesional: string;

  @Column({ nullable: true, type: 'integer' })
  experiencia: number; // años de experiencia

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ type: 'text', array: true, default: [] })
  modalidades: string[]; // "Presencial", "Online", "Domicilio"

  @Column({ type: 'jsonb', nullable: true })
  disponibilidad: any; // horarios disponibles

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
