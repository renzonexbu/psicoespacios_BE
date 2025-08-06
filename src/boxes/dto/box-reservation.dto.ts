import { IsUUID, IsDateString, IsString, IsNumber, IsEnum, IsNotEmpty } from 'class-validator';
import { EstadoReserva } from '../../common/entities/reserva.entity';

export class CreateBoxReservationDto {
  @IsUUID()
  @IsNotEmpty()
  boxId: string;

  @IsUUID()
  @IsNotEmpty()
  psicologoId: string;

  @IsDateString()
  @IsNotEmpty()
  fecha: string; // Formato "YYYY-MM-DD"

  @IsString()
  @IsNotEmpty()
  horaInicio: string; // Formato "HH:00" (ej: "09:00")

  @IsString()
  @IsNotEmpty()
  horaFin: string; // Formato "HH:00" (ej: "10:00")

  @IsNumber()
  @IsNotEmpty()
  precio: number;
}

export class UpdateBoxReservationDto {
  @IsEnum(EstadoReserva)
  @IsNotEmpty()
  estado: EstadoReserva;
}

export class BoxReservationResponseDto {
  id: string;
  boxId: string;
  psicologoId: string;
  fecha: Date;
  horaInicio: string;
  horaFin: string;
  estado: EstadoReserva;
  precio: number;
  createdAt: Date;
  updatedAt: Date;
} 