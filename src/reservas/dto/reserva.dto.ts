import { IsUUID, IsDateString, IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateReservaDto {
  @IsOptional()
  @IsUUID()
  boxId?: string;

  @IsUUID()
  pacienteId: string;

  @IsUUID()
  psicologoId: string;

  @IsDateString()
  fecha: string;

  @IsString()
  horario: string;

  @IsNumber()
  precio: number;

  @IsOptional()
  @IsString()
  estado?: string;
}

export class UpdateReservaDto {
  @IsOptional()
  @IsString()
  estado?: string;
}