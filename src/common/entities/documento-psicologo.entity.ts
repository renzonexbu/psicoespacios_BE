import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Psicologo } from './psicologo.entity';
import { User } from './user.entity';

export enum TipoDocumento {
  TITULO = 'titulo',
  CERTIFICADO = 'certificado',
  DIPLOMA = 'diploma',
  LICENCIA = 'licencia',
  EXPERIENCIA = 'experiencia',
  OTRO = 'otro',
}

@Entity('documento_psicologo')
export class DocumentoPsicologo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Psicologo, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'psicologo_id' })
  psicologo: Psicologo | null;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: User;

  @Column({ type: 'enum', enum: TipoDocumento, default: TipoDocumento.TITULO })
  tipo: TipoDocumento;

  @Column({ type: 'varchar', length: 255 })
  nombre: string;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    name: 'url_documento',
  })
  urlDocumento: string; // Para almacenar la URL del documento subido

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
