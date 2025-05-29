import { IsString, IsInt, Min, Max, IsEnum } from 'class-validator';

export class QueryDisponibilidadDiasDto {
  @IsString()
  psicologoId: string;

  @IsInt()
  @Min(1)
  @Max(12)
  mes: number;

  @IsInt()
  año: number;

  @IsEnum(['Online', 'Presencial'])
  modalidad: 'Online' | 'Presencial';
}
