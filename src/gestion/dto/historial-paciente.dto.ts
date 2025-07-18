import { IsUUID, IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateHistorialPacienteDto {
  @IsString()
  @IsNotEmpty()
  tipo: string;

  @IsUUID()
  @IsNotEmpty()
  idUsuarioPaciente: string;

  @IsString()
  @IsNotEmpty()
  descripcion: string;

  @IsString()
  @IsOptional()
  url?: string;
}

export class UpdateHistorialPacienteDto {
  @IsString()
  tipo?: string;

  @IsUUID()
  idUsuarioPaciente?: string;

  @IsString()
  descripcion?: string;

  @IsString()
  @IsOptional()
  url?: string;
} 