import { IsString, IsArray, IsOptional, IsNumber, IsEnum } from 'class-validator';

export class CreatePsicologoDto {
  @IsString()
  usuarioId: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  diagnosticos_experiencia?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  temas_experiencia?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  estilo_terapeutico?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  afinidad_paciente_preferida?: string[];

  @IsString()
  @IsOptional()
  genero?: string;

  @IsString()
  @IsOptional()
  numeroRegistroProfesional?: string;

  @IsNumber()
  @IsOptional()
  experiencia?: number;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsNumber()
  @IsOptional()
  precioPresencial?: number;

  @IsNumber()
  @IsOptional()
  precioOnline?: number;

  @IsOptional()
  disponibilidad?: any;
}

export class UpdatePsicologoDto {
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  diagnosticos_experiencia?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  temas_experiencia?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  estilo_terapeutico?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  afinidad_paciente_preferida?: string[];

  @IsString()
  @IsOptional()
  genero?: string;

  @IsString()
  @IsOptional()
  numeroRegistroProfesional?: string;

  @IsNumber()
  @IsOptional()
  experiencia?: number;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsNumber()
  @IsOptional()
  precioPresencial?: number;

  @IsNumber()
  @IsOptional()
  precioOnline?: number;

  @IsOptional()
  disponibilidad?: any;
}

export class PsicologoPublicDto {
  id: string;
  diagnosticos_experiencia: string[];
  temas_experiencia: string[];
  estilo_terapeutico: string[];
  afinidad_paciente_preferida: string[];
  genero: string;
  numeroRegistroProfesional?: string;
  experiencia?: number;
  descripcion?: string;
  precioPresencial?: number;
  precioOnline?: number;
  disponibilidad?: any;
  // Información básica del usuario (sin datos sensibles)
  usuario: {
    id: string;
    nombre: string;
    apellido: string;
    fotoUrl?: string;
    especialidad?: string;
    experiencia?: string;
    estado: string;
  };
  // NO incluir: password, rut, telefono, fechaNacimiento, direccion, timestamps
}
