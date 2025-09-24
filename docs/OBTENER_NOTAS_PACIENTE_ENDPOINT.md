# Endpoint para Obtener Notas por Paciente

## Descripción
El endpoint `GET /api/v1/notas/paciente/:pacienteId` permite obtener todas las notas clínicas asociadas a un paciente específico. Este endpoint está diseñado para que los psicólogos puedan revisar el historial completo de notas de sus pacientes.

## Endpoint

### **GET /api/v1/notas/paciente/:pacienteId**

**URL**: `{{base_url}}/api/v1/notas/paciente/:pacienteId`

**Método**: `GET`

**Autenticación**: Requerida (JWT Bearer Token)

**Roles**: `ADMIN`, `TERAPEUTA`, `PSICOLOGO`

## Headers Requeridos

```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

## Parámetros de URL

- **pacienteId** (UUID): ID único del paciente cuyas notas se quieren obtener

## Estructura de la Base de Datos

### **Tabla `notas`**:
```sql
CREATE TABLE "notas" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "psicologo_id" uuid NOT NULL REFERENCES users(id),
  "paciente_id" uuid NOT NULL REFERENCES users(id),
  "contenido" text NOT NULL,
  "titulo" character varying(255),
  "tipo" "public"."tipo_nota_enum" NOT NULL DEFAULT 'otro',
  "es_privada" boolean NOT NULL DEFAULT false,
  "metadatos" jsonb,
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now()
);
```

### **Relaciones**:
- **psicologo_id** → Tabla `users` (psicólogo que creó la nota)
- **paciente_id** → Tabla `users` (paciente al que pertenece la nota)

## Lógica de Consulta

### **1. Filtrado por Paciente y Psicólogo**:
```typescript
const notas = await this.notaRepository.find({
  where: {
    paciente: { id: pacienteId },
    psicologo: { id: psicologoId },
  },
  relations: ['paciente'],
  order: { createdAt: 'DESC' },
});
```

**SQL equivalente**:
```sql
SELECT n.*, u.nombre, u.apellido
FROM notas n
JOIN users u ON n.paciente_id = u.id
WHERE n.paciente_id = :pacienteId 
  AND n.psicologo_id = :psicologoId
