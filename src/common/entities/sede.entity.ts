import { Entity, Column, PrimaryGeneratedColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('sedes')
export class Sede {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  nombre: string;

  @Column()
  direccion: string;

  @Column({ nullable: true })
  telefono: string;

  @Column({ nullable: true })
  email: string;

  @Column({ type: 'jsonb', nullable: true })
  horarioAtencion: {
    diasHabiles: string[];
    horaApertura: string;
    horaCierre: string;
  };

  @Column({ type: 'text', array: true, nullable: true })
  serviciosDisponibles: string[];

 @Column({ default: 'ACTIVA' })
  estado: string;

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