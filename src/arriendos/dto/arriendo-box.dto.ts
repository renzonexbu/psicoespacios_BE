import { IsString, IsNumber, IsOptional, IsArray, IsUUID, IsEnum, IsDateString, IsBoolean, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { EstadoArriendo, TipoArriendo } from '../../common/entities/arriendo-box.entity';

export class HorarioDto {
  @IsString()
  dia: string;

  @IsString()
  horaInicio: string;

  @IsString()
  horaFin: string;

  @IsBoolean()
  @IsOptional()
  activo?: boolean = true;
}

export class CondicionesEspecialesDto {
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  equipamientoAdicional?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  restricciones?: string[];

  @IsString()
  @IsOptional()
  notas?: string;
}

export class CreateArriendoBoxDto {
  @IsUUID()
  boxId: string;

  @IsUUID()
  psicologoId: string;

  @IsEnum(TipoArriendo)
  @IsOptional()
  tipoArriendo?: TipoArriendo = TipoArriendo.MENSUAL;

  @IsDateString()
  fechaInicio: string;

  @IsDateString()
  fechaFin: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HorarioDto)
  horarios: HorarioDto[];

  @IsNumber()
  precioMensual: number;

  @IsNumber()
  precioTotal: number;

  @IsEnum(EstadoArriendo)
  @IsOptional()
  estado?: EstadoArriendo = EstadoArriendo.PENDIENTE;

  @IsString()
  @IsOptional()
  observaciones?: string;

  @IsObject()
  @ValidateNested()
  @Type(() => CondicionesEspecialesDto)
  @IsOptional()
  condicionesEspeciales?: CondicionesEspecialesDto;

  @IsBoolean()
  @IsOptional()
  renovacionAutomatica?: boolean = false;

  @IsDateString()
  @IsOptional()
  fechaRenovacion?: string;
}

export class UpdateArriendoBoxDto {
  @IsEnum(TipoArriendo)
  @IsOptional()
  tipoArriendo?: TipoArriendo;

  @IsDateString()
  @IsOptional()
  fechaInicio?: string;

  @IsDateString()
  @IsOptional()
  fechaFin?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HorarioDto)
  @IsOptional()
  horarios?: HorarioDto[];

  @IsNumber()
  @IsOptional()
  precioMensual?: number;

  @IsNumber()
  @IsOptional()
  precioTotal?: number;

  @IsEnum(EstadoArriendo)
  @IsOptional()
  estado?: EstadoArriendo;

  @IsString()
  @IsOptional()
  observaciones?: string;

  @IsObject()
  @ValidateNested()
  @Type(() => CondicionesEspecialesDto)
  @IsOptional()
  condicionesEspeciales?: CondicionesEspecialesDto;

  @IsBoolean()
  @IsOptional()
  renovacionAutomatica?: boolean;

  @IsDateString()
  @IsOptional()
  fechaRenovacion?: string;

  @IsString()
  @IsOptional()
  motivoCancelacion?: string;
} 