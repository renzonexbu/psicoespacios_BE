import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('pacientes')
export class Paciente {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  idUsuarioPaciente: string;

  @Column({ type: 'uuid' })
  idUsuarioPsicologo: string;

  @Column({ type: 'timestamp', nullable: false })
  primeraSesionRegistrada: Date;

  @Column({ type: 'timestamp', nullable: true })
  proximaSesion: Date | null;

  @Column({ type: 'varchar', nullable: true })
  estado: string | null;
}