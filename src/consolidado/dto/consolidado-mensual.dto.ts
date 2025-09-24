import { IsString, IsOptional, IsDateString, Matches } from 'class-validator';

export class QueryConsolidadoMensualDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}$/, {
    message: 'El mes debe tener el formato YYYY-MM (ej: 2024-01)'
  })
  mes: string; // Formato YYYY-MM

  @IsOptional()
  @IsString()
  psicologoId?: string; // Para admins que quieran ver consolidado de un psicólogo específico
}

export class DetalleReservaDto {
  id: string;
  boxId: string;
  nombreBox: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  precio: number;
  estado: string;
  createdAt: string;
}

export class ConsolidadoMensualDto {
  psicologoId: string;
  nombrePsicologo: string;
  emailPsicologo: string;
  mes: string;
  año: number;
  mesNumero: number;
  totalReservas: number;
  totalMonto: number;
  detalleReservas: DetalleReservaDto[];
  resumen: {
    reservasCompletadas: number;
    reservasCanceladas: number;
    reservasPendientes: number;
    montoCompletadas: number;
    montoCanceladas: number;
    montoPendientes: number;
  };
  estadisticas: {
    promedioPorReserva: number;
    reservasPorSemana: number[];
    diasConReservas: number;
  };
}



