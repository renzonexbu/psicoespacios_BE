import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateSedeDto {
  @IsString()
  nombre: string;

  @IsString()
  direccion: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsString()
  @IsOptional()
  estado?: string = 'ACTIVA';
}

export class UpdateSedeDto extends CreateSedeDto {
  @IsOptional()
  declare nombre: string;

  @IsOptional()
  declare direccion: string;
}