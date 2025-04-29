import { IsNotEmpty, IsUUID, IsDateString, IsEnum, IsOptional, IsString, IsNumber } from 'class-validator';

enum TipoReserva {
  HORA = 'HORA',
  JORNADA = 'JORNADA'
}

enum EstadoReserva {
  PENDIENTE = 'PENDIENTE',
  CONFIRMADA = 'CONFIRMADA',
  CANCELADA = 'CANCELADA'
}

export class CreateReservaDto {
  @IsUUID()
  @IsNotEmpty()
  boxId: string;

  @IsDateString()
  @IsNotEmpty()
  fechaInicio: string;

  @IsDateString()
  @IsNotEmpty()
  fechaFin: string;

  @IsEnum(TipoReserva)
  @IsNotEmpty()
  tipo: TipoReserva;

  @IsNumber()
  @IsNotEmpty()
  precio: number;
}

export class UpdateReservaDto {
  @IsEnum(EstadoReserva)
  @IsOptional()
  estado?: EstadoReserva;

  @IsString()
  @IsOptional()
  notasCancelacion?: string;
}