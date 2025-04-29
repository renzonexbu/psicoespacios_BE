import { IsNotEmpty, IsString, IsEmail, IsDateString, IsEnum, IsOptional } from 'class-validator';

export class CreatePacienteDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  apellido: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  telefono: string;

  @IsDateString()
  @IsNotEmpty()
  fechaNacimiento: string;

  @IsString()
  @IsOptional()
  notas?: string;
}

export class UpdatePacienteDto extends CreatePacienteDto {
  @IsEnum(['ACTIVO', 'INACTIVO', 'DERIVADO'])
  @IsOptional()
  estado?: string;
}

export class CreateFichaSesionDto {
  @IsDateString()
  @IsNotEmpty()
  fechaSesion: string;

  @IsString()
  @IsNotEmpty()
  motivo: string;

  @IsString()
  @IsNotEmpty()
  observaciones: string;

  @IsString()
  @IsOptional()
  tareas?: string;

  @IsString()
  @IsOptional()
  acuerdos?: string;

  @IsOptional()
  documentosAdjuntos?: any[];

  @IsDateString()
  @IsOptional()
  proximaSesion?: string;
}