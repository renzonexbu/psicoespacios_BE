import { IsString, IsNotEmpty, IsUUID, IsOptional, IsEnum, IsBoolean, IsObject } from 'class-validator';
import { TipoNota } from '../../common/entities/nota.entity';

export class CreateNotaDto {
  @IsUUID()
  @IsNotEmpty()
  pacienteId: string;

  @IsString()
  @IsNotEmpty()
  contenido: string;

  @IsOptional()
  @IsString()
  titulo?: string;

  @IsOptional()
  @IsEnum(TipoNota)
  tipo?: TipoNota;

  @IsOptional()
  @IsBoolean()
  esPrivada?: boolean;

  @IsOptional()
  @IsObject()
  metadatos?: {
    tags?: string[];
    prioridad?: 'baja' | 'media' | 'alta';
    estado?: 'borrador' | 'completada' | 'archivada';
    fechaSesion?: string;
    [key: string]: any;
  };
}

export class UpdateNotaDto {
  @IsOptional()
  @IsString()
  contenido?: string;

  @IsOptional()
  @IsString()
  titulo?: string;

  @IsOptional()
  @IsEnum(TipoNota)
  tipo?: TipoNota;

  @IsOptional()
  @IsBoolean()
  esPrivada?: boolean;

  @IsOptional()
  @IsObject()
  metadatos?: {
    tags?: string[];
    prioridad?: 'baja' | 'media' | 'alta';
    estado?: 'borrador' | 'completada' | 'archivada';
    fechaSesion?: string;
    [key: string]: any;
  };
}

export class NotaResponseDto {
  id: string;
  pacienteId: string;
  pacienteNombre: string;
  contenido: string;
  titulo?: string;
  tipo: TipoNota;
  esPrivada: boolean;
  metadatos?: any;
  createdAt: Date;
  updatedAt: Date;
}

export class QueryNotasDto {
  @IsOptional()
  @IsUUID()
  pacienteId?: string;

  @IsOptional()
  @IsEnum(TipoNota)
  tipo?: TipoNota;

  @IsOptional()
  @IsString()
  search?: string; // Para buscar en contenido y título

  @IsOptional()
  @IsString()
  fechaDesde?: string; // YYYY-MM-DD

  @IsOptional()
  @IsString()
  fechaHasta?: string; // YYYY-MM-DD

  @IsOptional()
  @IsString()
  prioridad?: 'baja' | 'media' | 'alta';

  @IsOptional()
  @IsString()
  estado?: 'borrador' | 'completada' | 'archivada';
} 