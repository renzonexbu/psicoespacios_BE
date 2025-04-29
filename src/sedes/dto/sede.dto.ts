import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateSedeDto {
  @IsString()
  nombre: string;

  @IsString()
  direccion: string;

  @IsString()
  ciudad: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsBoolean()
  @IsOptional()
  activa?: boolean = true;
}

export class UpdateSedeDto extends CreateSedeDto {
  @IsOptional()
  declare nombre: string;

  @IsOptional()
  declare direccion: string;

  @IsOptional()
  declare ciudad: string;
}