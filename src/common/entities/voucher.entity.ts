import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Psicologo } from './psicologo.entity';

@Entity('voucher')
export class Voucher {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'float' })
  porcentaje: number;

  @Column({ type: 'date' })
  vencimiento: Date;

  @Column({ type: 'varchar', length: 50 })
  modalidad: string;

  @ManyToOne(() => Psicologo, { nullable: false })
  @JoinColumn({ name: 'psicologoId' })
  psicologo: Psicologo;

  @Column({ type: 'uuid' })
  psicologoId: string;

  @Column({ type: 'int' })
  limiteUsos: number;

  @Column({ type: 'int', default: 0 })
  usosActuales: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date | null;
} 