import { IsString, IsBoolean, IsOptional, IsArray, ValidateNested, IsUrl } from 'class-validator';
import { Type } from 'class-transformer';

class HorarioAtencionDto {
  @IsString()
  dia: string;

  @IsString()
  inicio: string;

  @IsString()
  fin: string;

  @IsBoolean()
  cerrado: boolean;
}

class HorarioAtencionWrapperDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HorarioAtencionDto)
  diasHabiles: HorarioAtencionDto[];
}

export class CreateSedeDto {
  @IsString()
  nombre: string;

  @IsString()
  description: string;

  @IsString()
  direccion: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsOptional()
  thumbnailUrl?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  features?: string[];

  @ValidateNested()
  @Type(() => HorarioAtencionWrapperDto)
  @IsOptional()
  horarioAtencion?: HorarioAtencionWrapperDto;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  serviciosDisponibles?: string[];

  @IsString()
  @IsOptional()
  estado?: string = 'ACTIVA';
}

export class UpdateSedeDto extends CreateSedeDto {
  @IsOptional()
  declare nombre: string;

  @IsOptional()
  declare description: string;

  @IsOptional()
  declare direccion: string;
}