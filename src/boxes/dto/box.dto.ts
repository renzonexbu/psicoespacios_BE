import { IsString, IsNumber, IsOptional, IsArray, IsUUID, IsIn, IsUrl } from 'class-validator';

export class CreateBoxDto {
  @IsString()
  numero: string;

  @IsString()
  @IsOptional()
  nombre?: string;

  @IsNumber()
  @IsOptional()
  capacidad?: number = 2;

  @IsNumber()
  precio: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  equipamiento?: string[];

  @IsString()
  @IsUrl()
  @IsOptional()
  urlImage?: string;

  @IsString()
  @IsIn(['DISPONIBLE', 'OCUPADO', 'MANTENIMIENTO', 'INACTIVO'])
  @IsOptional()
  estado?: string = 'DISPONIBLE';

  @IsUUID()
  @IsOptional()
  sedeId?: string;
}

export class UpdateBoxDto {
  @IsString()
  @IsOptional()
  numero?: string;

  @IsString()
  @IsOptional()
  nombre?: string;

  @IsNumber()
  @IsOptional()
  capacidad?: number;

  @IsNumber()
  @IsOptional()
  precio?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  equipamiento?: string[];

  @IsString()
  @IsUrl()
  @IsOptional()
  urlImage?: string;

  @IsString()
  @IsIn(['DISPONIBLE', 'OCUPADO', 'MANTENIMIENTO', 'INACTIVO'])
  @IsOptional()
  estado?: string;

  @IsUUID()
  @IsOptional()
  sedeId?: string;
} 