import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ContactoTipo } from '../../common/entities/contacto.entity';

export class CreateContactoDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsEnum(ContactoTipo)
  @IsNotEmpty()
  tipo: ContactoTipo;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsString()
  @IsNotEmpty()
  mensaje: string;
}
