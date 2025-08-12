import { Expose, Transform } from 'class-transformer';

export class UserResponseDto {
  @Expose()
  id: string;

  @Expose()
  email: string;

  @Expose()
  nombre: string;

  @Expose()
  apellido: string;

  @Expose()
  rut: string;

  @Expose()
  telefono: string;

  @Expose()
  @Transform(({ value }) => value ? new Date(value).toISOString().split('T')[0] : null)
  fechaNacimiento: Date;

  @Expose()
  fotoUrl: string;

  @Expose()
  direccion: string;

  @Expose()
  especialidad: string;

  @Expose()
  numeroRegistroProfesional: string;

  @Expose()
  experiencia: string;

  @Expose()
  role: string;

  @Expose()
  estado: string;

  @Expose()
  @Transform(({ value }) => value ? new Date(value).toISOString() : null)
  createdAt: Date;

  @Expose()
  @Transform(({ value }) => value ? new Date(value).toISOString() : null)
  updatedAt: Date;
} 