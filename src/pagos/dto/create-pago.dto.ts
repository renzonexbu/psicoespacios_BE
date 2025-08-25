import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min, IsObject } from 'class-validator';
import { TipoPago, MetodoPago } from '../../common/entities/pago.entity';

export class CreatePagoDto {
  @IsEnum(TipoPago)
  tipo: TipoPago;

  @IsNumber()
  @Min(0)
  monto: number;

  @IsOptional()
  @IsUUID()
  cuponId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  descuentoAplicado?: number;

  @IsNumber()
  @Min(0)
  montoFinal: number;

  @IsOptional()
  @IsUUID()
  suscripcionId?: string;

  @IsOptional()
  @IsUUID()
  solicitudDerivacionId?: string;

  @IsObject()
  datosTransaccion: {
    metodoPago: MetodoPago;
    referencia?: string;
    datosTarjeta?: {
      ultimos4: string;
      marca: string;
    };
    datosTransferencia?: {
      banco: string;
      numeroOperacion: string;
    };
    fechaTransaccion: Date;
  };

  @IsOptional()
  @IsString()
  notasReembolso?: string;

  @IsOptional()
  @IsObject()
  metadatos?: Record<string, any>;
}





