import { Box } from '../entities/box.entity';

export interface DetalleUbicacionPresencial {
  sedeNombre?: string;
  direccionSede?: string;
  boxNombre?: string;
  /** Línea única: sede — dirección, ciudad — box */
  ubicacion: string;
}

/** Arma sede, dirección/ciudad y box para correos y metadatos. */
export function getDetalleUbicacionPresencialFromBox(
  box: Box,
): DetalleUbicacionPresencial {
  const sede = box.sede;
  const boxLabel = box.nombre?.trim() || `Box ${box.numero}`;
  const direccionSede = [sede?.direccion, sede?.ciudad]
    .filter(Boolean)
    .join(', ');
  const sedeNombre = sede?.nombre?.trim() || 'Sede';
  const partes = [sedeNombre, direccionSede, boxLabel].filter(
    (p) => p && String(p).trim().length > 0,
  );
  return {
    sedeNombre: sede?.nombre?.trim() || undefined,
    direccionSede: direccionSede || undefined,
    boxNombre: boxLabel,
    ubicacion: partes.join(' — '),
  };
}

export function buildUbicacionPresencialDesdeBox(box: Box): string {
  return getDetalleUbicacionPresencialFromBox(box).ubicacion;
}
