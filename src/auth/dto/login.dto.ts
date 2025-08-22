import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { 
    message: 'El correo electrónico debe tener un formato válido (ejemplo: usuario@dominio.com)' 
  })
  @IsNotEmpty({ 
    message: 'El correo electrónico es obligatorio' 
  })
  email: string;

  @IsNotEmpty({ 
    message: 'La contraseña es obligatoria' 
  })
  @MinLength(6, { 
    message: 'La contraseña debe tener al menos 6 caracteres' 
  })
  password: string;
}