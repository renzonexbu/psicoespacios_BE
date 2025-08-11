import { IsEnum, IsString, IsUrl } from 'class-validator';
import { TipoDocumento } from '../../common/entities';

export class UploadDocumentoDto {
  @IsEnum(TipoDocumento)
  tipo: TipoDocumento;

  @IsString()
  nombre: string;

  @IsUrl()
  urlDocumento: string;
} 