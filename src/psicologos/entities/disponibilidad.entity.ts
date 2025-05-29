export class HorarioSlot {
  horaInicio: string; // HH:mm
  horaFin: string; // HH:mm
  disponible: boolean;
}

export class DisponibilidadDia {
  fecha: string; // YYYY-MM-DD
  disponible: boolean;
}

export class DisponibilidadHorario {
  psicologoId: string;
  fecha: string; // YYYY-MM-DD
  modalidad: 'Online' | 'Presencial';
  horarios: HorarioSlot[];
}
