import { Column, CreateDateColumn, UpdateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum ContactoEstado {
  PENDIENTE = 'PENDIENTE',
  NUEVA = 'NUEVA',
  VISTA = 'VISTA',
  SOLUCIONADA = 'SOLUCIONADA',
  CONTACTADO = 'CONTACTADO',
  RESUELTO = 'RESUELTO',
  RECHAZADO = 'RECHAZADO'
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

  @Column()
  asunto: string;

  @Column({ type: 'text' })
  mensaje: string;

  @Column({
    type: 'enum',
    enum: ContactoEstado,
    default: ContactoEstado.PENDIENTE
  })
  estado: ContactoEstado;

  @Column({ type: 'text', nullable: true })
  respuesta: string;

  @Column({ nullable: true })
  fechaRespuesta: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
