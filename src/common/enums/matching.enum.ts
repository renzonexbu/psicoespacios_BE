// Enums para el Sistema de Matching

// 1. Coincidencias Diagnósticas (35%)
export enum DiagnosticoPaciente {
  ANSIEDAD = 'Ansiedad',
  DEPRESION = 'Depresión',
  PANICO = 'Pánico',
  EMOCIONES_INTENSAS = 'Emociones intensas',
  PENSAMIENTOS_REPETITIVOS = 'Pensamientos repetitivos',
  FOBIA = 'Fobia',
  ANSIEDAD_SOCIAL = 'Ansiedad social',
  AUTOLESION = 'Autolesión',
  IDEACION_SUICIDA = 'Ideación suicida',
  TOC = 'TOC',
  TDAH = 'TDAH',
  IMPULSIVIDAD = 'Impulsividad',
  PERSONALIDAD = 'Personalidad',
  TEA = 'TEA',
  DIFICULTADES_ADAPTATIVAS = 'Dificultades adaptativas',
  SALUD_FISICA = 'Salud física',
  ALIMENTACION = 'Alimentación',
  CONSUMO_SUSTANCIAS = 'Consumo de alcohol o drogas',
  SEXUALIDAD_GENERO = 'Sexualidad / Género'
}

export enum DiagnosticoPsicologo {
  TRASTORNOS_ANSIEDAD = 'Trastornos de ansiedad (incluye crisis de pánico, ansiedad generalizada, ansiedad social)',
  EPISODIOS_DEPRESIVOS = 'Episodios depresivos o síntomas del ánimo bajo',
  PROCESOS_DEPRESIVOS = 'Procesos depresivos / Regulación emocional y manejo de impulsividad',
  TOC = 'Trastorno obsesivo compulsivo (TOC)',
  FOBIAS_ESPECIFICAS = 'Fobias específicas',
  CONDUCTAS_AUTOLESIVAS = 'Conductas autolesivas sin intención suicida',
  PENSAMIENTOS_SUICIDAS = 'Pensamientos suicidas o ideación sin planificación activa',
  TDAH_ADOLESCENTES = 'Trastorno de déficit atencional (TDAH) en adolescentes o adultos',
  REGULACION_EMOCIONAL = 'Regulación emocional y manejo de impulsividad',
  TRASTORNOS_PERSONALIDAD = 'Trastornos de personalidad leves a moderados',
  TEA_SIN_DISCAPACIDAD = 'Trastorno del espectro autista (TEA) sin discapacidad intelectual',
  TRASTORNOS_ADAPTATIVOS = 'Trastornos adaptativos',
  IMPACTO_PSICOLOGICO_MEDICO = 'Impacto psicológico por diagnóstico de enfermedad médica crónica',
  TRASTORNOS_ALIMENTACION = 'Trastornos de la conducta alimentaria (TCA)',
  CONSUMO_PROBLEMATICO = 'Consumo problemático de alcohol u otras sustancias',
  IDENTIDAD_GENERO = 'Dificultades relacionadas con la identidad de género o la orientación sexual / Disfunciones sexuales'
}

// 2. Coincidencias Temáticas (25%)
export enum TemaPaciente {
  AUTOCONOCIMIENTO = 'Autoconocimiento',
  AUTOESTIMA = 'Autoestima',
  AUTONOMIA = 'Autonomía',
  LIMITES = 'Límites',
  PERDON = 'Perdón',
  IDENTIDAD = 'Identidad',
  REGULACION_EMOCIONAL = 'Regulación emocional',
  SOBREEXIGENCIA = 'Sobreexigencia',
  EVITACION = 'Evitación',
  RELACIONES = 'Relaciones',
  PATRONES_VINCULARES = 'Patrones vinculares',
  CONFLICTOS_FAMILIARES = 'Conflictos familiares',
  PARENTALIDAD = 'Parentalidad',
  TRAUMA = 'Trauma',
  ABUSO = 'Abuso',
  DUELO = 'Duelo',
  CRISIS_EXISTENCIAL = 'Crisis existencial',
  CAMBIOS_VITALES = 'Cambios vitales',
  GENERO_SEXUALIDAD = 'Género y sexualidad',
  DISCRIMINACION = 'Discriminación'
}

