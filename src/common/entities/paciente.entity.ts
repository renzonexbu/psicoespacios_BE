import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';

export enum EstadoPaciente {
  ACTIVO = 'ACTIVO',
  INACTIVO = 'INACTIVO',
  DERIVADO = 'DERIVADO'
}

@Entity('pacientes')
export class Paciente {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, { nullable: false })
  @JoinColumn()
  usuario: User;

  @Column({ type: 'text', array: true, default: [] })
  diagnosticos: string[];

  @Column({ type: 'text', array: true, default: [] })
  temas: string[];

  @Column({ type: 'text', array: true, default: [] })
  estilo_esperado: string[];

  @Column({ type: 'text', array: true, default: [] })
  afinidad: string[];

  @Column({ type: 'jsonb', nullable: true })
  preferencias: {
    genero_psicologo?: string;
    modalidad?: string;
  };

  @Column({
    type: 'enum',
    enum: EstadoPaciente,
    default: EstadoPaciente.ACTIVO
  })
  estado: EstadoPaciente;

  @Column({ type: 'text', nullable: true })
  notas: string;

  @OneToMany('FichaSesion', (fichaSesion: any) => fichaSesion.paciente)
  fichasSesion: any[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}