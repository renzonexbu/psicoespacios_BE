import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { User } from '../../common/entities/user.entity';

@Entity('psicologo_disponibilidad')
export class Disponibilidad {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'psicologo_id' })
  psicologo: User;

  @Column({ type: 'varchar', length: 20 })
  day: string; // 'Lunes', 'Martes', etc.

  @Column({ type: 'boolean', default: false })
  active: boolean;

  @Column({ type: 'jsonb', nullable: true })
  hours: string[]; // ["08:00", "09:00", "10:00"]

  @Column({ type: 'varchar', length: 50, nullable: true })
  sede_id: string; // 'online' o UUID de sede

  @Column({ type: 'boolean', default: false })
  works_on_holidays: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
