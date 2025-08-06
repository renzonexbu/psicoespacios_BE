import { IsUUID, IsDateString, IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { EstadoReserva } from '../../common/entities/reserva.entity';

export class CreateReservaDto {
  @IsUUID()
  boxId: string;

  @IsUUID()
  psicologoId: string;

  @IsDateString()
  fecha: string;

  @IsString()
  horaInicio: string;

  @IsString()
  horaFin: string;

  @IsNumber()
  precio: number;

  @IsOptional()
  @IsEnum(EstadoReserva)
  estado?: EstadoReserva;
}

export class UpdateReservaDto {
  @IsOptional()
  @IsEnum(EstadoReserva)
  estado?: EstadoReserva;
}