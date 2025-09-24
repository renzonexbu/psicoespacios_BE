# Sistema de Matching PsicoEspacios

## Descripción General

El Sistema de Matching de PsicoEspacios es un algoritmo inteligente que calcula la compatibilidad entre pacientes y psicólogos basándose en múltiples criterios ponderados. El sistema utiliza un enfoque científico para garantizar que cada paciente encuentre el psicólogo más adecuado para sus necesidades específicas.

## Arquitectura del Sistema

### Componentes Principales

1. **MatchingService**: Servicio principal que implementa el algoritmo de matching
2. **MatchingController**: Controlador que expone los endpoints de la API
3. **Entidades**: Psicologo y Paciente con campos de matching
4. **Enums**: Definiciones de todas las opciones disponibles
5. **DTOs**: Objetos de transferencia de datos
6. **Interfaces**: Contratos para el sistema de matching

### Estructura de Base de Datos

#### Tabla `psicologo`
- `diagnosticos_experiencia`: Array de diagnósticos en los que tiene experiencia
- `temas_experiencia`: Array de temas en los que tiene experiencia
- `estilo_terapeutico`: Array de estilos terapéuticos que practica
- `enfoque_teorico`: Array de enfoques teóricos que utiliza
- `afinidad_paciente_preferida`: Array de características de afinidad con pacientes
- `genero`: Género del psicólogo (M, F, N)
- `modalidad_atencion`: Array de modalidades de atención (Online, Presencial, Ambas)

#### Tabla `pacientes`
- `diagnosticos_principales`: Array de diagnósticos principales del paciente
- `temas_principales`: Array de temas principales que quiere trabajar
- `estilo_terapeutico_preferido`: Array de estilos terapéuticos preferidos
- `enfoque_teorico_preferido`: Array de enfoques teóricos preferidos
- `afinidad_personal_preferida`: Array de características de afinidad personal preferidas
- `genero`: Género del paciente (M, F, N)
- `modalidad_preferida`: Array de modalidades preferidas
- `genero_psicologo_preferido`: Array de géneros de psicólogo preferidos
- `perfil_matching_completado`: Boolean que indica si completó el perfil
- `ultima_actualizacion_matching`: Timestamp de la última actualización

## Algoritmo de Matching

### Criterios y Pesos

El sistema utiliza 5 criterios principales con los siguientes pesos:

1. **Coincidencias Diagnósticas (35%)**
   - Ansiedad ↔ Trastornos de ansiedad
   - Depresión ↔ Episodios depresivos
   - Pánico ↔ Trastornos de ansiedad
   - Y más...

2. **Coincidencias Temáticas (25%)**
   - Autoconocimiento ↔ Acompañamiento en procesos de autoconocimiento
   - Autoestima ↔ Fortalecimiento de la autoestima
   - Y más...

3. **Coincidencias de Estilo Terapéutico (20%)**
   - Que sea auténtico/a ↔ Auténtico/a y coherente consigo mismo/a
   - Que hable claro ↔ Comunicativo/a y claro/a al expresarse
   - Y más...

4. **Enfoque Teórico (10%)**
   - Quiero herramientas prácticas ↔ Cognitivo-Conductual, Integrativo
   - Quiero entender por qué me pasa ↔ Psicoanalítico, Psicodinámico, Humanista
   - Y más...

5. **Afinidad Personal (10%)**
   - Genuino/a ↔ Genuino/a y transparente
   - Cariñoso/a ↔ Cariñoso/a o de trato cálido
   - Y más...

### Filtros Logísticos

- **Género del psicólogo**: Hombre, Mujer, No binario, Indiferente
- **Modalidad de atención**: Online, Presencial, Ambas, Indiferente

### Cálculo del Puntaje

```typescript
puntajeTotal = 
  (puntajeDiagnosticos * 0.35) +
  (puntajeTemas * 0.25) +
  (puntajeEstilo * 0.20) +
  (puntajeEnfoque * 0.10) +
  (puntajeAfinidad * 0.10)
```

## API Endpoints

### 1. Calcular Matching
```http
POST /matching/calcular
Content-Type: application/json

{
  "pacienteId": "uuid-del-paciente"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Matching calculado exitosamente",
  "data": {
    "pacienteId": "uuid",
    "totalPsicologos": 15,
    "resultados": [
      {
        "psicologoId": "uuid",
        "nombrePsicologo": "Dr. Juan Pérez",
        "puntajeTotal": 85.5,
        "puntajeDiagnosticos": 90.0,
        "puntajeTemas": 80.0,
        "puntajeEstilo": 85.0,
        "puntajeEnfoque": 90.0,
        "puntajeAfinidad": 85.0,
        "puntajeFiltros": 100.0,
        "coincidencias": {
          "diagnosticos": ["Trastornos de ansiedad"],
          "temas": ["Acompañamiento en procesos de autoconocimiento"],
          "estilo": ["Auténtico/a y coherente consigo mismo/a"],
          "enfoque": ["Cognitivo-Conductual"],
          "afinidad": ["Genuino/a y transparente"],
          "filtros": ["Género: Hombre", "Modalidad: Online, Presencial"]
        },
        "porcentajeCoincidencia": 85.5
      }
    ]
  }
}
```

### 2. Obtener Configuración
```http
GET /matching/configuracion
```

