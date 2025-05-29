import { IsString, IsDateString, Matches, IsEnum } from 'class-validator';

export class CreateReservaDto {
  @IsString()
  psicologoId: string;

  @IsDateString()
  fecha: string; // YYYY-MM-DD

  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/) // HH:mm format
  horaInicio: string;

  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/) // HH:mm format
  horaFin: string;

  @IsEnum(['Online', 'Presencial'])
  modalidad: 'Online' | 'Presencial';

  @IsString()
  pacienteId: string;
}
