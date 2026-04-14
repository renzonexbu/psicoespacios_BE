/**
 * Convierte YYYY-MM-DD (o el prefijo de una ISO con T) a texto tipo
 * "10 de abril de 2026" sin desfases por zona horaria.
 */
export function formatFechaDiaMesAnio(fecha: string): string {
  if (!fecha || typeof fecha !== 'string') {
    return fecha ?? '';
  }
  const ymd = fecha.includes('T') ? fecha.split('T')[0] : fecha.trim();
  const parts = ymd.split('-');
  if (parts.length !== 3) {
    return fecha;
  }
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);
  if (isNaN(y) || isNaN(m) || isNaN(d) || m < 1 || m > 12) {
    return fecha;
  }
  const date = new Date(y, m - 1, d);
  return new Intl.DateTimeFormat('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}
