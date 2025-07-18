import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('acreditaciones')
export class Acreditacion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  idPsicologo: string;

  @Column({ type: 'varchar' })
  nombre: string;

  @Column({ type: 'varchar' })
  urlFile: string;

  @Column({ type: 'boolean', default: true })
  estado: boolean;
} 