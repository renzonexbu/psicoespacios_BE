import { IsNotEmpty, IsUUID, IsOptional, IsString, IsNumber, IsEnum, IsObject, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export enum EstadoSuscripcion {
  PENDIENTE_PAGO = 'PENDIENTE_PAGO',
  ACTIVA = 'ACTIVA',
  CANCELADA = 'CANCELADA',
  VENCIDA = 'VENCIDA'
}

class DatosPagoDto {
  @IsString()
  @IsNotEmpty()
  metodoPago: string;

  @IsString()
  @IsNotEmpty()
  referencia: string;

  @IsObject()
  @IsOptional()
  metadatos?: Record<string, any>;
}

export class CreateSuscripcionDto {
  @IsUUID()
  @IsNotEmpty()
  planId: string;

  @IsNumber()
  @IsNotEmpty()
  precioTotal: number;

  @IsOptional()
  @IsBoolean()
  renovacionAutomatica?: boolean;

  @IsOptional()
  @IsString()
  metodoPago?: string;

  @IsOptional()
  @IsString()
  referenciaPago?: string;

  @IsOptional()
  @IsString()
  codigoDescuento?: string;

  @ValidateNested()
  @Type(() => DatosPagoDto)
  @IsOptional()
  datosPago?: DatosPagoDto;
}

export class UpdateSuscripcionDto {
  @IsEnum(EstadoSuscripcion)
  @IsOptional()
  estado?: EstadoSuscripcion;

  @IsString()
  @IsOptional()
  notasCancelacion?: string;

  @IsBoolean()
  @IsOptional()
  renovacionAutomatica?: boolean;

  @IsBoolean()
  @IsOptional()
  notificacionesHabilitadas?: boolean;
}

export class ConfigurarRenovacionDto {
  @IsBoolean()
  @IsNotEmpty()
  renovacionAutomatica: boolean;
}

export class RenovarSuscripcionDto {
  @IsNumber()
  @IsNotEmpty()
  precioTotal: number;

  @IsOptional()
  @IsString()
  metodoPago?: string;

  @IsOptional()
  @IsString()
  referenciaPago?: string;

  @ValidateNested()
  @Type(() => DatosPagoDto)
  @IsOptional()
  datosPago?: DatosPagoDto;
}

export class ActivarSuscripcionDto {
  @IsOptional()
  @IsObject()
  datosPago?: {
    metodo?: string;
    referencia?: string;
    metadatos?: Record<string, any>;
  };
}