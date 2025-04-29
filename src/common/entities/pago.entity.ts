import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Suscripcion } from './suscripcion.entity';
import { SolicitudDerivacion } from './solicitud-derivacion.entity';

export enum TipoPago {
  SUSCRIPCION = 'SUSCRIPCION',
  DERIVACION = 'DERIVACION'
}

export enum EstadoPago {
  PENDIENTE = 'PENDIENTE',
  PROCESANDO = 'PROCESANDO',
  COMPLETADO = 'COMPLETADO',
  FALLIDO = 'FALLIDO',
  REEMBOLSADO = 'REEMBOLSADO'
}

export enum MetodoPago {
  TARJETA = 'TARJETA',
  TRANSFERENCIA = 'TRANSFERENCIA'
}

export interface DatosTarjeta {
  ultimos4: string;
  marca: string;
}

export interface DatosTransferencia {
  banco: string;
  numeroOperacion: string;
}

export interface DatosTransaccion {
  metodoPago: MetodoPago;
  referencia?: string;
  datosTarjeta?: DatosTarjeta;
  datosTransferencia?: DatosTransferencia;
  fechaTransaccion: Date;
}

@Entity('pagos')
export class Pago {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: false })
  usuario: User;

  @ManyToOne(() => Suscripcion, { nullable: true })
  suscripcion: Suscripcion;

  @ManyToOne(() => SolicitudDerivacion, { nullable: true })
  solicitudDerivacion: SolicitudDerivacion;

  @Column({
    type: 'enum',
    enum: TipoPago,
  })
  tipo: TipoPago;

  @Column({ 
    type: 'decimal', 
    precision: 10, 
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    }
  })
  monto: number;

  @Column({
    type: 'enum',
    enum: EstadoPago,
    default: EstadoPago.PENDIENTE
  })
  estado: EstadoPago;

  @Column({ type: 'jsonb' })
  datosTransaccion: DatosTransaccion;

  @Column({ type: 'text', nullable: true })
  notasReembolso: string;

  @Column({ type: 'jsonb', nullable: true })
  metadatos: Record<string, any>;

  @Column({ type: 'timestamp', nullable: true })
  fechaCompletado: Date;

  @Column({ type: 'timestamp', nullable: true })
  fechaReembolso: Date;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}