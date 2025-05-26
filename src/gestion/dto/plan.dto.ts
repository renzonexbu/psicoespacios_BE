import { IsString, IsNumber, IsBoolean, IsOptional } from 'class-validator';

export class CreatePlanDto {
  @IsString()
  nombre: string;

  @IsString()
  descripcion: string;

  @IsNumber()
  precio: number;

  @IsNumber()
  duracion: number;

  @IsBoolean()
  @IsOptional()
  activo?: boolean = true;

  @IsNumber()
  @IsOptional()
  descuento?: number;
}

export class UpdatePlanDto extends CreatePlanDto {
  @IsOptional()
  declare nombre: string;

  @IsOptional()
  declare descripcion: string;

  @IsOptional()
  declare precio: number;

  @IsOptional()
  declare duracion: number;
}