# Endpoint para Historial de Paciente

## Descripción
El endpoint `POST /api/v1/gestion/historial-paciente` permite crear nuevos registros en la tabla `historial_paciente` para documentar eventos, cambios o información relevante sobre un paciente.

## Endpoints Disponibles

### **1. Crear Nuevo Registro**
- **POST** `/api/v1/gestion/historial-paciente`

### **2. Obtener Todos los Registros**
- **GET** `/api/v1/gestion/historial-paciente`

### **3. Obtener Registro por ID**
- **GET** `/api/v1/gestion/historial-paciente/:id`

### **4. Actualizar Registro**
- **PUT** `/api/v1/gestion/historial-paciente/:id`

### **5. Eliminar Registro**
- **DELETE** `/api/v1/gestion/historial-paciente/:id`

### **6. Obtener Historial de un Paciente Específico**
- **GET** `/api/v1/gestion/historial-paciente/paciente/:idUsuarioPaciente`

## Estructura de la Base de Datos

### **Tabla `historial_paciente`**:
```sql
CREATE TABLE "historial_paciente" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "tipo" varchar NOT NULL,
  "id_usuario_paciente" uuid NOT NULL,
  "descripcion" text NOT NULL,
  "url" varchar NULL
);
```

### **Campos**:
- `id`: UUID único (generado automáticamente)
- `tipo`: Tipo de evento/registro (ej: "cambio_estado", "nueva_sesion", "observacion")
- `idUsuarioPaciente`: UUID del paciente al que pertenece el registro
- `descripcion`: Descripción detallada del evento
- `url`: URL opcional relacionada con el registro

## Crear Nuevo Registro (POST)

### **Endpoint**: `POST /api/v1/gestion/historial-paciente`

### **Headers**:
```
Content-Type: application/json
```

### **Body (JSON)**:
```json
{
  "tipo": "cambio_estado",
  "idUsuarioPaciente": "8038e306-f933-472f-a0ce-c69023cb87b2",
  "descripcion": "El paciente cambió de estado de 'ACTIVO' a 'EN_TRATAMIENTO' debido a nueva evaluación psicológica",
  "url": "https://ejemplo.com/documento-relacionado.pdf"
}
```

### **Ejemplos de Uso**:

#### **Ejemplo 1: Cambio de Estado del Paciente**
```json
{
  "tipo": "cambio_estado",
  "idUsuarioPaciente": "8038e306-f933-472f-a0ce-c69023cb87b2",
  "descripcion": "Paciente cambió de estado 'ACTIVO' a 'EN_TRATAMIENTO'. Se inició terapia cognitivo-conductual para ansiedad moderada.",
  "url": null
}
```

#### **Ejemplo 2: Nueva Sesión Registrada**
```json
{
  "tipo": "nueva_sesion",
  "idUsuarioPaciente": "8038e306-f933-472f-a0ce-c69023cb87b2",
  "descripcion": "Se registró la primera sesión de terapia. Duración: 50 minutos. Técnicas aplicadas: respiración diafragmática y relajación muscular progresiva.",
  "url": "https://psicoespacios.com/sesiones/12345"
}
```

#### **Ejemplo 3: Observación Clínica**
```json
{
  "tipo": "observacion_clinica",
  "idUsuarioPaciente": "8038e306-f933-472f-a0ce-c69023cb87b2",
  "descripcion": "Paciente presenta mejoría en síntomas de ansiedad. Se redujo la frecuencia de ataques de pánico de 3 por semana a 1 por semana.",
  "url": null
}
```

#### **Ejemplo 4: Cambio de Psicólogo**
```json
{
  "tipo": "cambio_psicologo",
  "idUsuarioPaciente": "8038e306-f933-472f-a0ce-c69023cb87b2",
  "descripcion": "Paciente fue reasignado del Dr. Juan Pérez al Dr. María González debido a especialización en trastornos de ansiedad.",
  "url": "https://psicoespacios.com/psicologos/maria-gonzalez"
}
```

#### **Ejemplo 5: Evaluación Psicológica**
```json
{
  "tipo": "evaluacion_psicologica",
  "idUsuarioPaciente": "8038e306-f933-472f-a0ce-c69023cb87b2",
  "descripcion": "Se realizó evaluación psicológica completa. Diagnóstico: Trastorno de Ansiedad Generalizada (F41.1). Puntuación en escala de ansiedad: 28/40 (moderada).",
  "url": "https://psicoespacios.com/evaluaciones/eval-12345"
}
```

## Respuesta del Endpoint

### **Status Code**: `201 Created`

