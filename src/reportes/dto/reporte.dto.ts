import { IsNotEmpty, IsEnum, IsObject, IsOptional } from 'class-validator';
import { TipoReporte, FormatoReporte } from '../../common/entities/reporte.entity';

export class CreateReporteDto {
  @IsEnum(TipoReporte)
  @IsNotEmpty()
  tipo: TipoReporte;

  @IsObject()
  @IsNotEmpty()
  parametros: {
    fechaInicio: Date;
    fechaFin: Date;
    filtros?: Record<string, any>;
    agrupamiento?: string[];
    ordenamiento?: string[];
  };

  @IsEnum(FormatoReporte)
  @IsNotEmpty()
  formato: FormatoReporte;

  @IsOptional()
  observaciones?: string;
}