import { IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import { ContactoEstado } from '../../common/entities/contacto.entity';

export class UpdateContactoDto {
  @IsEnum(ContactoEstado)
  @IsOptional()
  estado?: ContactoEstado;
  
  @IsString()
  @IsOptional()
  respuesta?: string;
  
  @IsDateString()
  @IsOptional()
  fechaRespuesta?: Date;
}
