import { IsArray, IsString, IsOptional, IsEnum, IsBoolean, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';
import { 
  DiagnosticoPaciente, 
  TemaPaciente, 
  EstiloTerapeuticoPaciente, 
  EnfoqueTeorico, 
  AfinidadPersonalPaciente,
  Genero,
  ModalidadAtencion,
  GeneroPreferido
} from '../../common/enums/matching.enum';

// DTO para crear/actualizar el perfil de matching de un paciente
export class CrearPerfilMatchingDto {
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  diagnosticos_principales?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  temas_principales?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  estilo_terapeutico_preferido?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  enfoque_teorico_preferido?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  afinidad_personal_preferida?: string[];

  @IsEnum(Genero)
  @IsOptional()
  genero?: Genero;

  @IsArray()
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.map(v => {
        if (typeof v === 'string') {
          // Normalizar valores de modalidad
          const normalized = v.toLowerCase();
          switch (normalized) {
            case 'indiferente': return 'Indiferente';
            case 'online': return 'Online';
            case 'presencial': return 'Presencial';
            case 'ambas': return 'Ambas';
            default: return v; // Mantener valor original si no coincide
          }
        }
        return v;
      });
    }
    return value;
  })
  @IsEnum(ModalidadAtencion, { each: true })
  @IsOptional()
  modalidad_preferida?: ModalidadAtencion[];

  @IsArray()
  @IsEnum(GeneroPreferido, { each: true })
  @IsOptional()
  genero_psicologo_preferido?: GeneroPreferido[];

  @IsBoolean()
  @IsOptional()
  perfil_matching_completado?: boolean;
}

// DTO para crear/actualizar el perfil de matching de un psicólogo
export class CrearPerfilMatchingPsicologoDto {
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  diagnosticos_experiencia?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  temas_experiencia?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  estilo_terapeutico?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  enfoque_teorico?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  afinidad_paciente_preferida?: string[];

  @IsEnum(Genero)
  @IsOptional()
  genero?: Genero;

  @IsArray()
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.map(v => {
        if (typeof v === 'string') {
          // Normalizar valores de modalidad
          const normalized = v.toLowerCase();
          switch (normalized) {
            case 'indiferente': return 'Indiferente';
            case 'online': return 'Online';
            case 'presencial': return 'Presencial';
            case 'ambas': return 'Ambas';
            default: return v; // Mantener valor original si no coincide
          }
        }
        return v;
      });
    }
    return value;
  })
  @IsEnum(ModalidadAtencion, { each: true })
  @IsOptional()
  modalidad_atencion?: ModalidadAtencion[];
}

// DTO para la respuesta del matching
export class ResultadoMatchingDto {
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

// DTO para solicitar el cálculo de matching
export class CalcularMatchingDto {
  @IsString()
  pacienteId: string;
}

// DTO para obtener la configuración del sistema de matching
export class ConfiguracionMatchingDto {
  criterios: Array<{
    nombre: string;
    peso: number;
    descripcion: string;
  }>;
  mapeosDiagnosticos: Array<{
    paciente: string;
    psicologo: string[];
    peso: number;
  }>;
  mapeosTemas: Array<{
    paciente: string;
    psicologo: string[];
    peso: number;
  }>;
  mapeosEstilo: Array<{
    paciente: string;
    psicologo: string[];
    peso: number;
  }>;
  mapeosEnfoque: Array<{
    paciente: string;
    psicologo: string[];
    peso: number;
  }>;
  mapeosAfinidad: Array<{
    paciente: string;
    psicologo: string[];
    peso: number;
  }>;
}

// DTO para el formulario de matching del paciente
export class FormularioMatchingPacienteDto {
  // Sección 1: Diagnósticos principales
  @IsArray()
  @IsString({ each: true })
  diagnosticos_principales: string[];

  // Sección 2: Temas principales
  @IsArray()
  @IsString({ each: true })
  temas_principales: string[];

  // Sección 3: Estilo terapéutico preferido
  @IsArray()
  @IsString({ each: true })
  estilo_terapeutico_preferido: string[];

  // Sección 4: Enfoque teórico preferido
  @IsArray()
  @IsString({ each: true })
  enfoque_teorico_preferido: string[];

  // Sección 5: Afinidad personal preferida
  @IsArray()
  @IsString({ each: true })
  afinidad_personal_preferida: string[];

  // Sección 6: Filtros logísticos
  @IsEnum(Genero)
  genero: Genero;

  @IsArray()
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.map(v => {
        if (typeof v === 'string') {
          // Normalizar valores de modalidad
          const normalized = v.toLowerCase();
          switch (normalized) {
            case 'indiferente': return 'Indiferente';
            case 'online': return 'Online';
            case 'presencial': return 'Presencial';
            case 'ambas': return 'Ambas';
            default: return v; // Mantener valor original si no coincide
          }
        }
        return v;
      });
    }
    return value;
  })
  @IsEnum(ModalidadAtencion, { each: true })
  modalidad_preferida: ModalidadAtencion[];

  @IsArray()
  @IsEnum(GeneroPreferido, { each: true })
  genero_psicologo_preferido: GeneroPreferido[];
}

// DTO para el formulario de matching del psicólogo
export class FormularioMatchingPsicologoDto {
  // Sección 1: Experiencia en diagnósticos
  @IsArray()
  @IsString({ each: true })
  diagnosticos_experiencia: string[];

  // Sección 2: Experiencia en temas
  @IsArray()
  @IsString({ each: true })
  temas_experiencia: string[];

  // Sección 3: Estilo terapéutico
  @IsArray()
  @IsString({ each: true })
  estilo_terapeutico: string[];

  // Sección 4: Enfoque teórico
  @IsArray()
  @IsString({ each: true })
  enfoque_teorico: string[];

  // Sección 5: Afinidad con pacientes
  @IsArray()
  @IsString({ each: true })
  afinidad_paciente_preferida: string[];

  // Sección 6: Filtros logísticos
  @IsEnum(Genero)
  genero: Genero;

  @IsArray()
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.map(v => {
        if (typeof v === 'string') {
          // Normalizar valores de modalidad
          const normalized = v.toLowerCase();
          switch (normalized) {
            case 'indiferente': return 'Indiferente';
            case 'online': return 'Online';
            case 'presencial': return 'Presencial';
            case 'ambas': return 'Ambas';
            default: return v; // Mantener valor original si no coincide
          }
        }
        return v;
      });
    }
    return value;
  })
  @IsEnum(ModalidadAtencion, { each: true })
  modalidad_atencion: ModalidadAtencion[];
}

