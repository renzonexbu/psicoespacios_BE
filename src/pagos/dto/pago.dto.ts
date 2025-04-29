import { IsNotEmpty, IsString, IsNumber, IsEnum, IsOptional, ValidateNested, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class DatosTarjetaDto {
  @IsString()
  @IsNotEmpty()
  ultimos4: string;

  @IsString()
  @IsNotEmpty()
  marca: string;
}

export class DatosTransferenciaDto {
  @IsString()
  @IsNotEmpty()
  banco: string;

  @IsString()
  @IsNotEmpty()
  numeroOperacion: string;
}

export class DatosTransaccionDto {
  @IsEnum(['TARJETA', 'TRANSFERENCIA'])
  @IsNotEmpty()
  metodoPago: string;

  @IsString()
  @IsOptional()
  referencia?: string;

  @ValidateNested()
  @Type(() => DatosTarjetaDto)
  @IsOptional()
  datosTarjeta?: DatosTarjetaDto;

  @ValidateNested()
  @Type(() => DatosTransferenciaDto)
  @IsOptional()
  datosTransferencia?: DatosTransferenciaDto;
}

export class CreatePagoDto {
  @IsEnum(['SUSCRIPCION', 'DERIVACION'])
  @IsNotEmpty()
  tipo: string;

  @IsUUID()
  @IsOptional()
  suscripcionId?: string;

  @IsUUID()
  @IsOptional()
  solicitudDerivacionId?: string;

  @IsNumber()
  @IsNotEmpty()
  monto: number;

  @ValidateNested()
  @Type(() => DatosTransaccionDto)
  @IsNotEmpty()
  datosTransaccion: DatosTransaccionDto;
}

export class UpdatePagoDto {
  @IsEnum(['PENDIENTE', 'PROCESANDO', 'COMPLETADO', 'FALLIDO', 'REEMBOLSADO'])
  @IsNotEmpty()
  estado: string;

  @IsString()
  @IsOptional()
  notasReembolso?: string;
}

export class ReembolsoPagoDto {
  @IsString()
  @IsNotEmpty()
  motivo: string;

  @IsNumber()
  @IsNotEmpty()
  montoReembolso: number;
}