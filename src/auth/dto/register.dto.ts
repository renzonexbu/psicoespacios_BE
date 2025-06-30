import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum, IsOptional, IsDateString, Matches, IsUrl } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  apellido: string;

  // Alias compatibility for firstName/lastName
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  get firstName(): string {
    return this.nombre;
  }
  set firstName(value: string) {
    this.nombre = value;
  }

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  get lastName(): string {
    return this.apellido;
  }
  set lastName(value: string) {
    this.apellido = value;
  }

  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]{1,2}[.][0-9]{3}[.][0-9]{3}[-][0-9kK]{1}$/, { 
    message: 'RUT debe tener el formato XX.XXX.XXX-X' 
  })
  rut: string;

  @IsString()
  @IsNotEmpty()
  telefono: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/, {
    message: 'fechaNacimiento debe ser una fecha válida en formato YYYY-MM-DD o ISO 8601 completo'
  })
  fechaNacimiento: string;

  @IsUrl()
  @IsOptional()
  fotoUrl?: string;

  @IsEnum(['PSICOLOGO', 'PACIENTE', 'ADMIN'])
  role: string;
}