export class CrearPacienteResponseDto {
  success: boolean;
  message: string;
  paciente: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
    rut: string;
    fechaNacimiento: string;
    role: string;
    estado: string;
  };
  psicologo: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
  };
  emailEnviado: boolean;
  passwordGenerada: string; // Solo para mostrar en la respuesta, no se debe guardar
}
