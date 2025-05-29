export class Modalidad {
  tipo: 'Online' | 'Presencial';
  precio: number;
}

export class Psicologo {
  id: string;
  nombre: string;
  fotoUrl?: string;
  modalidad: Modalidad[];
  especialidades: string[];
}
