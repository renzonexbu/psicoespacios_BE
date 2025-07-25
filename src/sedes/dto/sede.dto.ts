import { IsString, IsOptional, IsArray, IsObject } from 'class-validator';

export class CreateSedeDto {
  @IsString()
  nombre: string;

  @IsString()
  description: string;

  @IsString()
  direccion: string;

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
  telefono?: string;
  email?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  features?: string[];
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