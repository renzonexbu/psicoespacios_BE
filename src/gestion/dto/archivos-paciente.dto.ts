import { IsOptional, IsString, IsDateString } from 'class-validator';

export class ArchivoPacienteDto {
  id: string;
  tipo: string;
  descripcion: string;
  url?: string;
  fechaCreacion: Date;
  psicologo: {
    id: string;
    nombre: string;
    apellido: string;
  };
}

export class FiltrosArchivosPacienteDto {
  @IsOptional()
  @IsString()
  tipo?: string;

  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @IsOptional()
  @IsDateString()
  fechaHasta?: string;
}






























