export enum EstadoReserva {
  PENDIENTE = 'pendiente',
  CONFIRMADA = 'confirmada',
  CANCELADA = 'cancelada',
  COMPLETADA = 'completada', // Ejemplo de otro estado
}

export class Reserva {
  id: string;
  psicologoId: string;
  pacienteId: string;
  fecha: string; // YYYY-MM-DD
  horaInicio: string; // HH:mm
  horaFin: string; // HH:mm
  modalidad: 'Online' | 'Presencial';
  estado: EstadoReserva;
  createdAt: string; // Fecha de creación ISO
  // Campo adicional para el historial de turnos
  nombrePsicologo?: string;
}
