import { IsString, IsDateString, IsEnum } from 'class-validator';

export class QueryDisponibilidadHorariosDto {
  @IsString()
  psicologoId: string;

  @IsDateString()
  fecha: string; // YYYY-MM-DD

  @IsEnum(['Online', 'Presencial'])
  modalidad: 'Online' | 'Presencial';
}
