import { Expose } from 'class-transformer';

export class RegisterResponseDto {
  @Expose()
  access_token: string;

  @Expose()
  refresh_token: string;

  @Expose()
  user: {
    id: string;
    email: string;
    nombre: string;
    apellido: string;
    rut: string;
    telefono: string;
    fechaNacimiento: Date;
    fotoUrl: string;
    role: string;
    estado: string; // Incluye el estado del usuario
  };
}






