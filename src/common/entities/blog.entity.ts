import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('blogs')
export class Blog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  titulo: string;

  @Column({ type: 'text' })
  descripcion: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  imagen?: string;

  @Column({ type: 'date' })
  fecha: string;

  @Column({ length: 100 })
  categoria: string;

  @Column({ type: 'text' })
  contenido: string; // Permitir HTML
} 