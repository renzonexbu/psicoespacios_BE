import { Entity, Column, PrimaryGeneratedColumn, OneToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { SolicitudDerivacion } from './solicitud-derivacion.entity';

interface HorarioAtencion {
  dia: string;
  horaInicio: string;
  horaFin: string;
}

@Entity('perfiles_derivacion')
export class PerfilDerivacion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User)
  @JoinColumn()
  psicologo: User;

  @Column('simple-array')
  especialidades: string[];

  @Column('simple-array')
  modalidades: string[];

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ type: 'text', nullable: true })
  experiencia: string;

  @Column({ type: 'jsonb' })
  horariosAtencion: HorarioAtencion[];

  @Column('simple-array')
  sedesAtencion: string[];

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  tarifaHora: number;

  @Column({ default: false })
  aprobado: boolean;

  @OneToMany(() => SolicitudDerivacion, solicitud => solicitud.psicologoDestino)
  solicitudesRecibidas: SolicitudDerivacion[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}