import { IsString, IsOptional, IsNotEmpty, MaxLength } from 'class-validator';

export class UpdatePacienteTagDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100, { message: 'El tag no puede exceder los 100 caracteres' })
  tag: string;
}

export class RemovePacienteTagDto {
  @IsString()
  @IsOptional()
  motivo?: string;
}