export enum TemaPsicologo {
  ACOMPANIAMIENTO_AUTOCONOCIMIENTO = 'Acompañamiento en procesos de autoconocimiento',
  FORTALECIMIENTO_AUTOESTIMA = 'Fortalecimiento de la autoestima y la autovaloración',
  PROCESOS_INDIVIDUACION = 'Procesos de individuación o separación emocional de la familia de origen',
  DIFICULTADES_LIMITES = 'Dificultades para poner límites o cuidar el espacio personal',
  EXPLORACION_IDENTIDAD = 'Exploración de identidad personal / Procesamiento emocional',
  TEMATICAS_GENERO = 'Temáticas ligadas al género, diversidad e identidad sexual',
  REGULACION_EMOCIONAL_IMPULSIVIDAD = 'Regulación emocional y manejo de impulsividad',
  CULPABILIDAD_EXCESIVA = 'Culpabilidad excesiva o autoexigencia desmedida / Agotamiento emocional y estrés por sobreexigencia',
  EVITACION_EXPERIENCIAS = 'Evitación de experiencias dolorosas o toma de decisiones',
  CONFLICTOS_RELACIONES = 'Conflictos en relaciones cercanas (familia, pareja, amistades)',
  REPETICION_PATRONES = 'Repetición de patrones vinculares o conductuales',
  PARENTALIDAD_CRIANZA = 'Parentalidad y crianza',
  PROCESAMIENTO_TRAUMA = 'Procesamiento de experiencias traumáticas',
  PROCESAMIENTO_ABUSO = 'Procesamiento de experiencias de abuso (físico, emocional o sexual)',
  DUELO_PERDIDAS = 'Duelo por pérdidas significativas o rupturas importantes',
  CRISIS_VITALES = 'Crisis vitales o existenciales',
  ADAPTACION_CAMBIOS = 'Adaptación frente a cambios profundos o inesperados en la vida',
  VIVENCIAS_DISCRIMINACION = 'Vivencias de discriminación o exclusión'
}

// 3. Coincidencias de Estilo Terapéutico (20%)
export enum EstiloTerapeuticoPaciente {
  AUTENTICO = 'Que sea auténtico/a',
  HABLE_CLARO = 'Que hable claro y con calma',
  CONFIANZA = 'Que me haga sentir en confianza',
  CERCANIA_HUMANA = 'Que tenga cercanía humana',
  HUMOR = 'Que tenga algo de humor',
  PREOCUPACION = 'Que se preocupe por cómo estoy',
  VALORE_VINCULO = 'Que valore el vínculo',
  CONSTRUCCION_COMPARTIDA = 'Que construyamos el proceso juntos/as',
  ESCUCHAR_Y_DECIR = 'Que sepa escuchar, pero también decir lo que necesito',
  ORIENTACION = 'Que me oriente cuando lo necesito',
  ESTRUCTURA_CLARIDAD = 'Que tenga estructura y claridad en el trabajo',
  ADAPTACION_RITMO = 'Que se adapte a mi ritmo',
  EXPLICACION_BASE = 'Que me explique las cosas con base',
  PENSAR_PROFUNDIDAD = 'Que me ayude a pensar en profundidad'
}

export enum EstiloTerapeuticoPsicologo {
  AUTENTICO_COHERENTE = 'Auténtico/a y coherente consigo mismo/a',
  COMUNICATIVO_CLARO = 'Comunicativo/a y claro/a al expresarse',
  CERCANO_HUMANO = 'Cercano/a y humano/a en el vínculo',
  CALIDO_CUIDADOSO = 'Cálido/a y cuidadoso/a en la relación',
  DINAMICO_CREATIVO = 'Dinámico/a o con estrategias creativas',
  ATENTO_VINCULO = 'Atento/a al vínculo terapéutico como eje del proceso',
  HORIZONTAL_CONSTRUCCION = 'Horizontal, promueve una construcción compartida',
  ACTIVO_CONDUCCION = 'Activo/a en la conducción de las sesiones',
  ESTRUCTURA_ORDEN = 'Con estructura y orden en el trabajo clínico',
  FLEXIBLE_ADAPTACION = 'Flexible y abierto/a a adaptar el proceso',
  PUENTES_TEORIA_PRACTICA = 'Tiende puentes entre teoría y práctica',
  REFLEXIVO_INTROSPECCION = 'Reflexivo/a y promotor/a de la introspección'
}

