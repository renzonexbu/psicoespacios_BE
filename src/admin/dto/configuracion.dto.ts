import { IsNotEmpty, IsString, IsNumber, IsArray, IsOptional, IsBoolean, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

class ConfiguracionGeneralDto {
  @IsString()
  @IsNotEmpty()
  nombreSistema: string;

  @IsString()
  @IsOptional()
  logotipo?: string;

  @IsString()
  @IsNotEmpty()
  colorPrimario: string;

  @IsString()
  @IsNotEmpty()
  colorSecundario: string;

  @IsString()
  @IsNotEmpty()
  contactoSoporte: string;
}

class ConfiguracionReservasDto {
  @IsNumber()
  @IsNotEmpty()
  tiempoMinimoReserva: number;

  @IsNumber()
  @IsNotEmpty()
  tiempoMaximoReserva: number;

  @IsNumber()
  @IsNotEmpty()
  anticipacionMinima: number;

  @IsNumber()
  @IsNotEmpty()
  anticipacionMaxima: number;

  @IsArray()
  @IsNumber({}, { each: true })
  @IsNotEmpty()
  intervaloHorario: number[];
}

class DatosTransferenciaDto {
  @IsString()
  @IsNotEmpty()
  banco: string;

  @IsString()
  @IsNotEmpty()
  tipoCuenta: string;

  @IsString()
  @IsNotEmpty()
  numeroCuenta: string;

  @IsString()
  @IsNotEmpty()
  titular: string;

  @IsString()
  @IsNotEmpty()
  rut: string;

  @IsString()
  @IsNotEmpty()
  email: string;
}

class ConfiguracionPagosDto {
  @IsString()
  @IsNotEmpty()
  moneda: string;

  @IsNumber()
  @IsNotEmpty()
  comisionPlataforma: number;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  metodosHabilitados: string[];

  @ValidateNested()
  @Type(() => DatosTransferenciaDto)
  @IsOptional()
  datosTransferencia?: DatosTransferenciaDto;
}

class ConfiguracionDerivacionDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  especialidades: string[];

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  modalidades: string[];

  @IsNumber()
  @IsNotEmpty()
  tiempoMaximoRespuesta: number;

  @IsNumber()
  @IsNotEmpty()
  comisionDerivacion: number;
}

class DescuentoRenovacionDto {
  @IsNumber()
  @IsNotEmpty()
  periodo: number;

  @IsNumber()
  @IsNotEmpty()
  descuento: number;
}

class ConfiguracionSuscripcionesDto {
  @IsArray()
  @IsNumber({}, { each: true })
  @IsNotEmpty()
  periodosRenovacion: number[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DescuentoRenovacionDto)
  @IsNotEmpty()
  descuentosRenovacion: DescuentoRenovacionDto[];
}

class PlantillaEmailDto {
  @IsString()
  @IsNotEmpty()
  asunto: string;

  @IsString()
  @IsNotEmpty()
  plantilla: string;
}

class ConfiguracionNotificacionesDto {
  @IsBoolean()
  @IsNotEmpty()
  emailsHabilitados: boolean;

  @IsObject()
  @IsNotEmpty()
  plantillasEmail: {
    [key: string]: PlantillaEmailDto;
  };
}

export class UpdateConfiguracionDto {
  @ValidateNested()
  @Type(() => ConfiguracionGeneralDto)
  @IsOptional()
  configuracionGeneral?: ConfiguracionGeneralDto;

  @ValidateNested()
  @Type(() => ConfiguracionReservasDto)
  @IsOptional()
  configuracionReservas?: ConfiguracionReservasDto;

  @ValidateNested()
  @Type(() => ConfiguracionPagosDto)
  @IsOptional()
  configuracionPagos?: ConfiguracionPagosDto;

  @ValidateNested()
  @Type(() => ConfiguracionDerivacionDto)
  @IsOptional()
  configuracionDerivacion?: ConfiguracionDerivacionDto;

  @ValidateNested()
  @Type(() => ConfiguracionSuscripcionesDto)
  @IsOptional()
  configuracionSuscripciones?: ConfiguracionSuscripcionesDto;

  @ValidateNested()
  @Type(() => ConfiguracionNotificacionesDto)
  @IsOptional()
  configuracionNotificaciones?: ConfiguracionNotificacionesDto;
}