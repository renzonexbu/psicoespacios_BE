import { Entity, Column, PrimaryGeneratedColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('sedes')
export class Sede {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  nombre: string;

  @Column({ length: 255 })
  direccion: string;

  @Column({ length: 100 })
  ciudad: string;

  @Column({ length: 100 })
  comuna: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ type: 'boolean', default: true })
  activa: boolean;

  @Column({ length: 20, nullable: true })
  telefono: string;

  @Column({ length: 100, nullable: true })
  email: string;

  @Column({ type: 'jsonb', nullable: true })
  horarioAtencion: {
    diasHabiles: string[];
    horaApertura: string;
    horaCierre: string;
  };

  @OneToMany('Box', 'sede', { 
    cascade: true,
    eager: false 
  })
  boxes: any[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}