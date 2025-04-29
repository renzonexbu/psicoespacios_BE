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
  firstName: string;

  @Column()
  lastName: string;

  @Column({
    type: 'enum',
    enum: ['PSICOLOGO', 'PACIENTE', 'ADMIN'],
    default: 'PACIENTE'
  })
  role: string;

  @Column({
    type: 'enum',
    enum: ['ACTIVO', 'INACTIVO', 'SUSPENDIDO'],
    default: 'ACTIVO'
  })
  estado: string;

  @Column({ default: false })
  verificado: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: true })
  isActive: boolean;
}