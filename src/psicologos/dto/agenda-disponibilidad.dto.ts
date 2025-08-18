import { IsString, IsOptional, IsNumber, IsDateString, IsUUID } from 'class-validator';

export class AgendaDisponibilidadDto {
  @IsUUID()
  psicologoId: string;

  @IsOptional()
  @IsUUID()
  sedeId?: string;

  @IsDateString()
  fechaInicio: string; // YYYY-MM-DD

  @IsDateString()
  fechaFin: string; // YYYY-MM-DD

  @IsOptional()
  @IsString()
  modalidad?: 'presencial' | 'online';
}

// Nuevo DTO para disponibilidad del psicólogo (sin boxes)
export class PsicologoDisponibilidadDto {
  @IsUUID()
  psicologoId: string;

  @IsDateString()
  fechaInicio: string; // YYYY-MM-DD

  @IsDateString()
  fechaFin: string; // YYYY-MM-DD

  @IsOptional()
  @IsString()
  modalidad?: 'online' | 'presencial';
}

export class DisponibilidadSlotDto {
  fecha: string;
  horaInicio: string;
  horaFin: string;
  disponible: boolean;
  boxId?: string;
  boxNumero?: string;
  sedeId?: string;
  sedeNombre?: string;
  modalidad: 'presencial' | 'online';
}

export class AgendaResponseDto {
  psicologoId: string;
  psicologoNombre: string;
  fechaInicio: string;
  fechaFin: string;
  slots: DisponibilidadSlotDto[];
  totalSlots: number;
  slotsDisponibles: number;
}

// Nuevo DTO de respuesta para disponibilidad del psicólogo
export class PsicologoDisponibilidadResponseDto {
  psicologoId: string;
  psicologoNombre: string;
  fechaInicio: string;
  fechaFin: string;
  slots: DisponibilidadSlotDto[];
  totalSlots: number;
  slotsDisponibles: number;
}

// DTO para obtener box disponible en un horario específico
export class BoxDisponibleDto {
  @IsUUID()
  psicologoId: string;

  @IsDateString()
  fecha: string; // YYYY-MM-DD

  @IsString()
  horaInicio: string; // HH:MM

  @IsUUID()
  sedeId: string;
}

// DTO de respuesta con información del box
export class BoxDisponibleResponseDto {
  boxId: string;
  boxNumero: string;
  sedeId: string;
  sedeNombre: string;
  sedeDireccion?: string;
  psicologoId: string;
  psicologoNombre: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  disponible: boolean;
}

// DTO de respuesta con información completa del box
export class BoxInfoResponseDto {
  id: string;
  numero: string;
  estado: string;
  urlImage?: string;
  sedeId: string;
  sedeNombre: string;
  sedeDireccion?: string;
  sedeTelefono?: string;
  sedeEmail?: string;
  createdAt: Date;
  updatedAt: Date;
} 