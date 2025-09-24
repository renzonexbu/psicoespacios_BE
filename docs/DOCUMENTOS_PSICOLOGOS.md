# Documentos de Psicólogos

## Descripción

Este módulo permite gestionar documentos relacionados a los psicólogos del sistema, incluyendo títulos profesionales, certificados, diplomas, licencias y otros documentos relevantes.

## Características

- **Tipos de Documentos**: Título, certificado, diploma, licencia, otros
- **Verificación**: Los administradores pueden verificar la autenticidad de los documentos
- **Seguridad**: Control de acceso basado en roles y permisos
- **Auditoría**: Registro de fechas de creación, actualización y verificación

## Estructura de la Base de Datos

### Tabla: `documento_psicologo`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | Identificador único del documento |
| `psicologo_id` | UUID | ID del psicólogo propietario |
| `tipo` | ENUM | Tipo de documento (titulo, certificado, diploma, licencia, otro) |
| `nombre` | VARCHAR(255) | Nombre del documento |
| `descripcion` | TEXT | Descripción opcional del documento |
| `institucion` | VARCHAR(255) | Institución que emitió el documento |
| `fecha_emision` | DATE | Fecha de emisión del documento |
| `numero_documento` | VARCHAR(255) | Número de identificación del documento |
| `url_documento` | VARCHAR(500) | URL del documento subido |
| `verificado` | BOOLEAN | Estado de verificación (false por defecto) |
| `fecha_verificacion` | DATE | Fecha de verificación |
| `verificado_por` | VARCHAR(255) | ID del usuario que verificó |
| `created_at` | TIMESTAMP | Fecha de creación |
| `updated_at` | TIMESTAMP | Fecha de última actualización |

## Endpoints de la API

### Base URL
```
/psicologos/:psicologoId/documentos
```

### 1. Crear Documento
```http
POST /psicologos/:psicologoId/documentos
```

**Body:**
```json
{
  "tipo": "titulo",
  "nombre": "Licenciatura en Psicología",
  "descripcion": "Título profesional de psicólogo",
  "institucion": "Universidad de Chile",
  "fechaEmision": "2020-12-15",
  "numeroDocumento": "PSI-2020-001",
  "urlDocumento": "https://ejemplo.com/documento.pdf"
}
```

**Permisos:** PSICOLOGO, ADMIN

### 2. Obtener Todos los Documentos
```http
GET /psicologos/:psicologoId/documentos
```

**Permisos:** PSICOLOGO, ADMIN

### 3. Obtener Documentos por Tipo
```http
GET /psicologos/:psicologoId/documentos/tipo/:tipo
```

**Tipos válidos:** titulo, certificado, diploma, licencia, otro

**Permisos:** PSICOLOGO, ADMIN

### 4. Obtener Documento Específico
```http
GET /psicologos/:psicologoId/documentos/:id
```

**Permisos:** PSICOLOGO, ADMIN

### 5. Actualizar Documento
```http
PUT /psicologos/:psicologoId/documentos/:id
```

**Body:** Campos opcionales a actualizar

**Permisos:** PSICOLOGO, ADMIN

### 6. Eliminar Documento
```http
DELETE /psicologos/:psicologoId/documentos/:id
```

**Permisos:** PSICOLOGO, ADMIN

### 7. Verificar Documento
```http
POST /psicologos/:psicologoId/documentos/:id/verificar
```

**Permisos:** ADMIN únicamente

## Casos de Uso

### Para Psicólogos
1. **Subir Título**: Los psicólogos pueden subir su título profesional
2. **Gestionar Documentos**: Crear, actualizar y eliminar sus propios documentos
3. **Ver Estado**: Consultar el estado de verificación de sus documentos

### Para Administradores
1. **Verificar Documentos**: Revisar y verificar la autenticidad de los documentos
2. **Auditoría**: Monitorear todos los documentos del sistema
3. **Gestión**: Acceso completo a todos los documentos

## Seguridad

- **Autenticación**: JWT requerido para todos los endpoints
- **Autorización**: Control de acceso basado en roles
- **Aislamiento**: Los psicólogos solo pueden acceder a sus propios documentos
- **Auditoría**: Registro de todas las operaciones de verificación

## Ejemplos de Uso

### Crear un Título Profesional
```javascript
const response = await axios.post('/psicologos/123e4567-e89b-12d3-a456-426614174000/documentos', {
  tipo: 'titulo',
  nombre: 'Licenciatura en Psicología',
  institucion: 'Universidad de Chile',
  fechaEmision: '2020-12-15',
  numeroDocumento: 'PSI-2020-001'
});
```

### Verificar un Documento (Admin)
```javascript
const response = await axios.post('/psicologos/123e4567-e89b-12d3-a456-426614174000/documentos/456e7890-e89b-12d3-a456-426614174000/verificar');
```

## Migración

Para crear la tabla en la base de datos, ejecutar:

```bash
npm run db:migrate:win
```

## Pruebas

Para probar la funcionalidad:

```bash
node test-documentos-psicologo.js
```

## Notas de Implementación

- Los documentos se eliminan en cascada cuando se elimina un psicólogo
- Se crean índices automáticamente para mejorar el rendimiento
- El sistema valida que solo los psicólogos puedan acceder a sus propios documentos
- Los administradores tienen acceso completo a todos los documentos 