import { IsString, IsBoolean, IsArray, IsOptional, ValidateNested, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class DiaPresencialBlockDto {
  @IsString()
  sedeId: string; // UUID de sede

  @IsArray()
  @IsString({ each: true })
  horas: string[];
}

export class WeeklyDayDto {
  @IsString()
  @IsIn(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'])
  day: string;

  @IsBoolean()
  active: boolean;

  // Nuevo formato (recomendado): definir ambos tipos de horas por día
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  hoursOnline?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DiaPresencialBlockDto)
  @IsOptional()
  presenciales?: DiaPresencialBlockDto[];

  // Formato legado (compatibilidad): una sola modalidad por día
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  hours?: string[];

  @IsString()
  @IsOptional()
  sede?: string; // "online" o "sede-id"
}

export class AvailabilityDataDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WeeklyDayDto)
  weeklySchedule: WeeklyDayDto[];

  @IsBoolean()
  worksOnHolidays: boolean;
}

export class AvailabilityResponseDto {
  weeklySchedule: WeeklyDayDto[];
  worksOnHolidays: boolean;
  updatedAt: string;
} 