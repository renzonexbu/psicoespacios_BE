import { IsUUID, IsString, IsNumber, IsDateString, IsInt, Min, Max, IsNotEmpty } from 'class-validator';

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

  @IsUUID()
  psicologoId: string;

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

  @IsInt()
  @Min(1)
  limiteUsos?: number;

  @IsInt()
  @Min(0)
  usosActuales?: number;
} 