import { IsString, IsOptional, IsArray, IsObject, IsNumber } from 'class-validator';

export class CreateSedeDto {
  @IsString()
  nombre: string;

  @IsString()
  description: string;

  @IsString()
  direccion: string;

  @IsString()
  ciudad: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @IsOptional()
  @IsArray()
  features?: string[];

  @IsOptional()
  @IsObject()
  coordenadas?: {
    lat: number;
    lng: number;
  };

  @IsOptional()
  @IsObject()
  horarioAtencion?: {
    diasHabiles: {
      dia: string;
      inicio: string;
      fin: string;
      cerrado: boolean;
    }[];
  };

  @IsOptional()
  @IsArray()
  serviciosDisponibles?: string[];
}

export class UpdateSedeDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  direccion?: string;

  @IsOptional()
  @IsString()
  ciudad?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @IsOptional()
  @IsArray()
  features?: string[];

  @IsOptional()
  @IsObject()
  coordenadas?: {
    lat: number;
    lng: number;
  };

  @IsOptional()
  @IsObject()
  horarioAtencion?: {
    diasHabiles: {
      dia: string;
      inicio: string;
      fin: string;
      cerrado: boolean;
    }[];
  };

  @IsOptional()
  @IsArray()
  serviciosDisponibles?: string[];
}

export class SedePublicDto {
  id: string;
  nombre: string;
  description: string;
  direccion: string;
  ciudad: string;
  telefono?: string;
  email?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  features?: string[];
  coordenadas?: {
    lat: number;
    lng: number;
  };
  horarioAtencion?: {
    diasHabiles: {
      dia: string;
      inicio: string;
      fin: string;
      cerrado: boolean;
    }[];
  };
  serviciosDisponibles?: string[];
  estado: string;
}

export class AsignarBoxDto {
  @IsString()
  fecha: string; // YYYY-MM-DD

  @IsString()
  horaInicio: string; // HH:MM

  @IsString()
  horaFin: string; // HH:MM
}

export class BoxAsignadoResponseDto {
  success: boolean;
  message: string;
  box: {
    id: string;
    nombre: string;
    capacidad: number;
    sedeId: string;
    estado: string;
  };
  fecha: string;
  horaInicio: string;
  horaFin: string;
  sede: {
    id: string;
    nombre: string;
    direccion: string;
    ciudad: string;
    telefono?: string;
    email?: string;
  };
}