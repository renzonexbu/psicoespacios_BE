import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum ContactoEstado {
  NUEVA = 'NUEVA',
  VISTA = 'VISTA',
  SOLUCIONADA = 'SOLUCIONADA'
}

export enum ContactoTipo {
  CONSULTA = 'CONSULTA',
  RECLAMO = 'RECLAMO',
  SUGERENCIA = 'SUGERENCIA',
  OTRO = 'OTRO'
}

@Entity('contactos')
export class Contacto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nombre: string;

  @Column({
    type: 'enum',
    enum: ContactoTipo,
    default: ContactoTipo.CONSULTA
  })
  tipo: ContactoTipo;

  @Column()
  email: string;

  @Column({ nullable: true })
  telefono: string;

  @Column({ type: 'text' })
  mensaje: string;

  @CreateDateColumn()
  fecha: Date;

  @Column({
    type: 'enum',
    enum: ContactoEstado,
    default: ContactoEstado.NUEVA
  })
  estado: ContactoEstado;
}
