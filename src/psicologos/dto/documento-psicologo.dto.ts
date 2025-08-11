import { IsEnum, IsString, IsOptional } from 'class-validator';
import { TipoDocumento } from '../../common/entities';

export class CreateDocumentoPsicologoDto {
  @IsEnum(TipoDocumento)
  tipo: TipoDocumento;

  @IsString()
  nombre: string;

  @IsOptional()
  @IsString()
  urlDocumento?: string;
}

export class UpdateDocumentoPsicologoDto {
  @IsOptional()
  @IsEnum(TipoDocumento)
  tipo?: TipoDocumento;

  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  urlDocumento?: string;
}

export class DocumentoPsicologoResponseDto {
  id: string;
  tipo: TipoDocumento;
  nombre: string;
  urlDocumento?: string;
  createdAt: Date;
  updatedAt: Date;
  psicologo?: {
    id: string;
  };
} 