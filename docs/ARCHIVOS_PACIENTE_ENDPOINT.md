# Endpoint de Archivos Compartidos para Pacientes

## Descripción
El sistema permite a los pacientes ver todos los archivos que han compartido con su psicólogo a través de la tabla `historial_paciente`. Los archivos se filtran para mostrar solo aquellos que tienen una URL asociada.

## Endpoints Disponibles

### **1. Obtener Mis Archivos (Paciente)**
**GET** `/api/v1/pacientes/mis-archivos`

**Autenticación**: Requerida (JWT Bearer Token)
**Roles**: `PACIENTE`

**Query Parameters** (opcionales):
- `tipo`: Filtrar por tipo de archivo
- `fechaDesde`: Filtrar desde una fecha específica (ISO 8601)
- `fechaHasta`: Filtrar hasta una fecha específica (ISO 8601)

**Ejemplo**:
```bash
GET /api/v1/pacientes/mis-archivos?tipo=documento&fechaDesde=2024-01-01
```

**Respuesta**:
```json
[
  {
    "id": "uuid-del-archivo",
    "tipo": "documento",
    "descripcion": "Informe psicológico de la sesión #5",
    "url": "https://psicoespacios.com/archivos/informe-sesion-5.pdf",
    "fechaCreacion": "2024-01-15T10:30:00Z",
    "psicologo": {
      "id": "uuid-del-psicologo",
      "nombre": "Dr. Juan",
      "apellido": "Pérez"
    }
  }
]
```

### **2. Obtener Archivo Específico (Paciente)**
**GET** `/api/v1/pacientes/mis-archivos/:archivoId`

**Autenticación**: Requerida (JWT Bearer Token)
**Roles**: `PACIENTE`

**Respuesta**:
```json
{
  "id": "uuid-del-archivo",
  "tipo": "documento",
  "descripcion": "Informe psicológico de la sesión #5",
  "url": "https://psicoespacios.com/archivos/informe-sesion-5.pdf",
  "fechaCreacion": "2024-01-15T10:30:00Z",
  "psicologo": {
    "id": "uuid-del-psicologo",
    "nombre": "Dr. Juan",
    "apellido": "Pérez"
  }
}
```

### **3. Obtener Estadísticas de Archivos (Paciente)**
**GET** `/api/v1/pacientes/mis-archivos/estadisticas`

**Autenticación**: Requerida (JWT Bearer Token)
**Roles**: `PACIENTE`

**Respuesta**:
```json
{
  "totalArchivos": 15,
  "archivosPorTipo": {
    "documento": 8,
    "imagen": 4,
    "video": 2,
    "audio": 1
  },
  "ultimoArchivo": "2024-01-15T10:30:00Z"
}
```

### **4. Obtener Archivos de Paciente (Psicólogo/Admin)**
**GET** `/api/v1/pacientes/:pacienteId/archivos`

**Autenticación**: Requerida (JWT Bearer Token)
**Roles**: `PSICOLOGO`, `ADMIN`

**Query Parameters** (opcionales):
- `tipo`: Filtrar por tipo de archivo
- `fechaDesde`: Filtrar desde una fecha específica
- `fechaHasta`: Filtrar hasta una fecha específica

## Estructura de la Base de Datos

### **Tabla `historial_paciente`**:
```sql
CREATE TABLE "historial_paciente" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "tipo" character varying NOT NULL,
  "idUsuarioPaciente" uuid NOT NULL,
  "descripcion" text NOT NULL,
  "url" character varying,
  "createdAt" TIMESTAMP DEFAULT now(),
  CONSTRAINT "PK_historial_paciente" PRIMARY KEY ("id")
);
```

### **Campos**:
- `id`: UUID único del archivo
- `tipo`: Tipo de archivo (ej: "documento", "imagen", "video", "audio")
- `idUsuarioPaciente`: UUID del paciente propietario
- `descripcion`: Descripción del archivo
- `url`: URL del archivo (solo se muestran archivos con URL)
- `createdAt`: Fecha de creación del registro

## Tipos de Archivos Soportados

### **Tipos Comunes**:
- `documento`: PDFs, documentos de texto, informes
- `imagen`: Fotos, diagramas, gráficos
- `video`: Grabaciones de sesiones, videos educativos
- `audio`: Grabaciones de audio, meditaciones
- `formulario`: Cuestionarios, evaluaciones
- `tarea`: Tareas asignadas al paciente

## Filtros Disponibles

### **Por Tipo**:
```bash
GET /api/v1/pacientes/mis-archivos?tipo=documento
```

### **Por Rango de Fechas**:
```bash
GET /api/v1/pacientes/mis-archivos?fechaDesde=2024-01-01&fechaHasta=2024-01-31
```

### **Combinados**:
```bash
GET /api/v1/pacientes/mis-archivos?tipo=documento&fechaDesde=2024-01-01
```

## Seguridad y Permisos

### **Pacientes**:
- ✅ Solo pueden ver sus propios archivos
- ✅ Autenticación requerida con JWT
- ✅ Validación automática de permisos

### **Psicólogos**:
- ✅ Pueden ver archivos de sus pacientes asignados
- ✅ Validación de relación paciente-psicólogo

### **Admins**:
- ✅ Pueden ver archivos de cualquier paciente
- ✅ Acceso completo al sistema

## Ejemplos de Uso

### **1. Ver todos mis archivos**:
```javascript
const response = await fetch('/api/v1/pacientes/mis-archivos', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const archivos = await response.json();
```

### **2. Filtrar documentos del último mes**:
```javascript
const fechaDesde = new Date();
fechaDesde.setMonth(fechaDesde.getMonth() - 1);

const response = await fetch(
  `/api/v1/pacientes/mis-archivos?tipo=documento&fechaDesde=${fechaDesde.toISOString()}`,
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);
```

### **3. Obtener estadísticas**:
```javascript
const response = await fetch('/api/v1/pacientes/mis-archivos/estadisticas', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const stats = await response.json();
console.log(`Tienes ${stats.totalArchivos} archivos compartidos`);
```

## Migración de Base de Datos

Para aplicar los cambios:

```bash
npm run migration:run
```

Esto ejecutará la migración `AddCreatedAtToHistorialPaciente1734567891000` que:
- Agrega la columna `createdAt` a la tabla `historial_paciente`
- Crea un índice para optimizar las consultas por fecha
- Es reversible con `migration:revert`

## Consideraciones Técnicas

- **Filtrado**: Solo se muestran registros con `url` no nula
- **Ordenamiento**: Los archivos se ordenan por fecha de creación (más recientes primero)
- **Rendimiento**: Índices optimizados para consultas por fecha y paciente
- **Seguridad**: Validación estricta de permisos por usuario
- **Escalabilidad**: Paginación disponible para grandes volúmenes de datos













