import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum, IsOptional, IsDateString, Matches, IsUrl } from 'class-validator';

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
  @IsNotEmpty()
  @Matches(/^[0-9]{1,2}[.][0-9]{3}[.][0-9]{3}[-][0-9kK]{1}$/, { 
    message: 'RUT debe tener el formato XX.XXX.XXX-X' 
  })
  rut: string;

  @IsString()
  @IsNotEmpty()
  telefono: string;

  @IsDateString()
  @IsNotEmpty()
  fechaNacimiento: Date;

  @IsUrl()
  @IsOptional()
  fotoUrl?: string;

  @IsEnum(['PSICOLOGO', 'PACIENTE', 'ADMIN'])
  role: string;
}