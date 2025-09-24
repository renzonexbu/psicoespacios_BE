# Endpoint de Pacientes Asignados a Psicólogo

## Descripción
El endpoint `/psicologos/:usuarioId/pacientes` permite a un psicólogo ver la lista de pacientes que le han sido asignados. Este endpoint consulta directamente la tabla `pacientes` de la base de datos para obtener la información.

## Endpoint

### **GET /psicologos/:usuarioId/pacientes**

**URL**: `{{base_url}}/api/v1/psicologos/:usuarioId/pacientes`

**Método**: `GET`

**Autenticación**: Requerida (JWT Bearer Token)

**Roles**: `ADMIN`, `TERAPEUTA`, `PSICOLOGO`

## Estructura de la Base de Datos

### **Tabla `pacientes`**:
```sql
CREATE TABLE pacientes (
  id UUID PRIMARY KEY,
  idUsuarioPaciente UUID NOT NULL,      -- ID del usuario que es paciente
  idUsuarioPsicologo UUID NOT NULL,     -- ID del usuario que es psicólogo
  primeraSesionRegistrada TIMESTAMP NOT NULL,
  proximaSesion TIMESTAMP NULL,
  estado VARCHAR NULL
);
```

### **Tabla `users`**:
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  nombre VARCHAR NOT NULL,
  apellido VARCHAR NOT NULL,
  email VARCHAR UNIQUE NOT NULL,
  telefono VARCHAR NOT NULL,
  fechaNacimiento DATE NOT NULL,
  fotoUrl VARCHAR NULL,
  role VARCHAR NOT NULL,
  estado VARCHAR NOT NULL
  -- ... otros campos
);
```

## Lógica de Consulta

### **1. Consulta Principal**:
```typescript
// Buscar pacientes asignados directamente desde la tabla pacientes
const pacientes = await this.pacienteRepository.find({
  where: { idUsuarioPsicologo: psicologoUserId },
  order: { primeraSesionRegistrada: 'DESC' }
});
```

**SQL equivalente**:
```sql
SELECT * FROM pacientes 
WHERE idUsuarioPsicologo = :psicologoUserId 
ORDER BY primeraSesionRegistrada DESC;
```

### **2. Enriquecimiento de Datos**:
```typescript
// Obtener información completa de los usuarios (pacientes)
const pacientesConInfo = await Promise.all(
  pacientes.map(async (paciente) => {
    const usuarioPaciente = await this.userRepository.findOne({
      where: { id: paciente.idUsuarioPaciente }
    });
    
    return {
      id: paciente.id,                           // ID de la relación paciente-psicólogo
      pacienteId: paciente.idUsuarioPaciente,    // ID del usuario paciente
      nombre: usuarioPaciente.nombre,
      apellido: usuarioPaciente.apellido,
      email: usuarioPaciente.email,
      telefono: usuarioPaciente.telefono,
      fechaNacimiento: usuarioPaciente.fechaNacimiento,
      fotoUrl: usuarioPaciente.fotoUrl,
      primeraSesionRegistrada: paciente.primeraSesionRegistrada,
      proximaSesion: paciente.proximaSesion,
      estado: paciente.estado || 'ACTIVO'
    };
  })
);
```

## Respuesta del Endpoint

### **Status Code**: `200 OK`

### **Estructura de Respuesta**:
```json
[
  {
    "id": "uuid-relacion-paciente-psicologo",
    "pacienteId": "uuid-usuario-paciente",
    "nombre": "Juan",
    "apellido": "Pérez",
    "email": "juan.perez@email.com",
    "telefono": "+56912345678",
    "fechaNacimiento": "1990-01-15",
    "fotoUrl": "https://ejemplo.com/foto.jpg",
    "primeraSesionRegistrada": "2024-01-15T10:00:00.000Z",
    "proximaSesion": "2024-01-22T10:00:00.000Z",
    "estado": "ACTIVO"
  },
  {
    "id": "uuid-relacion-paciente-psicologo-2",
    "pacienteId": "uuid-usuario-paciente-2",
    "nombre": "María",
    "apellido": "González",
    "email": "maria.gonzalez@email.com",
    "telefono": "+56987654321",
    "fechaNacimiento": "1985-05-20",
    "fotoUrl": null,
    "primeraSesionRegistrada": "2024-01-10T09:00:00.000Z",
    "proximaSesion": null,
    "estado": "ACTIVO"
  }
]
```

## Campos de Respuesta

### **Campos de la Relación Paciente-Psicólogo**:
- `id`: UUID único de la relación en la tabla `pacientes`
- `pacienteId`: UUID del usuario que es paciente
- `primeraSesionRegistrada`: Fecha de la primera sesión registrada
- `proximaSesion`: Fecha de la próxima sesión programada (null si no hay)
- `estado`: Estado de la relación (por defecto "ACTIVO")

### **Campos del Usuario Paciente**:
- `nombre`: Nombre del paciente
- `apellido`: Apellido del paciente
- `email`: Correo electrónico del paciente
- `telefono`: Número de teléfono del paciente
- `fechaNacimiento`: Fecha de nacimiento del paciente
- `fotoUrl`: URL de la foto de perfil (null si no tiene)

## Seguridad y Permisos

### **Validaciones Implementadas**:

1. **Verificación de Rol**: Solo usuarios con roles autorizados pueden acceder
2. **Verificación de Propiedad**: Los psicólogos solo pueden ver sus propios pacientes
3. **Prevención de Acceso Cruzado**: No se puede acceder a pacientes de otros psicólogos

### **Código de Seguridad**:
```typescript
@Get(':usuarioId/pacientes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.TERAPEUTA, Role.PSICOLOGO)
async getPacientesAsignados(
  @Param('usuarioId') usuarioId: string,
  @Request() req
) {
  // Verificar que el psicólogo solo puede ver sus propios pacientes
  if (req.user.role === Role.PSICOLOGO && req.user.id !== usuarioId) {
    throw new ForbiddenException('Solo puedes ver tus propios pacientes');
  }
  return this.psicologosService.getPacientesAsignados(usuarioId);
}
```

## Casos de Uso

### ✅ **Psicólogo accede a sus propios pacientes**:
```
GET /psicologos/123e4567-e89b-12d3-a456-426614174000/pacientes
Authorization: Bearer {token_psicologo}
```
**Resultado**: ✅ Lista de pacientes asignados

### ❌ **Psicólogo intenta acceder a pacientes de otro**:
```
GET /psicologos/00000000-0000-0000-0000-000000000000/pacientes
Authorization: Bearer {token_psicologo}
```
**Resultado**: ❌ 403 Forbidden - "Solo puedes ver tus propios pacientes"

### ✅ **Admin accede a pacientes de cualquier psicólogo**:
```
GET /psicologos/123e4567-e89b-12d3-a456-426614174000/pacientes
Authorization: Bearer {token_admin}
```
**Resultado**: ✅ Lista de pacientes del psicólogo especificado

## Flujo de Datos

### **1. Recepción de Request**:
- Se recibe el `usuarioId` del psicólogo
- Se valida el token JWT
- Se verifica el rol del usuario

### **2. Validación de Seguridad**:
- Si es `PSICOLOGO`, verificar que solo acceda a sus propios datos
- Si es `ADMIN` o `TERAPEUTA`, permitir acceso completo

### **3. Consulta a Base de Datos**:
```sql
-- Paso 1: Obtener relaciones paciente-psicólogo
SELECT * FROM pacientes 
WHERE idUsuarioPsicologo = :psicologoUserId 
ORDER BY primeraSesionRegistrada DESC;

-- Paso 2: Para cada paciente, obtener información del usuario
SELECT * FROM users 
WHERE id = :idUsuarioPaciente;
```

### **4. Transformación de Datos**:
- Combinar información de la tabla `pacientes` con la tabla `users`
- Formatear fechas y campos
- Aplicar valores por defecto

### **5. Respuesta**:
- Retornar array de pacientes con información completa
- Ordenados por fecha de primera sesión (más recientes primero)

## Consideraciones de Rendimiento

### **Optimizaciones Implementadas**:
1. **Consulta Directa**: Uso directo de la tabla `pacientes` con índice en `idUsuarioPsicologo`
2. **Ordenamiento en BD**: El ORDER BY se ejecuta en la base de datos
3. **Filtrado Eficiente**: Solo se obtienen los pacientes del psicólogo específico

### **Recomendaciones Futuras**:
1. **Índices**: Agregar índice compuesto en `(idUsuarioPsicologo, primeraSesionRegistrada)`
2. **Paginación**: Implementar paginación para psicólogos con muchos pacientes
3. **Caché**: Implementar caché para consultas frecuentes
4. **JOIN**: Considerar usar JOIN en lugar de consultas separadas para mejor rendimiento

## Testing

### **Script de Test**:
Se proporciona `test-pacientes-psicologo.js` para verificar:

1. ✅ Psicólogo puede ver sus propios pacientes
2. ✅ Psicólogo NO puede ver pacientes de otro psicólogo
3. ✅ Admin puede ver pacientes de cualquier psicólogo
4. ✅ Verificación de estructura de respuesta y consulta a BD

### **Ejecutar Tests**:
```bash
node test-pacientes-psicologo.js
```

## Archivos Relacionados

### **Implementación**:
- `src/gestion/services/psicologos.service.ts` - Método `getPacientesAsignados()`
- `src/gestion/controllers/psicologos.controller.ts` - Endpoint del controlador
- `src/gestion/dto/paciente-asignado.dto.ts` - DTO de respuesta

### **Entidades**:
- `src/common/entities/paciente.entity.ts` - Entidad de la tabla pacientes
- `src/common/entities/user.entity.ts` - Entidad de usuarios

## Mantenimiento

### **Monitoreo Recomendado**:
1. Verificar logs de acceso al endpoint
2. Monitorear tiempo de respuesta de las consultas
3. Revisar uso de memoria en transformaciones de datos
4. Verificar que las validaciones de seguridad funcionen correctamente

### **Actualizaciones Futuras**:
1. **Relaciones TypeORM**: Considerar usar relaciones TypeORM en lugar de consultas manuales
2. **Filtros Adicionales**: Agregar filtros por estado, fecha, etc.
3. **Estadísticas**: Agregar conteos y estadísticas de pacientes
4. **Historial**: Implementar historial de cambios en la asignación de pacientes 