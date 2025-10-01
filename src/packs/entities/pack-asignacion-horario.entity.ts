import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { PackAsignacion } from './pack-asignacion.entity';
import { Box } from '../../common/entities/box.entity';

@Entity('packs_asignaciones_horarios')
export class PackAsignacionHorario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  asignacionId: string;

  @ManyToOne(() => PackAsignacion, (a) => a.horarios, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'asignacionId' })
  asignacion: PackAsignacion;

  // 1=Lunes ... 7=Domingo
  @Column({ type: 'integer' })
  diaSemana: number;

  @Column({ type: 'varchar', length: 5 })
  horaInicio: string;

  @Column({ type: 'varchar', length: 5 })
  horaFin: string;

  @Column({ type: 'uuid' })
  boxId: string;

  @ManyToOne(() => Box)
  @JoinColumn({ name: 'boxId' })
  box: Box;
}




