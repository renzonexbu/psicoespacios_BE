import { IsString, IsNotEmpty, IsUUID, IsOptional, IsEnum, IsDateString, IsNumber, IsObject } from 'class-validator';
import { EstadoReservaPsicologo, ModalidadSesion } from '../../common/entities/reserva-psicologo.entity';

export class CreateReservaPsicologoDto {
  @IsUUID()
  @IsNotEmpty()
  psicologoId: string;

  @IsUUID()
  @IsNotEmpty()
  pacienteId: string;

  @IsDateString()
  @IsNotEmpty()
  fecha: string; // YYYY-MM-DD

  @IsString()
  @IsNotEmpty()
  horaInicio: string; // HH:MM

  @IsString()
  @IsNotEmpty()
  horaFin: string; // HH:MM

  @IsOptional()
  @IsUUID()
  boxId?: string; // Para sesiones presenciales

  @IsOptional()
  @IsEnum(ModalidadSesion)
  modalidad?: ModalidadSesion;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsOptional()
  @IsObject()
  metadatos?: {
    motivo?: string;
    duracion?: number;
    precio?: number;
    ubicacion?: string;
    link?: string;
    [key: string]: any;
  };
}

export class UpdateReservaPsicologoDto {
  @IsOptional()
  @IsDateString()
  fecha?: string;

  @IsOptional()
  @IsString()
  horaInicio?: string;

  @IsOptional()
  @IsString()
  horaFin?: string;

  @IsOptional()
  @IsUUID()
  boxId?: string;

  @IsOptional()
  @IsEnum(ModalidadSesion)
  modalidad?: ModalidadSesion;

  @IsOptional()
  @IsEnum(EstadoReservaPsicologo)
  estado?: EstadoReservaPsicologo;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsOptional()
  @IsObject()
  metadatos?: {
    motivo?: string;
    duracion?: number;
    precio?: number;
    ubicacion?: string;
    link?: string;
    [key: string]: any;
  };
}

export class ReservaPsicologoResponseDto {
  id: string;
  psicologoId: string;
  psicologoNombre: string;
  pacienteId: string;
  pacienteNombre: string;
  fecha: Date;
  horaInicio: string;
  horaFin: string;
  boxId?: string;
  modalidad: ModalidadSesion;
  estado: EstadoReservaPsicologo;
  observaciones?: string;
  metadatos?: any;
  createdAt: Date;
  updatedAt: Date;
}

export class QueryReservasPsicologoDto {
  @IsOptional()
  @IsUUID()
  psicologoId?: string;

  @IsOptional()
  @IsUUID()
  pacienteId?: string;

  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @IsOptional()
  @IsDateString()
  fechaHasta?: string;

  @IsOptional()
  @IsEnum(ModalidadSesion)
  modalidad?: ModalidadSesion;

  @IsOptional()
  @IsEnum(EstadoReservaPsicologo)
  estado?: EstadoReservaPsicologo;
} 