import { IsNotEmpty, IsString, IsUUID, IsOptional, IsNumber, IsDateString } from 'class-validator';

export class CreateSolicitudDerivacionDto {
  @IsUUID()
  @IsNotEmpty()
  pacienteId: string;

  @IsUUID()
  @IsNotEmpty()
  psicologoDestinoId: string;

  @IsString()
  @IsNotEmpty()
  motivoDerivacion: string;

  @IsString()
  @IsOptional()
  notasAdicionales?: string;
}

export class UpdateSolicitudDerivacionDto {
  @IsString()
  @IsOptional()
  estado?: string;

  @IsString()
  @IsOptional()
  motivoRechazo?: string;

  @IsDateString()
  @IsOptional()
  fechaPrimeraSesion?: string;

  @IsNumber()
  @IsOptional()
  montoPrimeraSesion?: number;
}

export class PagoSesionDto {
  @IsNumber()
  @IsNotEmpty()
  monto: number;

  @IsNotEmpty()
  datosPago: any;
}