### **Estructura de Respuesta**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "tipo": "cambio_estado",
  "idUsuarioPaciente": "8038e306-f933-472f-a0ce-c69023cb87b2",
  "descripcion": "El paciente cambió de estado de 'ACTIVO' a 'EN_TRATAMIENTO' debido a nueva evaluación psicológica",
  "url": "https://ejemplo.com/documento-relacionado.pdf"
}
```

## Tipos de Registro Recomendados

### **Estados del Paciente**:
- `cambio_estado`: Cambios en el estado del paciente
- `alta_paciente`: Cuando un paciente es dado de alta
- `reactivacion`: Cuando un paciente inactivo vuelve a activarse

### **Sesiones y Tratamiento**:
- `nueva_sesion`: Registro de nueva sesión de terapia
- `cambio_tratamiento`: Modificaciones en el plan de tratamiento
- `finalizacion_tratamiento`: Completado del tratamiento

### **Evaluaciones**:
- `evaluacion_inicial`: Primera evaluación del paciente
- `evaluacion_seguimiento`: Evaluaciones de seguimiento
- `cambio_diagnostico`: Modificaciones en el diagnóstico

### **Administrativos**:
- `cambio_psicologo`: Reasignación de psicólogo
- `cambio_sede`: Cambio de sede de atención
- `observacion_clinica`: Observaciones médicas/psicológicas

### **Otros**:
- `nota_importante`: Información relevante del paciente
- `documento_agregado`: Nuevos documentos en el expediente
- `emergencia`: Situaciones de emergencia o crisis

## Validaciones

### **Campos Requeridos**:
- `tipo`: Debe ser una cadena no vacía
- `idUsuarioPaciente`: Debe ser un UUID válido
- `descripcion`: Debe ser una cadena no vacía

### **Campos Opcionales**:
- `url`: Puede ser null o una URL válida

### **Validaciones del Sistema**:
- El `idUsuarioPaciente` debe existir en la tabla `users`
- El `tipo` debe ser descriptivo y consistente
- La `descripcion` debe ser clara y detallada

## Casos de Uso Comunes

### **1. Seguimiento de Cambios de Estado**
```json
{
  "tipo": "cambio_estado",
  "idUsuarioPaciente": "8038e306-f933-472f-a0ce-c69023cb87b2",
  "descripcion": "Paciente cambió de 'EVALUACION' a 'EN_TRATAMIENTO'. Se aprobó plan de terapia de 12 sesiones.",
  "url": null
}
```

### **2. Registro de Sesiones**
```json
{
  "tipo": "nueva_sesion",
  "idUsuarioPaciente": "8038e306-f933-472f-a0ce-c69023cb87b2",
  "descripcion": "Sesión #5 completada. Tema: Técnicas de afrontamiento. Tarea asignada: Diario de pensamientos automáticos.",
  "url": "https://psicoespacios.com/sesiones/5"
}
```

### **3. Observaciones Clínicas**
```json
{
  "tipo": "observacion_clinica",
  "idUsuarioPaciente": "8038e306-f933-472f-a0ce-c69023cb87b2",
  "descripcion": "Paciente reporta mejoría significativa en síntomas de ansiedad. Puntuación en escala: 15/40 (leve).",
  "url": null
}
```

## Consultar Historial de un Paciente

### **Endpoint**: `GET /api/v1/gestion/historial-paciente/paciente/:idUsuarioPaciente`

### **Ejemplo**:
```bash
GET /api/v1/gestion/historial-paciente/paciente/8038e306-f933-472f-a0ce-c69023cb87b2
```

### **Respuesta**:
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "tipo": "evaluacion_inicial",
    "idUsuarioPaciente": "8038e306-f933-472f-a0ce-c69023cb87b2",
    "descripcion": "Primera evaluación psicológica del paciente. Se identificaron síntomas de ansiedad moderada.",
    "url": null
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "tipo": "nueva_sesion",
    "idUsuarioPaciente": "8038e306-f933-472f-a0ce-c69023cb87b2",
    "descripcion": "Sesión inicial de terapia. Duración: 60 minutos. Se estableció rapport y se explicó el plan de tratamiento.",
    "url": "https://psicoespacios.com/sesiones/1"
  }
]
```

## Mejores Prácticas

### **1. Tipos Consistentes**
- Usar tipos predefinidos y consistentes
- Documentar nuevos tipos en el equipo
- Mantener nomenclatura clara y descriptiva

### **2. Descripciones Detalladas**
- Incluir contexto relevante
- Especificar fechas cuando sea importante
- Mencionar personas involucradas
- Incluir métricas o puntuaciones si aplica

### **3. URLs Útiles**
- Enlazar a documentos relevantes
- Incluir enlaces a sesiones específicas
- Referenciar evaluaciones o reportes

### **4. Frecuencia de Registro**
- Registrar cambios importantes inmediatamente
- Mantener historial actualizado
- No sobrecargar con información trivial

## Ejemplo de Flujo Completo

### **1. Crear Registro de Evaluación Inicial**
```bash
POST /api/v1/gestion/historial-paciente
Content-Type: application/json

{
  "tipo": "evaluacion_inicial",
  "idUsuarioPaciente": "8038e306-f933-472f-a0ce-c69023cb87b2",
  "descripcion": "Evaluación inicial completada. Diagnóstico: Trastorno de Ansiedad Generalizada. Puntuación en escala de ansiedad: 32/40 (moderada-severa).",
  "url": "https://psicoespacios.com/evaluaciones/eval-inicial-123"
}
```

### **2. Crear Registro de Primera Sesión**
```bash
POST /api/v1/gestion/historial-paciente
Content-Type: application/json

{
  "tipo": "nueva_sesion",
  "idUsuarioPaciente": "8038e306-f933-472f-a0ce-c69023cb87b2",
  "descripcion": "Primera sesión de terapia completada. Duración: 60 minutos. Se estableció rapport, se explicó el plan de tratamiento y se enseñaron técnicas básicas de respiración.",
  "url": "https://psicoespacios.com/sesiones/sesion-1"
}
```

### **3. Consultar Historial Completo**
```bash
GET /api/v1/gestion/historial-paciente/paciente/8038e306-f933-472f-a0ce-c69023cb87b2
```

## Consideraciones Técnicas

### **Rendimiento**:
- Los registros se ordenan por fecha de creación
- Se recomienda paginación para pacientes con mucho historial
- Los índices están en `id_usuario_paciente` y `tipo`

### **Seguridad**:
- Validación de UUIDs
- Sanitización de URLs
- Control de acceso por roles

### **Mantenimiento**:
- Los registros no se eliminan físicamente
- Se mantiene integridad referencial
- Logs de todas las operaciones CRUD 