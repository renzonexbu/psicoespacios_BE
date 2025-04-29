import { IsNotEmpty, IsUUID, IsOptional, IsString, IsNumber, IsEnum, IsObject, ValidateNested } from 'class-validator';
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
}

export class RenovarSuscripcionDto {
  @IsNumber()
  @IsNotEmpty()
  precioTotal: number;

  @ValidateNested()
  @Type(() => DatosPagoDto)
  @IsOptional()
  datosPago?: DatosPagoDto;
}