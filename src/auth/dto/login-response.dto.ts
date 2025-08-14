import { Expose } from 'class-transformer';
import { SuscripcionInfoDto } from './suscripcion-info.dto';

export class LoginResponseDto {
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
    estado: string;
  };

  @Expose()
  suscripcion?: SuscripcionInfoDto | null;
}
