import { IsUUID, IsString, IsBoolean, IsNotEmpty } from 'class-validator';

export class CreateAcreditacionDto {
  @IsUUID()
  idPsicologo: string;

  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  urlFile: string;

  @IsBoolean()
  estado: boolean;
}

export class UpdateAcreditacionDto {
  @IsString()
  nombre?: string;

  @IsString()
  urlFile?: string;

  @IsBoolean()
  estado?: boolean;
} 