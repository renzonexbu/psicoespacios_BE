import { IsNumber, IsString, IsNotEmpty, IsUUID, IsEnum } from 'class-validator';
import { TipoPago } from '../../common/entities/pago.entity';

export class CreateFlowOrderDto {
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsEnum(TipoPago)
  @IsNotEmpty()
  tipo: TipoPago;
} 