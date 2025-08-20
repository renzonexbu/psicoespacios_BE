export class ValidarCuponResponseDto {
  valido: boolean;
  mensaje: string;
  id?: string; // ID del cupón para usar en el pago
  descuento?: number;
  modalidad?: string;
  psicologoNombre?: string;
  error?: string;
}

export class ValidarCuponErrorDto {
  valido: false;
  mensaje: string;
  error: 'CUPON_NO_EXISTE' | 'CUPON_EXPIRADO' | 'CUPON_AGOTADO' | 'ERROR_VALIDACION';
}
