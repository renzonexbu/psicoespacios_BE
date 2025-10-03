import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { PackHora } from './pack-hora.entity';
import { User } from '../../common/entities/user.entity';

export enum EstadoPackAsignacion {
  ACTIVA = 'ACTIVA',
  CANCELADA = 'CANCELADA'
}

@Entity('packs_asignaciones')
export class PackAsignacion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  packId: string;

  @ManyToOne(() => PackHora)
  @JoinColumn({ name: 'packId' })
  pack: PackHora;

  @Column({ type: 'uuid' })
  usuarioId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'usuarioId' })
  usuario: User;

  @Column({ type: 'enum', enum: EstadoPackAsignacion, default: EstadoPackAsignacion.ACTIVA })
  estado: EstadoPackAsignacion;

  @Column({ type: 'boolean', default: true })
  recurrente: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => PackAsignacionHorario, (h) => h.asignacion, { cascade: true })
  horarios: PackAsignacionHorario[];
}

// forward import to avoid circular require issues in TS transpile order
import { PackAsignacionHorario } from './pack-asignacion-horario.entity';






