export class PacienteAsignadoDto {
  id: string;
  pacienteId: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  fechaNacimiento: Date;
  fotoUrl: string | null;
  primeraSesionRegistrada: Date;
  proximaSesion: Date | null;
  estado: string;
} 