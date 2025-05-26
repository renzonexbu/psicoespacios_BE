import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum, IsOptional, IsDateString, Matches } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsOptional()
  @Matches(/^[0-9]{1,2}[.][0-9]{3}[.][0-9]{3}[-][0-9kK]{1}$/, { 
    message: 'RUT debe tener el formato XX.XXX.XXX-X' 
  })
  rut?: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsDateString()
  @IsOptional()
  fechaNacimiento?: Date;

  @IsEnum(['PSICOLOGO', 'USUARIO', 'ADMIN'])
  role: string;
}