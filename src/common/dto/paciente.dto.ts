import { IsUUID, IsArray, IsString, IsOptional, IsObject } from 'class-validator';

export class CreatePacienteMatchingDto {
  @IsUUID()
  usuarioId: string;

  @IsArray()
  @IsString({ each: true })
  diagnosticos: string[];

  @IsArray()
  @IsString({ each: true })
  temas: string[];

  @IsArray()
  @IsString({ each: true })
  estilo_esperado: string[];

  @IsArray()
  @IsString({ each: true })
  afinidad: string[];

  @IsOptional()
  @IsObject()
  preferencias?: {
    genero_psicologo?: string;
    modalidad?: string;
  };

  @IsOptional()
  @IsString()
  notas?: string;
}

export class UpdatePacienteMatchingDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  diagnosticos?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  temas?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  estilo_esperado?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  afinidad?: string[];

  @IsOptional()
  @IsObject()
  preferencias?: {
    genero_psicologo?: string;
    modalidad?: string;
  };

  @IsOptional()
  @IsString()
  notas?: string;
}
