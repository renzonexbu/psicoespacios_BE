import { IsArray, IsBoolean, IsDateString, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CrearPackDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsInt()
  @Min(1)
  horas: number;

  @Min(0)
  precio: number;
}

export class HorarioAsignacionDto {
  @IsInt()
  @Min(1)
  @Max(7)
  diaSemana: number; // 1=Lunes, 7=Domingo

  @IsString()
  horaInicio: string; // HH:MM

  @IsString()
  horaFin: string; // HH:MM

  @IsUUID()
  boxId: string;
}

export class AsignarPackDto {
  @IsUUID()
  packId: string;

  @IsUUID()
  usuarioId: string;

  @IsBoolean()
  @IsOptional()
  recurrente?: boolean = true;

  @IsDateString()
  @IsOptional()
  fechaLimite?: string; // Fecha límite para generar reservas (formato ISO: YYYY-MM-DD)

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HorarioAsignacionDto)
  horarios: HorarioAsignacionDto[];
}

export class CancelarAsignacionDto {
  @IsUUID()
  asignacionId: string;
}

export class CancelarPackDto {
  @IsUUID()
  asignacionId: string;
}

export class MarcarPagoMensualDto {
  @IsUUID()
  pagoId: string;

  @Min(0)
  montoPagado: number;

  @IsString()
  @IsOptional()
  metodoPago?: string;

  @IsString()
  @IsOptional()
  referenciaPago?: string;

  @IsString()
  @IsOptional()
  observaciones?: string;
}

export class ReembolsarPagoMensualDto {
  @IsUUID()
  pagoId: string;

  @Min(0)
  montoReembolsado: number;

  @IsString()
  @IsOptional()
  observaciones?: string;
}




