import { TipoPago, EstadoPago, MetodoPago } from '../../common/entities/pago.entity';

export class CuponInfoDto {
  id: string;
  nombre: string;
  porcentaje: number;
  modalidad: string;
}

export class PagoResponseDto {
  id: string;
  tipo: TipoPago;
  monto: number;
  descuentoAplicado: number;
  montoFinal: number;
  estado: EstadoPago;
  cupon?: CuponInfoDto;
  cuponId?: string;
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
  notasReembolso?: string;
  metadatos?: Record<string, any>;
  fechaCompletado?: Date;
  fechaReembolso?: Date;
  createdAt: Date;
  updatedAt: Date;
}













