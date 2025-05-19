import { IsEnum, IsOptional } from 'class-validator';
import { ContactoEstado } from '../../common/entities/contacto.entity';

export class UpdateContactoDto {
  @IsEnum(ContactoEstado)
  @IsOptional()
  estado?: ContactoEstado;
}
