import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Suscripcion } from './suscripcion.entity';
import { SolicitudDerivacion } from './solicitud-derivacion.entity';
import { Voucher } from './voucher.entity';

export enum TipoPago {
  SUSCRIPCION = 'SUSCRIPCION',
  DERIVACION = 'DERIVACION',
  SESION = 'SESION',
  RESERVA = 'RESERVA'
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

  @ManyToOne(() => Voucher, { nullable: true })
  @JoinColumn({ name: 'cuponId' })
  cupon: Voucher;

  @Column({ type: 'uuid', nullable: true })
  cuponId: string;

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
    type: 'decimal', 
    precision: 10, 
    scale: 2,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    }
  })
  descuentoAplicado: number;

  @Column({ 
    type: 'decimal', 
    precision: 10, 
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    }
  })
  montoFinal: number;

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

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}