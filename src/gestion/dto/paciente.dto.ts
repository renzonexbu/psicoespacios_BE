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

  @IsString()
  @IsOptional()
  tag?: string;
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

  @IsString()
  @IsOptional()
  tag?: string;
}

export class PacienteWithUserDto {
  id: string;
  idUsuarioPaciente: string;
  idUsuarioPsicologo: string;
  primeraSesionRegistrada: Date;
  proximaSesion?: Date | null;
  estado?: string | null;
  tag?: string | null;
  usuario: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
    rut: string;
    telefono: string;
    fechaNacimiento: Date;
    fotoUrl?: string | null;
    direccion?: string | null;
    role: string;
    estado: string;
    createdAt: Date;
    updatedAt: Date;
  };
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