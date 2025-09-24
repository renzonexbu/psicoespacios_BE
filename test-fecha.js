const fecha = '2025-08-04';
const [year, month, day] = fecha.split('-').map(Number);
const fechaObj = new Date(year, month - 1, day);

console.log('Fecha:', fecha);
console.log('Día número:', fechaObj.getDay());
console.log('Día español:', fechaObj.toLocaleDateString('es-ES', { weekday: 'long' })); 