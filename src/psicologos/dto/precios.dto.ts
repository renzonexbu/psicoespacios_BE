import { IsNumber, IsOptional, Min, Max, IsBoolean } from 'class-validator';

export class UpdatePreciosDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(999999.99)
  precioOnline?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(999999.99)
  precioPresencial?: number;

  @IsOptional()
  @IsBoolean()
  fonasa?: boolean;
}

export class PreciosResponseDto {
  id: string;
  precioOnline: number | null;
  precioPresencial: number | null;
  fonasa: boolean;
  updatedAt: Date;
} 