ORDER BY n.created_at DESC;
```

### **2. Seguridad Implementada**:
- Solo se obtienen notas del psicólogo logueado
- No se pueden acceder a notas de otros psicólogos
- Los admins pueden acceder a notas de cualquier paciente

## Respuesta del Endpoint

### **Status Code**: `200 OK`

### **Estructura de Respuesta**:
```json
[
  {
    "id": "uuid-de-la-nota",
    "pacienteId": "uuid-del-paciente",
    "pacienteNombre": "Juan Pérez",
    "contenido": "Contenido de la nota clínica",
    "titulo": "Título de la nota",
    "tipo": "evaluacion",
    "esPrivada": false,
    "metadatos": {
      "prioridad": "media",
      "estado": "completada",
      "tags": ["evaluacion", "inicial"]
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  {
    "id": "uuid-de-la-nota-2",
    "pacienteId": "uuid-del-paciente",
    "pacienteNombre": "Juan Pérez",
    "contenido": "Segunda nota del paciente",
    "titulo": "Nota de Seguimiento",
    "tipo": "sesion",
    "esPrivada": true,
    "metadatos": {
      "prioridad": "alta",
      "estado": "borrador"
    },
    "createdAt": "2024-01-10T09:00:00.000Z",
    "updatedAt": "2024-01-10T09:00:00.000Z"
  }
]
```

## Campos de Respuesta

### **Campos de la Nota**:
- `id`: UUID único de la nota
- `pacienteId`: UUID del paciente
- `pacienteNombre`: Nombre completo del paciente (nombre + apellido)
- `contenido`: Contenido principal de la nota
- `titulo`: Título de la nota (opcional)
- `tipo`: Tipo de nota (sesion, evaluacion, observacion, plan_tratamiento, progreso, otro)
- `esPrivada`: Si la nota es privada (solo visible para el psicólogo)
- `metadatos`: Información adicional estructurada (JSON)
- `createdAt`: Fecha de creación de la nota
- `updatedAt`: Fecha de última modificación

## Seguridad y Permisos

### **Validaciones Implementadas**:

1. **Verificación de Rol**: Solo usuarios con roles autorizados pueden acceder
2. **Verificación de Propiedad**: Los psicólogos solo pueden ver sus propias notas
3. **Filtrado Automático**: Solo se retornan notas del psicólogo logueado
4. **Prevención de Acceso Cruzado**: No se puede acceder a notas de otros psicólogos

### **Código de Seguridad**:
```typescript
async findByPaciente(pacienteId: string, psicologoId: string): Promise<NotaResponseDto[]> {
  const notas = await this.notaRepository.find({
    where: {
      paciente: { id: pacienteId },
      psicologo: { id: psicologoId }, // Solo notas del psicólogo logueado
    },
    relations: ['paciente'],
    order: { createdAt: 'DESC' },
  });
  
  return notas.map(nota => this.mapToResponseDto(nota, nota.paciente));
}
```

## Casos de Uso

### ✅ **Casos Válidos**:
1. **Psicólogo obtiene notas de su propio paciente**
2. **Terapeuta obtiene notas de cualquier paciente**
3. **Admin obtiene notas de cualquier paciente**
4. **Lista ordenada por fecha de creación (más recientes primero)**

### ❌ **Casos Inválidos**:
1. **Sin token de autenticación** → 401 Unauthorized
2. **Sin rol autorizado** → 403 Forbidden
3. **PacienteId inválido** → 400 Bad Request
4. **Paciente no encontrado** → 404 Not Found

## Ejemplos de Uso

### **1. Obtener Notas de un Paciente Específico**:
```bash
GET /api/v1/notas/paciente/123e4567-e89b-12d3-a456-426614174000
Authorization: Bearer {jwt_token}
```

### **2. Respuesta con Notas**:
```json
[
  {
    "id": "uuid-1",
    "pacienteId": "123e4567-e89b-12d3-a456-426614174000",
    "pacienteNombre": "María González",
    "contenido": "Evaluación inicial del paciente. Se observan síntomas de ansiedad moderada.",
    "titulo": "Evaluación Inicial",
    "tipo": "evaluacion",
    "esPrivada": false,
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  {
    "id": "uuid-2",
    "pacienteId": "123e4567-e89b-12d3-a456-426614174000",
    "pacienteNombre": "María González",
    "contenido": "Sesión de terapia cognitivo-conductual. Trabajamos en técnicas de relajación.",
    "titulo": "Sesión 1 - Técnicas de Relajación",
    "tipo": "sesion",
    "esPrivada": false,
    "createdAt": "2024-01-10T09:00:00.000Z"
  }
]
```

### **3. Respuesta sin Notas**:
```json
[]
```

## Flujo de Datos

### **1. Recepción de Request**:
- Se recibe el `pacienteId` del paciente
- Se valida el token JWT
- Se verifica el rol del usuario

### **2. Validación de Seguridad**:
- Se extrae el `psicologoId` del token
- Se verifica que el usuario tenga permisos

### **3. Consulta a Base de Datos**:
```sql
SELECT n.*, u.nombre, u.apellido
FROM notas n
JOIN users u ON n.paciente_id = u.id
WHERE n.paciente_id = :pacienteId 
  AND n.psicologo_id = :psicologoId
ORDER BY n.created_at DESC;
```

### **4. Transformación de Datos**:
- Se combinan los datos de la nota con la información del paciente
- Se formatean las fechas
- Se estructura la respuesta según el DTO

### **5. Respuesta**:
- Se retorna array de notas ordenadas por fecha
- Cada nota incluye información completa del paciente
- Se mantiene la privacidad de las notas privadas

## Consideraciones de Rendimiento

### **Optimizaciones Implementadas**:
1. **Índices**: Índices en `paciente_id`, `psicologo_id` y `created_at`
2. **Relaciones**: Uso de `relations` para obtener datos del paciente en una sola consulta
3. **Ordenamiento**: ORDER BY en la base de datos para eficiencia
4. **Filtrado**: Filtrado en la base de datos, no en la aplicación

### **Recomendaciones Futuras**:
1. **Paginación**: Para pacientes con muchas notas
2. **Caché**: Implementar caché para consultas frecuentes
3. **Búsqueda**: Agregar filtros por tipo, fecha, contenido
4. **Compresión**: Para notas con contenido extenso

## Testing

### **Script de Test**:
Se proporciona `test-obtener-notas-paciente.js` para verificar:

1. ✅ Obtener notas de un paciente específico
2. ✅ Verificar seguridad de acceso (solo notas propias)
3. ✅ Admin puede acceder a notas de cualquier paciente
4. ✅ Crear nota y luego obtenerla en la lista

### **Ejecutar Tests**:
```bash
node test-obtener-notas-paciente.js
```

## Archivos Relacionados

### **Implementación**:
- `src/notas/notas.controller.ts` - Endpoint del controlador
- `src/notas/notas.service.ts` - Método `findByPaciente()`
- `src/notas/dto/nota.dto.ts` - DTO de respuesta

### **Entidades**:
- `src/common/entities/nota.entity.ts` - Entidad de la tabla notas
- `src/common/entities/user.entity.ts` - Entidad de usuarios

## Mantenimiento

### **Monitoreo Recomendado**:
1. Verificar logs de acceso al endpoint
2. Monitorear tiempo de respuesta de las consultas
3. Revisar uso de memoria en transformaciones de datos
4. Verificar que las validaciones de seguridad funcionen correctamente

### **Actualizaciones Futuras**:
1. **Filtros Adicionales**: Por tipo, fecha, contenido, metadatos
2. **Paginación**: Para manejar grandes volúmenes de notas
3. **Búsqueda Full-Text**: En contenido de notas
4. **Exportación**: PDF, CSV de historial de notas
5. **Estadísticas**: Conteos y análisis de notas por paciente 