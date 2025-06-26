import { IsUUID, IsArray, IsString, IsOptional, IsNumber, IsIn } from 'class-validator';

export class CreatePsicologoDto {
  @IsUUID()
  usuarioId: string;

  @IsArray()
  @IsString({ each: true })
  diagnosticos_experiencia: string[];

  @IsArray()
  @IsString({ each: true })
  temas_experiencia: string[];

  @IsArray()
  @IsString({ each: true })
  estilo_terapeutico: string[];

  @IsArray()
  @IsString({ each: true })
  afinidad_paciente_preferida: string[];

  @IsString()
  @IsIn(['M', 'F'])
  genero: string;

  @IsOptional()
  @IsString()
  numeroRegistroProfesional?: string;

  @IsOptional()
  @IsNumber()
  experiencia?: number;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  modalidades?: string[];

  @IsOptional()
  disponibilidad?: any;
}

export class UpdatePsicologoDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  diagnosticos_experiencia?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  temas_experiencia?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  estilo_terapeutico?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  afinidad_paciente_preferida?: string[];

  @IsOptional()
  @IsString()
  @IsIn(['M', 'F'])
  genero?: string;

  @IsOptional()
  @IsString()
  numeroRegistroProfesional?: string;

  @IsOptional()
  @IsNumber()
  experiencia?: number;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  modalidades?: string[];

  @IsOptional()
  disponibilidad?: any;
}
