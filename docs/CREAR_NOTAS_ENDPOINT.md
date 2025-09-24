# Endpoint para Crear Notas

## Descripción
El endpoint `POST /api/v1/notas` permite a psicólogos, terapeutas y administradores crear notas clínicas para sus pacientes. Las notas pueden ser de diferentes tipos y pueden incluir metadatos adicionales para mejor organización.

## Endpoint

### **POST /api/v1/notas**

**URL**: `{{base_url}}/api/v1/notas`

**Método**: `POST`

**Autenticación**: Requerida (JWT Bearer Token)

**Roles**: `ADMIN`, `TERAPEUTA`, `PSICOLOGO`

## Headers Requeridos

```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

## Estructura de la Base de Datos

### **Tabla `notas`**:
```sql
CREATE TABLE notas (
  id UUID PRIMARY KEY,
  psicologo_id UUID NOT NULL REFERENCES users(id),
  paciente_id UUID NOT NULL REFERENCES users(id),
  contenido TEXT NOT NULL,
  titulo VARCHAR(255) NULL,
  tipo VARCHAR(50) NOT NULL DEFAULT 'otro',
  es_privada BOOLEAN NOT NULL DEFAULT false,
  metadatos JSONB NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### **Enums de Tipo de Nota**:
```typescript
export enum TipoNota {
  SESION = 'sesion',                    // Notas de sesión terapéutica
  EVALUACION = 'evaluacion',            // Evaluaciones del paciente
  OBSERVACION = 'observacion',          // Observaciones generales
  PLAN_TRATAMIENTO = 'plan_tratamiento', // Planes de tratamiento
  PROGRESO = 'progreso',                // Notas de progreso
  OTRO = 'otro'                         // Otros tipos de notas
}
```

## Estructura de Request

### **Campos Obligatorios**:
```json
{
  "pacienteId": "uuid-del-paciente",
  "contenido": "Contenido de la nota"
}
```

### **Campos Opcionales**:
```json
{
  "pacienteId": "uuid-del-paciente",
  "contenido": "Contenido de la nota",
  "titulo": "Título opcional de la nota",
  "tipo": "evaluacion",
  "esPrivada": false,
  "metadatos": {
    "tags": ["evaluacion", "inicial"],
    "prioridad": "media",
    "estado": "completada",
    "fechaSesion": "2024-01-15"
  }
}
```

## Ejemplos de Request

### **1. Nota Básica (Mínima)**:
```json
{
  "pacienteId": "123e4567-e89b-12d3-a456-426614174000",
  "contenido": "El paciente mostró mejoría en su estado de ánimo durante la sesión."
}
```

### **2. Nota Completa**:
```json
{
  "pacienteId": "123e4567-e89b-12d3-a456-426614174000",
  "contenido": "Evaluación inicial del paciente. Se observan síntomas de ansiedad moderada con episodios de pánico ocasionales. El paciente refiere dificultades para dormir y concentrarse en el trabajo.",
  "titulo": "Evaluación Inicial - Paciente con Ansiedad",
  "tipo": "evaluacion",
  "esPrivada": false,
  "metadatos": {
    "tags": ["evaluacion", "ansiedad", "inicial"],
    "prioridad": "alta",
    "estado": "completada",
    "fechaSesion": "2024-01-15",
    "duracion": 60,
    "observaciones": "Paciente colaborativo y motivado para el tratamiento"
  }
}
```

### **3. Nota de Sesión**:
```json
{
  "pacienteId": "123e4567-e89b-12d3-a456-426614174000",
  "contenido": "Sesión de terapia cognitivo-conductual. Trabajamos en técnicas de respiración y relajación. El paciente practicó ejercicios de mindfulness y mostró buena disposición.",
  "titulo": "Sesión 3 - Técnicas de Relajación",
  "tipo": "sesion",
  "esPrivada": false,
  "metadatos": {
    "tags": ["sesion", "tcc", "relajacion"],
    "prioridad": "media",
    "estado": "completada",
    "fechaSesion": "2024-01-20",
    "duracion": 50,
    "tareas": ["Practicar respiración 10 min diarios", "Ejercicio de mindfulness antes de dormir"]
  }
}
```

### **4. Nota Privada**:
```json
{
  "pacienteId": "123e4567-e89b-12d3-a456-426614174000",
  "contenido": "Observaciones personales sobre la dinámica familiar del paciente. Posibles conflictos no resueltos con la figura paterna que podrían estar influyendo en su ansiedad.",
  "titulo": "Observaciones Familiares - Privado",
  "tipo": "observacion",
  "esPrivada": true,
  "metadatos": {
    "tags": ["familia", "conflicto", "paterno"],
    "prioridad": "alta",
    "estado": "borrador",
    "notas": "Explorar en próximas sesiones"
  }
}
```

## Respuesta del Endpoint

### **Status Code**: `201 Created`

### **Estructura de Respuesta**:
```json
{
  "id": "uuid-de-la-nota",
  "pacienteId": "uuid-del-paciente",
  "pacienteNombre": "Juan Pérez",
  "contenido": "Contenido de la nota",
  "titulo": "Título de la nota",
  "tipo": "evaluacion",
  "esPrivada": false,
  "metadatos": {
    "tags": ["evaluacion", "inicial"],
    "prioridad": "media",
    "estado": "completada"
  },
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

## Validaciones Implementadas

### **1. Validaciones de Campos**:
- **pacienteId**: Debe ser un UUID válido y el paciente debe existir
- **contenido**: Debe ser un string no vacío
- **titulo**: Opcional, máximo 255 caracteres
- **tipo**: Debe ser uno de los valores del enum TipoNota
- **esPrivada**: Opcional, boolean, por defecto false
- **metadatos**: Opcional, objeto JSON válido

### **2. Validaciones de Negocio**:
- El psicólogo que crea la nota debe existir
- El paciente debe existir en el sistema
- Solo usuarios autorizados pueden crear notas

### **3. Validaciones de Seguridad**:
- Verificación de token JWT
- Verificación de rol del usuario
- Asociación automática del psicólogo logueado

## Flujo de Creación

### **1. Validación de Entrada**:
```typescript
// Validar DTO usando class-validator
const createNotaDto = plainToClass(CreateNotaDto, requestBody);
await validate(createNotaDto);
```

### **2. Verificación de Usuarios**:
```typescript
// Verificar que el paciente existe
const paciente = await this.userRepository.findOne({ 
  where: { id: createNotaDto.pacienteId },
  select: ['id', 'nombre', 'apellido']
});

// Verificar que el psicólogo existe
const psicologo = await this.userRepository.findOne({ 
  where: { id: psicologoId },
  select: ['id', 'nombre', 'apellido']
});
```

### **3. Creación de la Nota**:
```typescript
const nota = this.notaRepository.create({
  psicologo: { id: psicologoId },
  paciente: { id: createNotaDto.pacienteId },
  contenido: createNotaDto.contenido,
  titulo: createNotaDto.titulo,
  tipo: createNotaDto.tipo || TipoNota.OTRO,
  esPrivada: createNotaDto.esPrivada || false,
  metadatos: createNotaDto.metadatos || {},
});
```

### **4. Persistencia y Respuesta**:
```typescript
const savedNota = await this.notaRepository.save(nota);
return this.mapToResponseDto(savedNota, paciente);
```

## Casos de Uso

### ✅ **Casos Válidos**:
1. **Psicólogo crea nota para su paciente**
2. **Terapeuta crea nota de evaluación**
3. **Admin crea nota para cualquier paciente**
4. **Nota con metadatos completos**
5. **Nota privada solo para el psicólogo**

### ❌ **Casos Inválidos**:
1. **Sin token de autenticación** → 401 Unauthorized
2. **Sin rol autorizado** → 403 Forbidden
3. **Sin pacienteId** → 400 Bad Request
4. **Sin contenido** → 400 Bad Request
5. **PacienteId inválido** → 400 Bad Request
6. **Tipo de nota inválido** → 400 Bad Request

## Metadatos Disponibles

### **Estructura de Metadatos**:
```typescript
metadatos: {
  tags?: string[];                    // Etiquetas para categorización
  prioridad?: 'baja' | 'media' | 'alta'; // Nivel de prioridad
  estado?: 'borrador' | 'completada' | 'archivada'; // Estado de la nota
  fechaSesion?: string;              // Fecha de sesión relacionada
  duracion?: number;                 // Duración en minutos
  tareas?: string[];                 // Tareas asignadas al paciente
  observaciones?: string;            // Observaciones adicionales
  [key: string]: any;                // Campos personalizados
}
```

### **Ejemplos de Uso de Metadatos**:
```json
// Para notas de sesión
{
  "duracion": 60,
  "tareas": ["Ejercicios de respiración", "Diario de pensamientos"],
  "objetivos": ["Reducir ansiedad", "Mejorar concentración"]
}

// Para evaluaciones
{
  "escala": "HAM-A",
  "puntuacion": 15,
  "interpretacion": "Ansiedad moderada"
}

// Para planes de tratamiento
{
  "fase": "inicial",
  "duracionEstimada": "8 semanas",
  "tecnicas": ["TCC", "Mindfulness", "Exposición gradual"]
}
```

## Seguridad y Privacidad

### **Notas Privadas**:
- Las notas marcadas como `esPrivada: true` solo son visibles para el psicólogo que las creó
- No aparecen en búsquedas generales
- Se mantienen confidenciales del paciente

### **Acceso por Rol**:
- **PSICOLOGO**: Solo puede crear notas para sus propios pacientes
- **TERAPEUTA**: Puede crear notas para cualquier paciente
- **ADMIN**: Puede crear notas para cualquier paciente

### **Auditoría**:
- Todas las notas registran fecha de creación y modificación
- Se mantiene trazabilidad del psicólogo creador
- Los metadatos permiten seguimiento del progreso

## Testing

### **Script de Test**:
Se proporciona `test-crear-nota.js` para verificar:

1. ✅ Crear nota básica con todos los campos
2. ✅ Crear nota con datos mínimos (solo obligatorios)
3. ✅ Crear nota privada
4. ✅ Crear notas con diferentes tipos
5. ✅ Validar campos requeridos
6. ✅ Verificar permisos de admin

### **Ejecutar Tests**:
```bash
node test-crear-nota.js
```

## Consideraciones de Rendimiento

### **Optimizaciones Implementadas**:
1. **Validación Eficiente**: Uso de class-validator para validación rápida
2. **Consultas Selectivas**: Solo se obtienen campos necesarios de usuarios
3. **Transacciones**: Creación atómica de la nota
4. **Índices Recomendados**: En `paciente_id` y `psicologo_id`

### **Recomendaciones Futuras**:
1. **Caché**: Implementar caché para pacientes frecuentes
2. **Paginación**: Para listados de notas
3. **Búsqueda Full-Text**: En contenido de notas
4. **Archivado**: Sistema de archivado automático

## Archivos Relacionados

### **Implementación**:
- `src/notas/notas.controller.ts` - Controlador del endpoint
- `src/notas/notas.service.ts` - Lógica de negocio
- `src/notas/dto/nota.dto.ts` - DTOs de entrada y salida
- `src/common/entities/nota.entity.ts` - Entidad de la base de datos

### **Dependencias**:
- `class-validator` para validación de entrada
- `class-transformer` para transformación de datos
- `typeorm` para persistencia en base de datos

## Mantenimiento

### **Monitoreo Recomendado**:
1. Verificar logs de creación de notas
2. Monitorear tiempo de respuesta del endpoint
3. Revisar uso de metadatos y tipos de nota
4. Verificar que las validaciones funcionen correctamente

### **Actualizaciones Futuras**:
1. **Tipos de Nota**: Agregar nuevos tipos según necesidades clínicas
2. **Metadatos**: Expandir estructura de metadatos
3. **Plantillas**: Sistema de plantillas para notas comunes
4. **Integración**: Con otros módulos del sistema 