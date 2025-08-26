import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Psicologo } from '../../common/entities/psicologo.entity';
import { Paciente } from '../../common/entities/paciente.entity';
import { User } from '../../common/entities/user.entity';
import { 
  ResultadoMatching, 
  PerfilMatchingPaciente, 
  PerfilMatchingPsicologo,
  ConfiguracionMatching,
  MapeoCoincidencias
} from '../../common/interfaces/matching.interface';

@Injectable()
export class MatchingService {
  constructor(
    @InjectRepository(Psicologo)
    private psicologoRepository: Repository<Psicologo>,
    @InjectRepository(Paciente)
    private pacienteRepository: Repository<Paciente>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // Configuración del sistema de matching según el documento
  private readonly configuracionMatching: ConfiguracionMatching = {
    criterios: [
      { nombre: 'Diagnósticos', peso: 0.35, descripcion: 'Coincidencias Diagnósticas (35%)' },
      { nombre: 'Temas', peso: 0.25, descripcion: 'Coincidencias Temáticas (25%)' },
      { nombre: 'Estilo', peso: 0.20, descripcion: 'Coincidencias de Estilo Terapéutico (20%)' },
      { nombre: 'Enfoque', peso: 0.10, descripcion: 'Enfoque teórico (10%)' },
      { nombre: 'Afinidad', peso: 0.10, descripcion: 'Afinidad Personal (10%)' }
    ],
    
    // Mapeos de coincidencias diagnósticas
    mapeosDiagnosticos: [
      { paciente: 'Ansiedad', psicologo: ['Trastornos de ansiedad (incluye crisis de pánico, ansiedad generalizada, ansiedad social)'], peso: 1 },
      { paciente: 'Depresión', psicologo: ['Episodios depresivos o síntomas del ánimo bajo'], peso: 1 },
      { paciente: 'Pánico', psicologo: ['Trastornos de ansiedad (incluye crisis de pánico, ansiedad generalizada, ansiedad social)'], peso: 1 },
      { paciente: 'Emociones intensas', psicologo: ['Procesos depresivos / Regulación emocional y manejo de impulsividad'], peso: 1 },
      { paciente: 'Pensamientos repetitivos', psicologo: ['Trastorno obsesivo compulsivo (TOC)'], peso: 1 },
      { paciente: 'Fobia', psicologo: ['Fobias específicas'], peso: 1 },
      { paciente: 'Ansiedad social', psicologo: ['Trastornos de ansiedad (incluye crisis de pánico, ansiedad generalizada, ansiedad social)'], peso: 1 },
      { paciente: 'Autolesión', psicologo: ['Conductas autolesivas sin intención suicida'], peso: 1 },
      { paciente: 'Ideación suicida', psicologo: ['Pensamientos suicidas o ideación sin planificación activa'], peso: 1 },
      { paciente: 'TOC', psicologo: ['Trastorno obsesivo compulsivo (TOC)'], peso: 1 },
      { paciente: 'TDAH', psicologo: ['Trastorno de déficit atencional (TDAH) en adolescentes o adultos'], peso: 1 },
      { paciente: 'Impulsividad', psicologo: ['Regulación emocional y manejo de impulsividad'], peso: 1 },
      { paciente: 'Personalidad', psicologo: ['Trastornos de personalidad leves a moderados'], peso: 1 },
      { paciente: 'TEA', psicologo: ['Trastorno del espectro autista (TEA) sin discapacidad intelectual'], peso: 1 },
      { paciente: 'Dificultades adaptativas', psicologo: ['Trastornos adaptativos'], peso: 1 },
      { paciente: 'Salud física', psicologo: ['Impacto psicológico por diagnóstico de enfermedad médica crónica'], peso: 1 },
      { paciente: 'Alimentación', psicologo: ['Trastornos de la conducta alimentaria (TCA)'], peso: 1 },
      { paciente: 'Consumo de alcohol o drogas', psicologo: ['Consumo problemático de alcohol u otras sustancias'], peso: 1 },
      { paciente: 'Sexualidad / Género', psicologo: ['Dificultades relacionadas con la identidad de género o la orientación sexual / Disfunciones sexuales'], peso: 1 }
    ],

    // Mapeos de coincidencias temáticas
    mapeosTemas: [
      { paciente: 'Autoconocimiento', psicologo: ['Acompañamiento en procesos de autoconocimiento'], peso: 1 },
      { paciente: 'Autoestima', psicologo: ['Fortalecimiento de la autoestima y la autovaloración'], peso: 1 },
      { paciente: 'Autonomía', psicologo: ['Procesos de individuación o separación emocional de la familia de origen'], peso: 1 },
      { paciente: 'Límites', psicologo: ['Dificultades para poner límites o cuidar el espacio personal'], peso: 1 },
      { paciente: 'Perdón', psicologo: ['Exploración de identidad personal / Procesamiento emocional'], peso: 1 },
      { paciente: 'Identidad', psicologo: ['Exploración de identidad personal / Temáticas ligadas al género, diversidad e identidad sexual'], peso: 1 },
      { paciente: 'Regulación emocional', psicologo: ['Regulación emocional y manejo de impulsividad'], peso: 1 },
      { paciente: 'Sobreexigencia', psicologo: ['Culpabilidad excesiva o autoexigencia desmedida / Agotamiento emocional y estrés por sobreexigencia'], peso: 1 },
      { paciente: 'Evitación', psicologo: ['Evitación de experiencias dolorosas o toma de decisiones'], peso: 1 },
      { paciente: 'Relaciones', psicologo: ['Conflictos en relaciones cercanas (familia, pareja, amistades)'], peso: 1 },
      { paciente: 'Patrones vinculares', psicologo: ['Repetición de patrones vinculares o conductuales'], peso: 1 },
      { paciente: 'Conflictos familiares', psicologo: ['Conflictos en relaciones cercanas (familia, pareja, amistades)'], peso: 1 },
      { paciente: 'Parentalidad', psicologo: ['Parentalidad y crianza'], peso: 1 },
      { paciente: 'Trauma', psicologo: ['Procesamiento de experiencias traumáticas'], peso: 1 },
      { paciente: 'Abuso', psicologo: ['Procesamiento de experiencias de abuso (físico, emocional o sexual)'], peso: 1 },
      { paciente: 'Duelo', psicologo: ['Duelo por pérdidas significativas o rupturas importantes'], peso: 1 },
      { paciente: 'Crisis existencial', psicologo: ['Crisis vitales o existenciales'], peso: 1 },
      { paciente: 'Cambios vitales', psicologo: ['Adaptación frente a cambios profundos o inesperados en la vida'], peso: 1 },
      { paciente: 'Género y sexualidad', psicologo: ['Temáticas ligadas al género, diversidad e identidad sexual'], peso: 1 },
      { paciente: 'Discriminación', psicologo: ['Vivencias de discriminación o exclusión'], peso: 1 }
    ],

    // Mapeos de estilo terapéutico
    mapeosEstilo: [
      { paciente: 'Que sea auténtico/a', psicologo: ['Auténtico/a y coherente consigo mismo/a'], peso: 1 },
      { paciente: 'Que hable claro y con calma', psicologo: ['Comunicativo/a y claro/a al expresarse'], peso: 1 },
      { paciente: 'Que me haga sentir en confianza', psicologo: ['Cercano/a y humano/a en el vínculo'], peso: 1 },
      { paciente: 'Que tenga cercanía humana', psicologo: ['Cálido/a y cuidadoso/a en la relación'], peso: 1 },
      { paciente: 'Que tenga algo de humor', psicologo: ['Dinámico/a o con estrategias creativas'], peso: 1 },
      { paciente: 'Que se preocupe por cómo estoy', psicologo: ['Atento/a al vínculo terapéutico como eje del proceso'], peso: 1 },
      { paciente: 'Que valore el vínculo', psicologo: ['Atento/a al vínculo terapéutico como eje del proceso'], peso: 1 },
      { paciente: 'Que construyamos el proceso juntos/as', psicologo: ['Horizontal, promueve una construcción compartida'], peso: 1 },
      { paciente: 'Que sepa escuchar, pero también decir lo que necesito', psicologo: ['Comunicativo/a y claro/a al expresarse'], peso: 1 },
      { paciente: 'Que me oriente cuando lo necesito', psicologo: ['Activo/a en la conducción de las sesiones'], peso: 1 },
      { paciente: 'Que tenga estructura y claridad en el trabajo', psicologo: ['Con estructura y orden en el trabajo clínico'], peso: 1 },
      { paciente: 'Que se adapte a mi ritmo', psicologo: ['Flexible y abierto/a a adaptar el proceso'], peso: 1 },
      { paciente: 'Que me explique las cosas con base', psicologo: ['Tiende puentes entre teoría y práctica'], peso: 1 },
      { paciente: 'Que me ayude a pensar en profundidad', psicologo: ['Reflexivo/a y promotor/a de la introspección'], peso: 1 }
    ],

    // Mapeos de enfoque teórico
    mapeosEnfoque: [
      { paciente: 'Quiero herramientas prácticas para sentirme mejor', psicologo: ['Cognitivo-Conductual (TCC)', 'Integrativo'], peso: 1 },
      { paciente: 'Quiero entender por qué me pasa lo que me pasa', psicologo: ['Psicoanalítico', 'Psicodinámico', 'Humanista'], peso: 1 },
      { paciente: 'Prefiero que el/la terapeuta me guíe activamente', psicologo: ['Cognitivo-Conductual', 'Sistémico', 'Integrativo'], peso: 1 },
      { paciente: 'Necesito solo hablar y sentirme escuchado/a sin juicios', psicologo: ['Humanista', 'Psicoanalítico'], peso: 1 },
      { paciente: 'Me interesa trabajar temas de infancia o vínculos familiares', psicologo: ['Psicoanalítico', 'Sistémico'], peso: 1 },
      { paciente: 'Tengo un objetivo puntual o específico que quiero resolver', psicologo: ['Cognitivo-Conductual', 'Sistémico', 'Terapia Breve', 'Integrativo'], peso: 1 },
      { paciente: 'Quiero que me dejen avanzar a mi ritmo, sin tanta intervención', psicologo: ['Humanista', 'Psicoanalítico'], peso: 1 },
      { paciente: 'Estoy en crisis y necesito contención urgente', psicologo: ['Humanista', 'Sistémico', 'Integrativo'], peso: 1 },
      { paciente: 'Estoy buscando mejorar la relación con mi pareja o mi familia', psicologo: ['Sistémico'], peso: 1 },
      { paciente: 'Quiero alguien que me enseñe técnicas para manejar mis emociones o mis pensamientos', psicologo: ['Cognitivo-Conductual', 'Terapia Racional Emotiva', 'EMDR', 'Integrativo'], peso: 1 },
      { paciente: 'Me interesa trabajar desde el cuerpo o lo experiencial', psicologo: ['Gestalt', 'Terapias Corporales'], peso: 1 },
      { paciente: 'Me interesa una terapia con respaldo científico comprobado', psicologo: ['Cognitivo-Conductual', 'Terapia Basada en la Evidencia', 'Integrativo'], peso: 1 },
      { paciente: 'Busco un espacio para explorar mi mundo interior, sin apuro', psicologo: ['Psicoanalítico', 'Humanista'], peso: 1 },
      { paciente: 'Me interesa una terapia con estructura, pasos y plazos claros', psicologo: ['Cognitivo-Conductual', 'Sistémico', 'Terapia Breve Estratégica'], peso: 1 }
    ],

    // Mapeos de afinidad personal
    mapeosAfinidad: [
      { paciente: 'Genuino/a', psicologo: ['Genuino/a y transparente'], peso: 1 },
      { paciente: 'Cariñoso/a', psicologo: ['Cariñoso/a o de trato cálido'], peso: 1 },
      { paciente: 'Alegre', psicologo: ['Alegres o con energía vital positiva'], peso: 1 },
      { paciente: 'Reflexivo/a', psicologo: ['Reflexivo/a o con disposición a mirar hacia adentro'], peso: 1 },
      { paciente: 'Respetuoso/a', psicologo: ['De trato respetuoso y abierto/a a otras formas de pensar'], peso: 1 },
      { paciente: 'Confiable', psicologo: ['Confiable o comprometido/a con el proceso'], peso: 1 },
      { paciente: 'Sensible', psicologo: ['Sensible ante lo que viven otros/as'], peso: 1 },
      { paciente: 'Divertido/a', psicologo: ['Divertido/a o con humor inteligente'], peso: 1 },
      { paciente: 'Dispuesto/a al cambio', psicologo: ['Dispuesto/a a aprender o cambiar'], peso: 1 },
      { paciente: 'Reservado/a', psicologo: ['Reservado/a, pero receptivo/a'], peso: 1 },
      { paciente: 'Expresivo/a', psicologo: ['Espontáneo/a y expresivo/a'], peso: 1 },
      { paciente: 'Colaborativo/a', psicologo: ['Colaborativo/a o con ganas de construir en conjunto'], peso: 1 },
      { paciente: 'Honesto/a', psicologo: ['Honesto/a, aunque a veces le cueste expresarse'], peso: 1 },
      { paciente: 'Cauteloso/a', psicologo: ['Cauteloso/a, pero comprometido/a'], peso: 1 },
      { paciente: 'Flexible', psicologo: ['Flexible ante nuevas perspectivas'], peso: 1 },
      { paciente: 'Entusiasta', psicologo: ['Entusiasta o motivado/a'], peso: 1 },
      { paciente: 'Crítico/a constructivo/a', psicologo: ['Con mirada crítica pero constructiva'], peso: 1 },
      { paciente: 'Intenso/a emocionalmente', psicologo: ['Emocionalmente intenso/a'], peso: 1 },
      { paciente: 'Paciente', psicologo: ['Paciente o con ritmo propio'], peso: 1 },
      { paciente: 'Introspectivo/a', psicologo: ['Introspectivo/a y profundo/a'], peso: 1 }
    ]
  };

  /**
   * Calcula el matching entre un paciente y todos los psicólogos disponibles
   */
  async calcularMatching(pacienteId: string): Promise<ResultadoMatching[]> {
    // Obtener perfil del paciente
    const paciente = await this.pacienteRepository.findOne({
      where: { id: pacienteId },
      relations: ['usuario']
    });

    if (!paciente) {
      throw new Error('Paciente no encontrado');
    }

    // Obtener todos los psicólogos activos
    const psicologos = await this.psicologoRepository.find({
      relations: ['usuario']
    });

    const resultados: ResultadoMatching[] = [];

    for (const psicologo of psicologos) {
      const resultado = await this.calcularMatchingIndividual(paciente, psicologo);
      resultados.push(resultado);
    }

    // Ordenar por puntaje total descendente
    return resultados.sort((a, b) => b.puntajeTotal - a.puntajeTotal);
  }

  /**
   * Calcula el matching directamente con las respuestas del formulario (sin persistir paciente)
   */
  async calcularMatchingConRespuestas(respuestasFormulario: any): Promise<ResultadoMatching[]> {
    // Obtener todos los psicólogos activos
    const psicologos = await this.psicologoRepository.find({
      relations: ['usuario']
    });

    const resultados: ResultadoMatching[] = [];

    for (const psicologo of psicologos) {
      const resultado = await this.calcularMatchingIndividualConRespuestas(respuestasFormulario, psicologo);
      resultados.push(resultado);
    }

    // Ordenar por puntaje total descendente
    return resultados.sort((a, b) => b.puntajeTotal - a.puntajeTotal);
  }

  /**
   * Calcula el matching entre un paciente y un psicólogo específico
   */
  private async calcularMatchingIndividual(
    paciente: Paciente, 
    psicologo: Psicologo
  ): Promise<ResultadoMatching> {
    
    // Calcular puntajes por criterio
    const puntajeDiagnosticos = this.calcularPuntajeDiagnosticos(paciente, psicologo);
    const puntajeTemas = this.calcularPuntajeTemas(paciente, psicologo);
    const puntajeEstilo = this.calcularPuntajeEstilo(paciente, psicologo);
    const puntajeEnfoque = this.calcularPuntajeEnfoque(paciente, psicologo);
    const puntajeAfinidad = this.calcularPuntajeAfinidad(paciente, psicologo);
    const puntajeFiltros = this.calcularPuntajeFiltros(paciente, psicologo);

    // Calcular puntaje total ponderado
    const puntajeTotal = 
      puntajeDiagnosticos * 0.35 +
      puntajeTemas * 0.25 +
      puntajeEstilo * 0.20 +
      puntajeEnfoque * 0.10 +
      puntajeAfinidad * 0.10;

    // Calcular porcentaje de coincidencia
    const porcentajeCoincidencia = (puntajeTotal / 100) * 100;

    return {
      psicologoId: psicologo.id,
      nombrePsicologo: `${psicologo.usuario.nombre} ${psicologo.usuario.apellido}`,
      puntajeTotal: Math.round(puntajeTotal * 100) / 100,
      puntajeDiagnosticos: Math.round(puntajeDiagnosticos * 100) / 100,
      puntajeTemas: Math.round(puntajeTemas * 100) / 100,
      puntajeEstilo: Math.round(puntajeEstilo * 100) / 100,
      puntajeEnfoque: Math.round(puntajeEnfoque * 100) / 100,
      puntajeAfinidad: Math.round(puntajeAfinidad * 100) / 100,
      puntajeFiltros: Math.round(puntajeFiltros * 100) / 100,
      coincidencias: {
        diagnosticos: this.obtenerCoincidencias(paciente.diagnosticos_principales, psicologo.diagnosticos_experiencia, this.configuracionMatching.mapeosDiagnosticos),
        temas: this.obtenerCoincidencias(paciente.temas_principales, psicologo.temas_experiencia, this.configuracionMatching.mapeosTemas),
        estilo: this.obtenerCoincidencias(paciente.estilo_terapeutico_preferido, psicologo.estilo_terapeutico, this.configuracionMatching.mapeosEstilo),
        enfoque: this.obtenerCoincidencias(paciente.enfoque_teorico_preferido, psicologo.enfoque_teorico, this.configuracionMatching.mapeosEnfoque),
        afinidad: this.obtenerCoincidencias(paciente.afinidad_personal_preferida, psicologo.afinidad_paciente_preferida, this.configuracionMatching.mapeosAfinidad),
        filtros: this.obtenerCoincidenciasFiltros(paciente, psicologo)
      },
      porcentajeCoincidencia: Math.round(porcentajeCoincidencia * 100) / 100
    };
  }

  /**
   * Calcula el matching entre las respuestas del formulario y un psicólogo específico
   */
  private async calcularMatchingIndividualConRespuestas(
    respuestasFormulario: any, 
    psicologo: Psicologo
  ): Promise<ResultadoMatching> {
    
    // Calcular puntajes por criterio usando las respuestas del formulario
    const puntajeDiagnosticos = this.calcularPuntajeDiagnosticosConRespuestas(respuestasFormulario, psicologo);
    const puntajeTemas = this.calcularPuntajeTemasConRespuestas(respuestasFormulario, psicologo);
    const puntajeEstilo = this.calcularPuntajeEstiloConRespuestas(respuestasFormulario, psicologo);
    const puntajeEnfoque = this.calcularPuntajeEnfoqueConRespuestas(respuestasFormulario, psicologo);
    const puntajeAfinidad = this.calcularPuntajeAfinidadConRespuestas(respuestasFormulario, psicologo);
    const puntajeFiltros = this.calcularPuntajeFiltrosConRespuestas(respuestasFormulario, psicologo);

    // Calcular puntaje total ponderado
    const puntajeTotal = 
      puntajeDiagnosticos * 0.35 +
      puntajeTemas * 0.25 +
      puntajeEstilo * 0.20 +
      puntajeEnfoque * 0.10 +
      puntajeAfinidad * 0.10;

    // Calcular porcentaje de coincidencia
    const porcentajeCoincidencia = (puntajeTotal / 100) * 100;

    return {
      psicologoId: psicologo.id,
      nombrePsicologo: `${psicologo.usuario.nombre} ${psicologo.usuario.apellido}`,
      puntajeTotal: Math.round(puntajeTotal * 100) / 100,
      puntajeDiagnosticos: Math.round(puntajeDiagnosticos * 100) / 100,
      puntajeTemas: Math.round(puntajeTemas * 100) / 100,
      puntajeEstilo: Math.round(puntajeEstilo * 100) / 100,
      puntajeEnfoque: Math.round(puntajeEnfoque * 100) / 100,
      puntajeAfinidad: Math.round(puntajeAfinidad * 100) / 100,
      puntajeFiltros: Math.round(puntajeFiltros * 100) / 100,
      coincidencias: {
        diagnosticos: this.obtenerCoincidencias(respuestasFormulario.diagnosticos_principales || [], psicologo.diagnosticos_experiencia, this.configuracionMatching.mapeosDiagnosticos),
        temas: this.obtenerCoincidencias(respuestasFormulario.temas_principales || [], psicologo.temas_experiencia, this.configuracionMatching.mapeosTemas),
        estilo: this.obtenerCoincidencias(respuestasFormulario.estilo_terapeutico_preferido || [], psicologo.estilo_terapeutico, this.configuracionMatching.mapeosEstilo),
        enfoque: this.obtenerCoincidencias(respuestasFormulario.enfoque_teorico_preferido || [], psicologo.enfoque_teorico, this.configuracionMatching.mapeosEnfoque),
        afinidad: this.obtenerCoincidencias(respuestasFormulario.afinidad_personal_preferida || [], psicologo.afinidad_paciente_preferida, this.configuracionMatching.mapeosAfinidad),
        filtros: this.obtenerCoincidenciasFiltrosConRespuestas(respuestasFormulario, psicologo)
      },
      porcentajeCoincidencia: Math.round(porcentajeCoincidencia * 100) / 100
    };
  }

  /**
   * Calcula el puntaje de diagnósticos (35%)
   */
  private calcularPuntajeDiagnosticos(paciente: Paciente, psicologo: Psicologo): number {
    return this.calcularPuntajeCriterio(
      paciente.diagnosticos_principales,
      psicologo.diagnosticos_experiencia,
      this.configuracionMatching.mapeosDiagnosticos
    );
  }

  /**
   * Calcula el puntaje de temas (25%)
   */
  private calcularPuntajeTemas(paciente: Paciente, psicologo: Psicologo): number {
    return this.calcularPuntajeCriterio(
      paciente.temas_principales,
      psicologo.temas_experiencia,
      this.configuracionMatching.mapeosTemas
    );
  }

  /**
   * Calcula el puntaje de estilo terapéutico (20%)
   */
  private calcularPuntajeEstilo(paciente: Paciente, psicologo: Psicologo): number {
    return this.calcularPuntajeCriterio(
      paciente.estilo_terapeutico_preferido,
      psicologo.estilo_terapeutico,
      this.configuracionMatching.mapeosEstilo
    );
  }

  /**
   * Calcula el puntaje de enfoque teórico (10%)
   */
  private calcularPuntajeEnfoque(paciente: Paciente, psicologo: Psicologo): number {
    return this.calcularPuntajeCriterio(
      paciente.enfoque_teorico_preferido,
      psicologo.enfoque_teorico,
      this.configuracionMatching.mapeosEnfoque
    );
  }

  /**
   * Calcula el puntaje de afinidad personal (10%)
   */
  private calcularPuntajeAfinidad(paciente: Paciente, psicologo: Psicologo): number {
    return this.calcularPuntajeCriterio(
      paciente.afinidad_personal_preferida,
      psicologo.afinidad_paciente_preferida,
      this.configuracionMatching.mapeosAfinidad
    );
  }

  /**
   * Calcula el puntaje de filtros logísticos
   */
  private calcularPuntajeFiltros(paciente: Paciente, psicologo: Psicologo): number {
    let puntaje = 0;
    let totalFiltros = 0;

    // Filtro de género del psicólogo
    if (paciente.genero_psicologo_preferido.includes('Indiferente') || 
        paciente.genero_psicologo_preferido.includes(this.mapearGenero(psicologo.genero))) {
      puntaje += 1;
    }
    totalFiltros++;

    // Filtro de modalidad
    if (paciente.modalidad_preferida.includes('Indiferente') || 
        this.hayCoincidenciaModalidad(paciente.modalidad_preferida, psicologo.modalidad_atencion)) {
      puntaje += 1;
    }
    totalFiltros++;

    return totalFiltros > 0 ? (puntaje / totalFiltros) * 100 : 0;
  }

  // Métodos para calcular puntajes con respuestas del formulario
  private calcularPuntajeDiagnosticosConRespuestas(respuestasFormulario: any, psicologo: Psicologo): number {
    return this.calcularPuntajeCriterio(
      respuestasFormulario.diagnosticos_principales || [],
      psicologo.diagnosticos_experiencia,
      this.configuracionMatching.mapeosDiagnosticos
    );
  }

  private calcularPuntajeTemasConRespuestas(respuestasFormulario: any, psicologo: Psicologo): number {
    return this.calcularPuntajeCriterio(
      respuestasFormulario.temas_principales || [],
      psicologo.temas_experiencia,
      this.configuracionMatching.mapeosTemas
    );
  }

  private calcularPuntajeEstiloConRespuestas(respuestasFormulario: any, psicologo: Psicologo): number {
    return this.calcularPuntajeCriterio(
      respuestasFormulario.estilo_terapeutico_preferido || [],
      psicologo.estilo_terapeutico,
      this.configuracionMatching.mapeosEstilo
    );
  }

  private calcularPuntajeEnfoqueConRespuestas(respuestasFormulario: any, psicologo: Psicologo): number {
    return this.calcularPuntajeCriterio(
      respuestasFormulario.enfoque_teorico_preferido || [],
      psicologo.enfoque_teorico,
      this.configuracionMatching.mapeosEnfoque
    );
  }

  private calcularPuntajeAfinidadConRespuestas(respuestasFormulario: any, psicologo: Psicologo): number {
    return this.calcularPuntajeCriterio(
      respuestasFormulario.afinidad_personal_preferida || [],
      psicologo.afinidad_paciente_preferida,
      this.configuracionMatching.mapeosAfinidad
    );
  }

  private calcularPuntajeFiltrosConRespuestas(respuestasFormulario: any, psicologo: Psicologo): number {
    let puntaje = 0;
    let totalFiltros = 0;

    // Filtro de género del psicólogo
    if (respuestasFormulario.genero_psicologo_preferido?.includes('Indiferente') || 
        respuestasFormulario.genero_psicologo_preferido?.includes(this.mapearGenero(psicologo.genero))) {
      puntaje += 1;
    }
    totalFiltros++;

    // Filtro de modalidad
    if (respuestasFormulario.modalidad_preferida?.includes('Indiferente') || 
        this.hayCoincidenciaModalidad(respuestasFormulario.modalidad_preferida || [], psicologo.modalidad_atencion)) {
      puntaje += 1;
    }
    totalFiltros++;

    return totalFiltros > 0 ? (puntaje / totalFiltros) * 100 : 0;
  }

  private obtenerCoincidenciasFiltrosConRespuestas(respuestasFormulario: any, psicologo: Psicologo): string[] {
    const coincidencias: string[] = [];

    // Género del psicólogo
    if (respuestasFormulario.genero_psicologo_preferido?.includes('Indiferente') || 
        respuestasFormulario.genero_psicologo_preferido?.includes(this.mapearGenero(psicologo.genero))) {
      coincidencias.push(`Género: ${this.mapearGenero(psicologo.genero)}`);
    }

    // Modalidad
    if (respuestasFormulario.modalidad_preferida?.includes('Indiferente') || 
        this.hayCoincidenciaModalidad(respuestasFormulario.modalidad_preferida || [], psicologo.modalidad_atencion)) {
      const modalidadesCoincidentes = psicologo.modalidad_atencion.filter(m => 
        respuestasFormulario.modalidad_preferida?.includes(m) || respuestasFormulario.modalidad_preferida?.includes('Indiferente')
      );
      coincidencias.push(`Modalidad: ${modalidadesCoincidentes.join(', ')}`);
    }

    return coincidencias;
  }

  /**
   * Calcula el puntaje para un criterio específico
   */
  private calcularPuntajeCriterio(
    preferenciasPaciente: string[],
    experienciaPsicologo: string[],
    mapeos: MapeoCoincidencias[]
  ): number {
    if (!preferenciasPaciente || preferenciasPaciente.length === 0) {
      return 0;
    }

    let puntajeTotal = 0;
    let maxPuntaje = 0;

    for (const preferencia of preferenciasPaciente) {
      const mapeo = mapeos.find(m => m.paciente === preferencia);
      if (mapeo) {
        maxPuntaje += mapeo.peso;
        
        // Verificar si hay coincidencia con la experiencia del psicólogo
        const hayCoincidencia = mapeo.psicologo.some(exp => 
          experienciaPsicologo.includes(exp)
        );
        
        if (hayCoincidencia) {
          puntajeTotal += mapeo.peso;
        }
      }
    }

    return maxPuntaje > 0 ? (puntajeTotal / maxPuntaje) * 100 : 0;
  }

  /**
   * Obtiene las coincidencias específicas para un criterio
   */
  private obtenerCoincidencias(
    preferenciasPaciente: string[],
    experienciaPsicologo: string[],
    mapeos: MapeoCoincidencias[]
  ): string[] {
    const coincidencias: string[] = [];

    for (const preferencia of preferenciasPaciente) {
      const mapeo = mapeos.find(m => m.paciente === preferencia);
      if (mapeo) {
        const coincidenciasEncontradas = mapeo.psicologo.filter(exp => 
          experienciaPsicologo.includes(exp)
        );
        coincidencias.push(...coincidenciasEncontradas);
      }
    }

    return [...new Set(coincidencias)]; // Eliminar duplicados
  }

  /**
   * Obtiene las coincidencias de filtros logísticos
   */
  private obtenerCoincidenciasFiltros(paciente: Paciente, psicologo: Psicologo): string[] {
    const coincidencias: string[] = [];

    // Género del psicólogo
    if (paciente.genero_psicologo_preferido.includes('Indiferente') || 
        paciente.genero_psicologo_preferido.includes(this.mapearGenero(psicologo.genero))) {
      coincidencias.push(`Género: ${this.mapearGenero(psicologo.genero)}`);
    }

    // Modalidad
    if (paciente.modalidad_preferida.includes('Indiferente') || 
        this.hayCoincidenciaModalidad(paciente.modalidad_preferida, psicologo.modalidad_atencion)) {
      const modalidadesCoincidentes = psicologo.modalidad_atencion.filter(m => 
        paciente.modalidad_preferida.includes(m) || paciente.modalidad_preferida.includes('Indiferente')
      );
      coincidencias.push(`Modalidad: ${modalidadesCoincidentes.join(', ')}`);
    }

    return coincidencias;
  }

  /**
   * Mapea el género de la base de datos a texto legible
   */
  private mapearGenero(genero: string): string {
    switch (genero) {
      case 'M': return 'Hombre';
      case 'F': return 'Mujer';
      case 'N': return 'No binario';
      default: return 'No especificado';
    }
  }

  /**
   * Verifica si hay coincidencia de modalidad
   */
  private hayCoincidenciaModalidad(preferencias: string[], ofrecidas: string[]): boolean {
    return preferencias.some(pref => 
      ofrecidas.includes(pref) || pref === 'Indiferente'
    );
  }

  /**
   * Obtiene la configuración del sistema de matching
   */
  getConfiguracionMatching(): ConfiguracionMatching {
    return this.configuracionMatching;
  }

  // Método para crear/actualizar el perfil de matching de un psicólogo
  async crearPerfilMatchingPsicologo(
    psicologoId: string, 
    perfilDto: any
  ): Promise<Psicologo> {
    try {
      console.log(`[MatchingService] Iniciando creación de perfil para psicólogo: ${psicologoId}`);
      console.log(`[MatchingService] Datos recibidos:`, perfilDto);

      // Buscar si ya existe el psicólogo en la tabla CORRECTA
      let psicologo = await this.psicologoRepository.findOne({
        where: { id: psicologoId },
        relations: ['usuario']
      });

      if (!psicologo) {
        console.log(`[MatchingService] Psicólogo no existe, creando nuevo registro...`);
        
        // Buscar el usuario
        const usuario = await this.userRepository.findOne({
          where: { id: psicologoId }
        });

        if (!usuario) {
          throw new Error('Usuario no encontrado');
        }

        console.log(`[MatchingService] Usuario encontrado:`, usuario.email);

        // Crear nuevo psicólogo en la tabla CORRECTA
        psicologo = this.psicologoRepository.create({
          // NO especificar ID - se autogenera
          usuario: usuario,
          // Campos del formulario
          diagnosticos_experiencia: perfilDto.diagnosticos_experiencia || [],
          temas_experiencia: perfilDto.temas_experiencia || [],
          estilo_terapeutico: perfilDto.estilo_terapeutico || [],
          enfoque_teorico: perfilDto.enfoque_teorico || [],
          afinidad_paciente_preferida: perfilDto.afinidad_paciente_preferida || [],
          genero: perfilDto.genero,
          modalidad_atencion: Array.isArray(perfilDto.modalidad_atencion) 
            ? perfilDto.modalidad_atencion 
            : [perfilDto.modalidad_atencion],
          // Campos por defecto
          numeroRegistroProfesional: '',
          experiencia: 0,
          descripcion: '',
          precioPresencial: null as any,
          precioOnline: null as any
        });

        console.log(`[MatchingService] Nuevo psicólogo creado:`, psicologo);
      } else {
        console.log(`[MatchingService] Psicólogo existente encontrado, actualizando...`);
        
        // Actualizar campos existentes
        psicologo.diagnosticos_experiencia = perfilDto.diagnosticos_experiencia || [];
        psicologo.temas_experiencia = perfilDto.temas_experiencia || [];
        psicologo.estilo_terapeutico = perfilDto.estilo_terapeutico || [];
        psicologo.enfoque_teorico = perfilDto.enfoque_teorico || [];
        psicologo.afinidad_paciente_preferida = perfilDto.afinidad_paciente_preferida || [];
        psicologo.genero = perfilDto.genero;
        psicologo.modalidad_atencion = Array.isArray(perfilDto.modalidad_atencion) 
          ? perfilDto.modalidad_atencion 
          : [perfilDto.modalidad_atencion];
      }

      console.log(`[MatchingService] Guardando psicólogo...`);

      // Guardar el psicólogo (nuevo o actualizado)
      const psicologoActualizado = await this.psicologoRepository.save(psicologo);

      console.log(`[MatchingService] Psicólogo guardado exitosamente`);

      return psicologoActualizado;
    } catch (error) {
      console.error(`[MatchingService] Error al crear perfil de matching:`, error);
      throw error;
    }
  }

  // Método para crear/actualizar el perfil de matching de un paciente
  async crearPerfilMatchingPaciente(
    pacienteId: string, 
    perfilDto: any
  ): Promise<Paciente> {
    const paciente = await this.pacienteRepository.findOne({
      where: { id: pacienteId }
    });

    if (!paciente) {
      throw new Error('Paciente no encontrado');
    }

    // Actualizar los campos de matching
    paciente.diagnosticos_principales = perfilDto.diagnosticos_principales || [];
    paciente.temas_principales = perfilDto.temas_principales || [];
    paciente.estilo_terapeutico_preferido = perfilDto.estilo_terapeutico_preferido || [];
    paciente.enfoque_teorico_preferido = perfilDto.enfoque_teorico_preferido || [];
    paciente.afinidad_personal_preferida = perfilDto.afinidad_personal_preferida || [];
    paciente.genero = perfilDto.genero;
    paciente.modalidad_preferida = perfilDto.modalidad_preferida || [];
    paciente.genero_psicologo_preferido = perfilDto.genero_psicologo_preferido || [];
    paciente.perfil_matching_completado = true;
    paciente.ultima_actualizacion_matching = new Date();

    // Guardar el paciente actualizado
    return await this.pacienteRepository.save(paciente);
  }

  // Método para verificar si un psicólogo tiene perfil de matching completo
  async verificarPerfilCompleto(userId: string): Promise<boolean> {
    const psicologo = await this.psicologoRepository.findOne({
      where: { usuario: { id: userId } },
      relations: ['usuario']
    });

    if (!psicologo) {
      console.log(`[MatchingService] No se encontró psicólogo para usuario: ${userId}`);
      return false;
    }

    // Verificar que tenga al menos los campos básicos completos
    const perfilCompleto = (
      psicologo.diagnosticos_experiencia.length > 0 &&
      psicologo.temas_experiencia.length > 0 &&
      psicologo.estilo_terapeutico.length > 0 &&
      Boolean(psicologo.genero) &&
      psicologo.modalidad_atencion.length > 0
    );

    console.log(`[MatchingService] Verificación perfil completo para usuario ${userId}:`, {
      diagnosticos: psicologo.diagnosticos_experiencia.length,
      temas: psicologo.temas_experiencia.length,
      estilo: psicologo.estilo_terapeutico.length,
      genero: psicologo.genero,
      modalidad: psicologo.modalidad_atencion.length,
      perfilCompleto
    });

    return perfilCompleto;
  }

  // Método para activar la cuenta de un psicólogo cuando su perfil esté completo
  async activarCuentaPsicologo(userId: string): Promise<void> {
    try {
      // Buscar el psicólogo por usuario.id
      const psicologo = await this.psicologoRepository.findOne({
        where: { usuario: { id: userId } },
        relations: ['usuario']
      });

      if (!psicologo) {
        throw new Error(`Psicólogo no encontrado para usuario: ${userId}`);
      }

      if (!psicologo.usuario) {
        throw new Error('Usuario del psicólogo no encontrado');
      }

      console.log(`[MatchingService] Psicólogo encontrado para usuario ${userId}:`, {
        psicologoId: psicologo.id,
        usuarioId: psicologo.usuario.id,
        estadoActual: psicologo.usuario.estado
      });

      // Verificar que el perfil esté realmente completo antes de activar
      const perfilCompleto = await this.verificarPerfilCompleto(userId);
      if (!perfilCompleto) {
        throw new Error('El perfil del psicólogo no está completo');
      }

      // Cambiar el estado del usuario de PENDIENTE a ACTIVO
      if (psicologo.usuario.estado === 'PENDIENTE') {
        psicologo.usuario.estado = 'ACTIVO';
        await this.userRepository.save(psicologo.usuario);
        console.log(`[MatchingService] Usuario ${psicologo.usuario.id} activado exitosamente de PENDIENTE a ACTIVO`);
      } else {
        console.log(`[MatchingService] Usuario ${psicologo.usuario.id} ya está activo (estado: ${psicologo.usuario.estado})`);
      }
    } catch (error) {
      console.error(`[MatchingService] Error al activar cuenta del psicólogo para usuario ${userId}:`, error);
      throw error;
    }
  }

  // Método para obtener un paciente por ID
  async obtenerPaciente(pacienteId: string): Promise<Paciente | null> {
    return await this.pacienteRepository.findOne({
      where: { id: pacienteId }
    });
  }

  // Método para obtener un psicólogo por ID
  async obtenerPsicologo(psicologoId: string): Promise<Psicologo | null> {
    return await this.psicologoRepository.findOne({
      where: { id: psicologoId },
      relations: ['usuario']
    });
  }

  // Método para verificar si un paciente tiene perfil de matching completo
  async verificarPerfilPacienteCompleto(pacienteId: string): Promise<boolean> {
    const paciente = await this.pacienteRepository.findOne({
      where: { id: pacienteId }
    });

    if (!paciente) {
      return false;
    }

    return Boolean(paciente.perfil_matching_completado);
  }

  // Método para limpiar perfiles temporales (usado en endpoint público)
  async limpiarPerfilTemporal(pacienteTemporalId: string): Promise<void> {
    try {
      // Solo limpiar si es un ID temporal
      if (pacienteTemporalId.startsWith('temp_')) {
        const paciente = await this.pacienteRepository.findOne({
          where: { id: pacienteTemporalId }
        });
        
        if (paciente) {
          await this.pacienteRepository.remove(paciente);
          console.log(`[MatchingService] Perfil temporal ${pacienteTemporalId} eliminado`);
        }
      }
    } catch (error) {
      console.warn(`[MatchingService] Error al limpiar perfil temporal ${pacienteTemporalId}:`, error);
    }
  }
}
