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

export class DetalleSuscripcionDto {
  id: string;
  estado: string;
  fechaInicio: string;
  fechaFin: string;
  precioTotal: number;
  horasConsumidas: number;
  horasDisponibles: number;
  renovacionAutomatica: boolean;
  fechaProximaRenovacion?: string;
  plan: {
    id: string;
    nombre: string;
    descripcion: string;
    precio: number;
    horasIncluidas: number;
    beneficios: string[];
  };
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
  estadoPago: string;
  createdAt: string;
}

export class DetallePackDto {
  packId: string;
  packNombre: string;
  asignacionId: string;
  precioTotal: number;
  precioProporcional: number;
  totalReservas: number;
  reservasCompletadas: number;
  reservasCanceladas: number;
  reservasPendientes: number;
  precioPorReserva: number;
  estadoPago: string;
  montoPagado: number;
  montoReembolsado: number;
  estadoAsignacion: string;
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
  suscripcion: DetalleSuscripcionDto | null;
  resumen: {
    reservasCompletadas: number;
    reservasCanceladas: number;
    reservasPendientes: number;
    montoCompletadas: number;
    montoCanceladas: number;
    montoPendientes: number;
  };
  resumenPago: {
    reservasPagadas: number;
    reservasPendientesPago: number;
    montoPagadas: number;
    montoPendientesPago: number;
  };
  estadisticas: {
    promedioPorReserva: number;
    reservasPorSemana: number[];
    diasConReservas: number;
  };
  packsDelMes: DetallePackDto[];
  resumenPacks: {
    totalPacks: number;
    totalMontoPacks: number;
    totalMontoIndividuales: number;
  };
}




