import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('configuracion_sistema')
export class ConfiguracionSistema {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('jsonb')
  configuracionGeneral: {
    nombreSistema: string;
    logotipo?: string;
    colorPrimario: string;
    colorSecundario: string;
    contactoSoporte: string;
  };

  @Column('jsonb')
  configuracionReservas: {
    tiempoMinimoReserva: number;
    tiempoMaximoReserva: number;
    anticipacionMinima: number;
    anticipacionMaxima: number;
    intervaloHorario: number[];
  };

  @Column('jsonb')
  configuracionPagos: {
    moneda: string;
    comisionPlataforma: number;
    metodosHabilitados: string[];
    datosTransferencia?: {
      banco: string;
      tipoCuenta: string;
      numeroCuenta: string;
      titular: string;
      rut: string;
      email: string;
    };
  };

  @Column('jsonb')
  configuracionDerivacion: {
    especialidades: string[];
    modalidades: string[];
    tiempoMaximoRespuesta: number;
    comisionDerivacion: number;
  };

  @Column('jsonb')
  configuracionSuscripciones: {
    periodosRenovacion: number[];
    descuentosRenovacion: Array<{
      periodo: number;
      descuento: number;
    }>;
  };

  @Column('jsonb')
  configuracionNotificaciones: {
    emailsHabilitados: boolean;
    plantillasEmail: {
      [key: string]: {
        asunto: string;
        plantilla: string;
      };
    };
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}