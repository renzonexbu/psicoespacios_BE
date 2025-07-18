import { IsUUID, IsString, IsOptional, IsDateString } from 'class-validator';

export class CreatePacienteMatchingDto {
  @IsUUID()
  idUsuarioPaciente: string;

  @IsUUID()
  idUsuarioPsicologo: string;

  @IsDateString()
  primeraSesionRegistrada: string;

  @IsDateString()
  @IsOptional()
  proximaSesion?: string;

  @IsString()
  @IsOptional()
  estado?: string;
}

export class UpdatePacienteMatchingDto {
  @IsUUID()
  @IsOptional()
  idUsuarioPaciente?: string;

  @IsUUID()
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
