import { IsString, IsBoolean, IsArray, IsOptional, ValidateNested, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class WeeklyDayDto {
  @IsString()
  @IsIn(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'])
  day: string;

  @IsBoolean()
  active: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  hours?: string[];

  @IsString()
  sede: string; // "online" o "sede-id"
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