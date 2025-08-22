export class SuscripcionInfoDto {
  tieneSuscripcion: boolean;
  mensaje: string;
  estado: 'ACTIVA' | 'VENCIDA' | 'SIN_SUSCRIPCION' | 'ERROR';
  plan?: string;
  fechaVencimiento?: Date;
  diasRestantes?: number;
  renovacionAutomatica?: boolean;
  precioRenovacion?: number;
}