### 3. Crear/Actualizar Perfil de Paciente
```http
POST /matching/paciente/perfil
Content-Type: application/json

{
  "diagnosticos_principales": ["Ansiedad", "Depresión"],
  "temas_principales": ["Autoconocimiento", "Autoestima"],
  "estilo_terapeutico_preferido": ["Que sea auténtico/a", "Que hable claro"],
  "enfoque_teorico_preferido": ["Cognitivo-Conductual", "Integrativo"],
  "afinidad_personal_preferida": ["Genuino/a", "Cariñoso/a"],
  "genero": "F",
  "modalidad_preferida": ["Online", "Presencial"],
  "genero_psicologo_preferido": ["Indiferente"]
}
```

### 4. Crear/Actualizar Perfil de Psicólogo
```http
POST /matching/psicologo/perfil
Content-Type: application/json

{
  "diagnosticos_experiencia": ["Trastornos de ansiedad", "Episodios depresivos"],
  "temas_experiencia": ["Acompañamiento en procesos de autoconocimiento"],
  "estilo_terapeutico": ["Auténtico/a y coherente consigo mismo/a"],
  "enfoque_teorico": ["Cognitivo-Conductual", "Integrativo"],
  "afinidad_paciente_preferida": ["Genuino/a y transparente"],
  "genero": "M",
  "modalidad_atencion": ["Online", "Presencial"]
}
```

### 5. Obtener Opciones Disponibles
```http
GET /matching/opciones
```

## Implementación del Frontend

### Formulario de Paciente

El formulario debe incluir 6 secciones:

1. **Diagnósticos Principales** (múltiple selección)
2. **Temas Principales** (múltiple selección)
3. **Estilo Terapéutico Preferido** (múltiple selección)
4. **Enfoque Teórico Preferido** (múltiple selección)
5. **Afinidad Personal Preferida** (múltiple selección)
6. **Filtros Logísticos** (selección única)

### Formulario de Psicólogo

El formulario debe incluir 6 secciones:

1. **Experiencia en Diagnósticos** (múltiple selección)
2. **Experiencia en Temas** (múltiple selección)
3. **Estilo Terapéutico** (múltiple selección)
4. **Enfoque Teórico** (múltiple selección)
5. **Afinidad con Pacientes** (múltiple selección)
6. **Filtros Logísticos** (selección única)

## Flujo de Uso

### 1. Registro de Psicólogo
1. El psicólogo se registra en el sistema
2. Completa el formulario de matching
3. El sistema guarda su perfil de matching

### 2. Registro de Paciente
1. El paciente se registra en el sistema
2. Completa el formulario de matching
3. El sistema guarda su perfil de matching

### 3. Cálculo de Matching
1. El paciente solicita encontrar psicólogos
2. El sistema ejecuta el algoritmo de matching
3. Retorna una lista ordenada por puntaje de compatibilidad

### 4. Selección y Contacto
1. El paciente revisa los resultados
2. Selecciona un psicólogo
3. Se establece el contacto inicial

## Consideraciones Técnicas

### Rendimiento
- Se utilizan índices GIN para arrays de PostgreSQL
- El algoritmo es O(n*m) donde n es el número de psicólogos y m es el número de criterios
- Se recomienda implementar caché para resultados frecuentes

### Escalabilidad
- El sistema puede manejar miles de psicólogos y pacientes
- Se puede implementar búsqueda por proximidad geográfica
- Se puede agregar filtros adicionales según necesidades

### Seguridad
- Solo los usuarios autenticados pueden acceder al sistema
- Los pacientes solo pueden ver su propio matching
- Los psicólogos solo pueden ver perfiles de pacientes que los hayan seleccionado

## Personalización del Sistema

### Modificar Pesos
Los pesos de los criterios se pueden modificar en el `MatchingService`:

```typescript
private readonly configuracionMatching: ConfiguracionMatching = {
  criterios: [
    { nombre: 'Diagnósticos', peso: 0.40, descripcion: 'Coincidencias Diagnósticas (40%)' },
    { nombre: 'Temas', peso: 0.20, descripcion: 'Coincidencias Temáticas (20%)' },
    // ... otros criterios
  ]
};
```

### Agregar Nuevos Criterios
1. Agregar el nuevo criterio a la entidad correspondiente
2. Crear los mapeos de coincidencias
3. Implementar la lógica de cálculo en el servicio
4. Actualizar la migración de base de datos

### Modificar Mapeos
Los mapeos de coincidencias se pueden modificar en el servicio:

```typescript
mapeosDiagnosticos: [
  { paciente: 'Nuevo Diagnóstico', psicologo: ['Nueva Experiencia'], peso: 1 },
  // ... otros mapeos
]
```

## Monitoreo y Analytics

### Métricas Recomendadas
- Tasa de éxito del matching (pacientes que contactan psicólogos)
- Tiempo promedio para encontrar psicólogo
- Distribución de puntajes de matching
- Criterios más/menos utilizados

### Logs del Sistema
- Todas las consultas de matching se registran
- Se guardan los parámetros de entrada y resultados
- Se monitorea el rendimiento del algoritmo

## Conclusiones

El Sistema de Matching de PsicoEspacios proporciona una base sólida y científica para conectar pacientes con psicólogos. El algoritmo ponderado garantiza que se consideren todos los aspectos importantes de la compatibilidad, mientras que la arquitectura modular permite fácil personalización y escalabilidad.

El sistema está diseñado para ser:
- **Preciso**: Utiliza mapeos específicos y validados
- **Flexible**: Permite personalización de criterios y pesos
- **Escalable**: Puede manejar grandes volúmenes de usuarios
- **Mantenible**: Código limpio y bien documentado
- **Seguro**: Implementa controles de acceso apropiados

