import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ContactoEstado } from '../../common/entities/contacto.entity';

export class ResponderContactoDto {
  @IsString()
  @IsNotEmpty()
  respuesta: string;

  @IsEnum(ContactoEstado)
  @IsOptional()
  estado?: ContactoEstado;
}





