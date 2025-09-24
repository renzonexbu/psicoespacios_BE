import { IsUUID, IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class TransferirPacienteDto {
  @IsUUID()
  @IsNotEmpty()
  pacienteId: string;

  @IsUUID()
  @IsNotEmpty()
  nuevoPsicologoId: string;

  @IsString()
  @IsOptional()
  motivoTransferencia?: string;

  @IsString()
  @IsOptional()
  notasAdicionales?: string;
}
