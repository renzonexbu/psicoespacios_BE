import { IsUUID, IsString, IsNumber, IsDateString, IsInt, Min, Max, IsNotEmpty, IsBoolean, ValidateIf, IsOptional } from 'class-validator';

export class CreateVoucherDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  porcentaje: number;

  @IsDateString()
  vencimiento: string;

  @IsString()
  modalidad: string;

  @IsBoolean()
  @IsOptional()
  esGlobal?: boolean; // Si es true, el cupón aplica a todos los psicólogos

  @ValidateIf((o) => !o.esGlobal)
  @IsUUID()
  psicologoUserId?: string; // Requerido solo si no es global

  @IsInt()
  @Min(1)
  limiteUsos: number;
}

export class UpdateVoucherDto {
  @IsString()
  nombre?: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  porcentaje?: number;

  @IsDateString()
  vencimiento?: string;

  @IsString()
  modalidad?: string;

  @IsBoolean()
  esGlobal?: boolean;

  @IsInt()
  @Min(1)
  limiteUsos?: number;

  @IsInt()
  @Min(0)
  usosActuales?: number;
} 