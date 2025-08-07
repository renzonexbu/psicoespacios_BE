import { IsString, IsNotEmpty, IsOptional, IsDateString, Length, IsUrl } from 'class-validator';

export class CreateBlogDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 255, { message: 'El título debe tener entre 1 y 255 caracteres' })
  titulo: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 1000, { message: 'La descripción debe tener entre 1 y 1000 caracteres' })
  descripcion: string;

  @IsString()
  @IsOptional()
  @IsUrl({}, { message: 'La imagen debe ser una URL válida' })
  imagen?: string;

  @IsDateString({}, { message: 'La fecha debe tener formato YYYY-MM-DD' })
  @IsOptional()
  fecha?: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 100, { message: 'La categoría debe tener entre 1 y 100 caracteres' })
  categoria: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 10000, { message: 'El contenido debe tener entre 1 y 10000 caracteres' })
  contenido: string;
} 