// 4. Enfoque teórico (10%)
export enum EnfoqueTeorico {
  COGNITIVO_CONDUCTUAL = 'Cognitivo-Conductual',
  INTEGRATIVO = 'Integrativo',
  PSICOANALITICO = 'Psicoanalítico',
  PSICODINAMICO = 'Psicodinámico',
  HUMANISTA = 'Humanista',
  SISTEMICO = 'Sistémico',
  TERAPIA_BREVE = 'Terapia Breve',
  TERAPIA_RACIONAL_EMOTIVA = 'Terapia Racional Emotiva',
  EMDR = 'EMDR',
  GESTALT = 'Gestalt',
  TERAPIAS_CORPORALES = 'Terapias corporales',
  TERAPIA_BREVE_ESTRATEGICA = 'Terapia Breve Estratégica',
  TERAPIA_BASADA_EVIDENCIA = 'Terapia Basada en la Evidencia'
}

// 5. Afinidad Personal (10%)
export enum AfinidadPersonalPaciente {
  GENUINO = 'Genuino/a',
  CARINOSO = 'Cariñoso/a',
  ALEGRE = 'Alegre',
  REFLEXIVO = 'Reflexivo/a',
  RESPETUOSO = 'Respetuoso/a',
  CONFIABLE = 'Confiable',
  SENSIBLE = 'Sensible',
  DIVERTIDO = 'Divertido/a',
  DISPUESTO_CAMBIO = 'Dispuesto/a al cambio',
  RESERVADO = 'Reservado/a',
  EXPRESIVO = 'Expresivo/a',
  COLABORATIVO = 'Colaborativo/a',
  HONESTO = 'Honesto/a',
  CAUTELOSO = 'Cauteloso/a',
  FLEXIBLE = 'Flexible',
  ENTUSIASTA = 'Entusiasta',
  CRITICO_CONSTRUCTIVO = 'Crítico/a constructivo/a',
  INTENSO_EMOCIONALMENTE = 'Intenso/a emocionalmente',
  PACIENTE = 'Paciente',
  INTROSPECTIVO = 'Introspectivo/a'
}

export enum AfinidadPersonalPsicologo {
  GENUINO_TRANSPARENTE = 'Genuino/a y transparente',
  CARINOSO_TRATO_CALIDO = 'Cariñoso/a o de trato cálido',
  ALEGRES_ENERGIA = 'Alegres o con energía vital positiva',
  REFLEXIVO_DISPOSICION = 'Reflexivo/a o con disposición a mirar hacia adentro',
  TRATO_RESPETUOSO = 'De trato respetuoso y abierto/a a otras formas de pensar',
  CONFIABLE_COMPROMETIDO = 'Confiable o comprometido/a con el proceso',
  SENSIBLE_VIVENCIAS = 'Sensible ante lo que viven otros/as',
  DIVERTIDO_HUMOR = 'Divertido/a o con humor inteligente',
  DISPUESTO_APRENDER = 'Dispuesto/a a aprender o cambiar',
  RESERVADO_RECEPTIVO = 'Reservado/a, pero receptivo/a',
  ESPONTANEO_EXPRESIVO = 'Espontáneo/a y expresivo/a',
  COLABORATIVO_CONSTRUIR = 'Colaborativo/a o con ganas de construir en conjunto',
  HONESTO_EXPRESARSE = 'Honesto/a, aunque a veces le cueste expresarse',
  CAUTELOSO_COMPROMETIDO = 'Cauteloso/a, pero comprometido/a',
  FLEXIBLE_PERSPECTIVAS = 'Flexible ante nuevas perspectivas',
  ENTUSIASTA_MOTIVADO = 'Entusiasta o motivado/a',
  MIRADA_CRITICA = 'Con mirada crítica pero constructiva',
  INTENSO_EMOCIONALMENTE = 'Emocionalmente intenso/a',
  PACIENTE_RITMO = 'Paciente o con ritmo propio',
  INTROSPECTIVO_PROFUNDO = 'Introspectivo/a y profundo/a'
}

// 6. Filtros Logísticos
export enum Genero {
  HOMBRE = 'M',
  MUJER = 'F',
  NO_BINARIO = 'N'
}

export enum ModalidadAtencion {
  ONLINE = 'Online',
  PRESENCIAL = 'Presencial',
  AMBAS = 'Ambas',
  INDIFERENTE = 'Indiferente'
}

export enum GeneroPreferido {
  HOMBRE = 'Hombre',
  MUJER = 'Mujer',
  NO_BINARIO = 'No binario',
  INDIFERENTE = 'Indiferente'
}

