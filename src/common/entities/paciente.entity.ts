import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
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

  @ManyToOne(() => User, { nullable: false })
  psicologo: User;

  @Column({ length: 100 })
  nombre: string;

  @Column({ length: 100 })
  apellido: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ length: 20 })
  telefono: string;

  @Column({ type: 'date' })
  fechaNacimiento: Date;

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