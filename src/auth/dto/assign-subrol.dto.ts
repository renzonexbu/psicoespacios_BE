import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator';
import { SubrolPsicologo } from '../../common/enums/subrol-psicologo.enum';

export class AssignSubrolDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsEnum(SubrolPsicologo)
  @IsNotEmpty()
  subrol: SubrolPsicologo;
}



