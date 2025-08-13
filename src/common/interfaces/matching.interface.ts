// Interfaces para el Sistema de Matching

export interface PerfilMatchingPsicologo {
  // Coincidencias Diagnósticas (35%)
  diagnosticos_experiencia: string[];
  
  // Coincidencias Temáticas (25%)
  temas_experiencia: string[];
  
  // Coincidencias de Estilo Terapéutico (20%)
  estilo_terapeutico: string[];
  
  // Enfoque teórico (10%)
  enfoque_teorico: string[];
  
  // Afinidad Personal (10%)
  afinidad_paciente_preferida: string[];
  
  // Filtros Logísticos
  genero: string;
  modalidad_atencion: string[];
}

export interface PerfilMatchingPaciente {
  // Coincidencias Diagnósticas (35%)
  diagnosticos_principales: string[];
  
  // Coincidencias Temáticas (25%)
  temas_principales: string[];
  
  // Coincidencias de Estilo Terapéutico (20%)
  estilo_terapeutico_preferido: string[];
  
  // Enfoque teórico (10%)
  enfoque_teorico_preferido: string[];
  
  // Afinidad Personal (10%)
  afinidad_personal_preferida: string[];
  
  // Filtros Logísticos
  genero: string;
  modalidad_preferida: string[];
  genero_psicologo_preferido: string[];
}

export interface ResultadoMatching {
  psicologoId: string;
  nombrePsicologo: string;
  puntajeTotal: number;
  puntajeDiagnosticos: number;
  puntajeTemas: number;
  puntajeEstilo: number;
  puntajeEnfoque: number;
  puntajeAfinidad: number;
  puntajeFiltros: number;
  coincidencias: {
    diagnosticos: string[];
    temas: string[];
    estilo: string[];
    enfoque: string[];
    afinidad: string[];
    filtros: string[];
  };
  porcentajeCoincidencia: number;
}

export interface CriterioMatching {
  nombre: string;
  peso: number;
  descripcion: string;
}

export interface MapeoCoincidencias {
  paciente: string;
  psicologo: string[];
  peso: number;
}

export interface ConfiguracionMatching {
  criterios: CriterioMatching[];
  mapeosDiagnosticos: MapeoCoincidencias[];
  mapeosTemas: MapeoCoincidencias[];
  mapeosEstilo: MapeoCoincidencias[];
  mapeosEnfoque: MapeoCoincidencias[];
  mapeosAfinidad: MapeoCoincidencias[];
}
