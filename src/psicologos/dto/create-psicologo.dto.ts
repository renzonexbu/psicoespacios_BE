import { IsString, IsUrl, IsArray, ValidateNested, IsEnum, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class ModalidadDto {
  @IsEnum(['Online', 'Presencial'])
  tipo: 'Online' | 'Presencial';

  @IsNumber()
  precio: number;
}

export class CreatePsicologoDto {
  @IsString()
  nombre: string;

  @IsUrl()
  fotoUrl?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ModalidadDto)
  modalidad: ModalidadDto[];

  @IsArray()
  @IsString({ each: true })
  especialidades: string[];
}
