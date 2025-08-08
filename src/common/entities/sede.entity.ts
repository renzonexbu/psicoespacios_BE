import { Entity, Column, PrimaryGeneratedColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('sedes')
export class Sede {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  nombre: string;

  @Column({ type: 'text' })
  description: string;

  @Column()
  direccion: string;

  @Column()
  ciudad: string;

  @Column({ nullable: true })
  telefono: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ nullable: true })
  thumbnailUrl: string;

  @Column({ type: 'jsonb', nullable: true })
  features: string[];

  @Column({ type: 'jsonb', nullable: true })
  coordenadas?: {
    lat: number;
    lng: number;
  };

  @Column({ type: 'jsonb', nullable: true })
  horarioAtencion: {
    diasHabiles: {
      dia: string;
      inicio: string;
      fin: string;
      cerrado: boolean;
    }[];
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