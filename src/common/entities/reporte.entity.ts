import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';

export enum TipoReporte {
  OCUPACION = 'OCUPACION',
  INGRESOS = 'INGRESOS',
  PACIENTES = 'PACIENTES',
  DERIVACIONES = 'DERIVACIONES',
  PERSONALIZADO = 'PERSONALIZADO',
  SESIONES = 'SESIONES',
  PAGOS = 'PAGOS'
}

export enum FormatoReporte {
  PDF = 'PDF',
  EXCEL = 'EXCEL',
  CSV = 'CSV'
}

export enum EstadoReporte {
  PENDIENTE = 'PENDIENTE',
  GENERANDO = 'GENERANDO',
  COMPLETADO = 'COMPLETADO',
  ERROR = 'ERROR'
}

interface ParametrosReporte {
  fechaInicio: Date;
  fechaFin: Date;
  filtros?: Record<string, any>;
  agrupamiento?: string[];
  ordenamiento?: string[];
}

@Entity('reportes')
export class Reporte {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: false })
  usuario: User;

  @Column({
    type: 'enum',
    enum: TipoReporte
  })
  tipo: TipoReporte;

  @Column({ type: 'jsonb' })
  parametros: ParametrosReporte;

  @Column({ type: 'jsonb' })
  resultados: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @Column({
    type: 'enum',
    enum: FormatoReporte,
    nullable: true
  })
  formatoExportacion: FormatoReporte;

  @Column({ type: 'bytea', nullable: true })
  archivoGenerado: Buffer;

  @Column({
    type: 'enum',
    enum: EstadoReporte,
    default: EstadoReporte.PENDIENTE
  })
  estado: EstadoReporte;

  @Column({ type: 'text', nullable: true })
  mensajeError: string;

  @Column({ type: 'int', default: 0 })
  intentosGeneracion: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  fechaGeneracion: Date;
}