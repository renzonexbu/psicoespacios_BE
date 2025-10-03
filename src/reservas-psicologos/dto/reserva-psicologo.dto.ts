import { IsString, IsNotEmpty, IsUUID, IsOptional, IsEnum, IsDateString, IsNumber, IsObject, Matches, Min } from 'class-validator';
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
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'horaInicio debe tener el formato HH:MM (ej: 09:00, 14:30)'
  })
  horaInicio: string; // HH:MM

  @IsString()
  @IsNotEmpty()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'horaFin debe tener el formato HH:MM (ej: 09:00, 14:30)'
  })
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
  @IsUUID()
  cuponId?: string; // ID del cupón usado

  @IsOptional()
  @IsNumber()
  @Min(0)
  descuentoAplicado?: number; // Monto del descuento en pesos

  @IsOptional()
  @IsObject()
  metadatos?: {
    motivo?: string;
    duracion?: number;
    precio?: number;
    ubicacion?: string;
    link?: string;
    pagoId?: string; // ID del pago cuando se confirme
    cuponInfo?: {
      id: string;
      nombre: string;
      porcentaje: number;
      modalidad: string;
    };
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
  @IsUUID()
  cuponId?: string; // ID del cupón usado

  @IsOptional()
  @IsNumber()
  @Min(0)
  descuentoAplicado?: number; // Monto del descuento en pesos

  @IsOptional()
  @IsObject()
  metadatos?: {
    motivo?: string;
    duracion?: number;
    precio?: number;
    ubicacion?: string;
    link?: string;
    pagoId?: string; // ID del pago cuando se confirme
    cuponInfo?: {
      id: string;
      nombre: string;
      porcentaje: number;
      modalidad: string;
    };
    [key: string]: any;
  };
}

export class ReservaPsicologoResponseDto {
  id: string;
  psicologoId: string;
  psicologoNombre: string;
  pacienteId: string;
  pacienteNombre: string;
  pacienteFotoUrl?: string; // URL de la foto del paciente
  pacienteEmail?: string; // Email del paciente
  pacienteTelefono?: string; // Teléfono del paciente
  fecha: Date;
  horaInicio: string;
  horaFin: string;
  boxId?: string;
  boxNombre?: string; // Nombre del box
  boxSede?: string; // Nombre de la sede del box
  modalidad: ModalidadSesion;
  estado: EstadoReservaPsicologo;
  observaciones?: string;
  cuponId?: string; // ID del cupón usado
  descuentoAplicado?: number; // Monto del descuento aplicado
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

export class ActualizarPagoDto {
  @IsUUID()
  @IsNotEmpty()
  pagoId: string;
} 