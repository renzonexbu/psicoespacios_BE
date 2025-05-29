import { IsString } from 'class-validator';

export class QueryHistorialTurnosDto {
  @IsString()
  pacienteId: string;
}
