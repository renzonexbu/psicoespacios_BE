import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column()
  nombre: string;

  @Column()
  apellido: string;
  
  @Column({ nullable: true })
  rut: string;
  
  @Column({ nullable: true })
  telefono: string;
  
  @Column({ nullable: true, type: 'timestamp' })
  fechaNacimiento: Date;

  @Column({ nullable: true })
  direccion: string;

  @Column({ nullable: true })
  especialidad: string;

  @Column({ nullable: true })
  numeroRegistroProfesional: string;

  @Column({ nullable: true, type: 'text' })
  experiencia: string;

  @Column({
    type: 'enum',
    enum: ['PSICOLOGO', 'USUARIO', 'ADMIN'],
    default: 'USUARIO'
  })
  role: string;

  @Column({
    type: 'enum',
    enum: ['ACTIVO', 'INACTIVO', 'PENDIENTE'],
    default: 'ACTIVO'
  })
  estado: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}