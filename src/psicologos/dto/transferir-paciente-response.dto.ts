export class TransferirPacienteResponseDto {
  success: boolean;
  message: string;
  paciente: {
    id: string;
    idUsuarioPaciente: string;
    idUsuarioPsicologoAnterior: string;
    idUsuarioPsicologoNuevo: string;
    estado: string;
  };
  psicologoAnterior: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
  };
  psicologoNuevo: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
  };
  fechaTransferencia: string;
  motivoTransferencia?: string;
}
