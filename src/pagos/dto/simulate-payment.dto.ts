import { IsNumber, IsString, IsNotEmpty, IsUUID, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { TipoPago } from '../../common/entities/pago.entity';

export class SimulatePaymentDto {
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

  // Campos opcionales para simular diferentes escenarios
  @IsOptional()
  @IsString()
  psicologoId?: string;

  @IsOptional()
  @IsDateString()
  fechaReserva?: string;

  @IsOptional()
  @IsString()
  horaReserva?: string;

  @IsOptional()
  @IsString()
  modalidad?: 'online' | 'presencial';

  // Simular diferentes estados de pago
  @IsOptional()
  @IsString()
  simulateStatus?: 'success' | 'failed' | 'pending' | 'cancelled';
} 