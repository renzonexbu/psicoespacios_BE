import { IsString, IsEmail, IsDateString, IsNotEmpty, MinLength, MaxLength, IsOptional } from 'class-validator';

export class CrearPacienteDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  nombre: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  apellido: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(12)
  rut: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsDateString()
  @IsNotEmpty()
  fechaNacimiento: string; // YYYY-MM-DD

  // Campos de dirección (opcionales)
  @IsString()
  @IsOptional()
  calleNumero?: string;

  @IsString()
  @IsOptional()
  observacionDireccion?: string;

  @IsString()
  @IsOptional()
  region?: string;

  @IsString()
  @IsOptional()
  comuna?: string;

  @IsString()
  @IsOptional()
  compania?: string;
}
