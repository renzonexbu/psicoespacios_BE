import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Paciente } from './paciente.entity';
import { PerfilDerivacion } from './perfil-derivacion.entity';

export enum EstadoSolicitudDerivacion {
  PENDIENTE = 'PENDIENTE',
  ACEPTADA = 'ACEPTADA',
  RECHAZADA = 'RECHAZADA',
  PAGADA = 'PAGADA',
  CANCELADA = 'CANCELADA'
}

@Entity('solicitudes_derivacion')
export class SolicitudDerivacion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Paciente)
  paciente: Paciente;

  @ManyToOne(() => User)
  psicologoOrigen: User;

  @ManyToOne(() => PerfilDerivacion, perfil => perfil.solicitudesRecibidas)
  psicologoDestino: PerfilDerivacion;

  @Column({ type: 'text' })
  motivoDerivacion: string;

  @Column({ type: 'text', nullable: true })
  notasAdicionales: string;

  @Column({
    type: 'enum',
    enum: EstadoSolicitudDerivacion,
    default: EstadoSolicitudDerivacion.PENDIENTE
  })
  estado: EstadoSolicitudDerivacion;

  @Column({ type: 'timestamp', nullable: true })
  fechaPrimeraSesion: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  montoPrimeraSesion: number;

  @Column({ type: 'jsonb', nullable: true })
  datosPago: any;

  @Column({ type: 'text', nullable: true })
  motivoRechazo: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}