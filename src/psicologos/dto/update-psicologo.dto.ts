import { IsString, IsOptional, IsUrl, IsArray, ValidateNested, IsEnum, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { CreatePsicologoDto, ModalidadDto } from './create-psicologo.dto';

// Importamos desde el archivo de creación para mantener consistencia
export class UpdatePsicologoDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsUrl()
  fotoUrl?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ModalidadDto)
  modalidad?: ModalidadDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  especialidades?: string[];
}
