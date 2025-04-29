import { IsString, IsArray, IsBoolean, IsOptional, IsNotEmpty, IsNumber, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum Modalidad {
  PRESENCIAL = 'PRESENCIAL',
  ONLINE = 'ONLINE',
  HIBRIDA = 'HIBRIDA'
}

class HorarioAtencionDto {
  @IsArray()
  @IsString({ each: true })
  dias: string[];

  @IsString()
  horaInicio: string;

  @IsString()
  horaFin: string;
}

export class CreatePerfilDerivacionDto {
  @IsString()
  @IsNotEmpty()
  descripcion: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  especialidades: string[];

  @IsArray()
  @IsEnum(Modalidad, { each: true })
  @IsNotEmpty()
  modalidades: Modalidad[];

  @IsBoolean()
  @IsOptional()
  disponible?: boolean = true;

  @ValidateNested()
  @Type(() => HorarioAtencionDto)
  @IsNotEmpty()
  horariosAtencion: HorarioAtencionDto;

  @IsNumber()
  @IsNotEmpty()
  tarifaHora: number;
}

export class UpdatePerfilDerivacionDto extends CreatePerfilDerivacionDto {
  @IsOptional()
  declare descripcion: string;

  @IsOptional()
  declare especialidades: string[];

  @IsOptional()
  declare modalidades: Modalidad[];

  @IsOptional()
  declare horariosAtencion: HorarioAtencionDto;

  @IsOptional()
  declare tarifaHora: number;
}

export class SearchPerfilDerivacionDto {
  @IsOptional()
  @IsString()
  especialidad?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  especialidades?: string[];

  @IsOptional()
  @IsArray()
  @IsEnum(Modalidad, { each: true })
  modalidades?: Modalidad[];

  @IsOptional()
  @IsBoolean()
  disponible?: boolean;
}