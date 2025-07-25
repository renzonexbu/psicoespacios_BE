import { IsString, IsNumber, IsBoolean, IsOptional, IsArray, IsEnum } from 'class-validator';
import { TipoPlan } from '../../common/entities/plan.entity';

export class CreatePlanDto {
  @IsEnum(TipoPlan)
  tipo: TipoPlan;

  @IsString()
  nombre: string;

  @IsString()
  descripcion: string;

  @IsNumber()
  precio: number;

  @IsNumber()
  duracion: number;

  @IsNumber()
  @IsOptional()
  horasIncluidas?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  beneficios?: string[];

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}

export class UpdatePlanDto {
  @IsEnum(TipoPlan)
  @IsOptional()
  tipo?: TipoPlan;

  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsNumber()
  @IsOptional()
  precio?: number;

  @IsNumber()
  @IsOptional()
  duracion?: number;

  @IsNumber()
  @IsOptional()
  horasIncluidas?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  beneficios?: string[];

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}

export class PlanPublicDto {
  id: string;
  tipo: TipoPlan;
  nombre: string;
  descripcion: string;
  precio: number;
  duracion: number;
  horasIncluidas: number;
  beneficios?: string[];
  activo: boolean;
  // NO incluir: suscripciones, timestamps
}