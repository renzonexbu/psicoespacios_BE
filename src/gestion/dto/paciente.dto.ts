import { IsNotEmpty, IsString, IsOptional, IsDateString } from 'class-validator';

export class CreatePacienteDto {
  @IsString()
  @IsNotEmpty()
  idUsuarioPaciente: string;

  @IsString()
  @IsNotEmpty()
  idUsuarioPsicologo: string;

  @IsDateString()
  @IsNotEmpty()
  primeraSesionRegistrada: string;

  @IsDateString()
  @IsOptional()
  proximaSesion?: string;

  @IsString()
  @IsOptional()
  estado?: string;
}

export class UpdatePacienteDto {
  @IsString()
  @IsOptional()
  idUsuarioPaciente?: string;

  @IsString()
  @IsOptional()
  idUsuarioPsicologo?: string;

  @IsDateString()
  @IsOptional()
  primeraSesionRegistrada?: string;

  @IsDateString()
  @IsOptional()
  proximaSesion?: string;

  @IsString()
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