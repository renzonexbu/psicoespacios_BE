# Endpoint de Listado de Usuarios

## Descripción
Se ha implementado un endpoint para obtener el listado completo de todos los usuarios registrados en el sistema. Este endpoint está restringido únicamente a usuarios con rol de ADMIN.

## Endpoint

### **GET /api/v1/users/admin/all**

**URL**: `{{base_url}}/api/v1/users/admin/all`

**Método**: `GET`

**Autenticación**: Requerida (JWT Bearer Token)

**Roles**: Solo ADMIN

## Headers Requeridos

```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

## Respuesta Exitosa

### **Status Code**: `200 OK`

### **Estructura de Respuesta**:
```json
[
  {
    "id": "uuid-del-usuario",
    "email": "usuario@ejemplo.com",
    "nombre": "Juan",
    "apellido": "Pérez",
    "rut": "12.345.678-9",
    "telefono": "+56912345678",
    "fechaNacimiento": "1990-01-15",
    "fotoUrl": "https://ejemplo.com/foto.jpg",
    "direccion": "Av. Principal 123",
    "especialidad": "Psicología Clínica",
    "numeroRegistroProfesional": "PSI-12345",
    "experiencia": "10 años de experiencia en terapia cognitivo-conductual",
    "role": "PSICOLOGO",
    "estado": "ACTIVO",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-20T14:45:00.000Z"
  },
  {
    "id": "uuid-del-usuario-2",
    "email": "paciente@ejemplo.com",
    "nombre": "María",
    "apellido": "González",
    "rut": "98.765.432-1",
    "telefono": "+56987654321",
    "fechaNacimiento": "1985-05-20",
    "fotoUrl": null,
    "direccion": "Calle Secundaria 456",
    "especialidad": null,
    "numeroRegistroProfesional": null,
    "experiencia": null,
    "role": "PACIENTE",
    "estado": "ACTIVO",
    "createdAt": "2024-01-10T09:15:00.000Z",
    "updatedAt": "2024-01-10T09:15:00.000Z"
  }
]
```

## Campos de Respuesta

### **Campos Obligatorios**:
- `id`: UUID único del usuario
- `email`: Correo electrónico del usuario
- `nombre`: Nombre del usuario
- `apellido`: Apellido del usuario
- `rut`: RUT del usuario
- `telefono`: Número de teléfono
- `fechaNacimiento`: Fecha de nacimiento (formato YYYY-MM-DD)
- `role`: Rol del usuario (PSICOLOGO, PACIENTE, ADMIN)
- `estado`: Estado del usuario (ACTIVO, INACTIVO, PENDIENTE)
- `createdAt`: Fecha de creación del usuario
- `updatedAt`: Fecha de última actualización

### **Campos Opcionales**:
- `fotoUrl`: URL de la foto de perfil (null si no tiene)
- `direccion`: Dirección del usuario (null si no tiene)
- `especialidad`: Especialidad profesional (null si no es psicólogo)
- `numeroRegistroProfesional`: Número de registro profesional (null si no es psicólogo)
- `experiencia`: Experiencia profesional (null si no es psicólogo)

## Seguridad

### **Protecciones Implementadas**:
1. **Autenticación JWT**: Requiere token válido
2. **Autorización por Roles**: Solo usuarios ADMIN pueden acceder
3. **Exclusión de Datos Sensibles**: El campo `password` nunca se incluye en la respuesta
4. **Validación de Entrada**: Verifica que el usuario tenga rol ADMIN

### **Guards Utilizados**:
- `JwtAuthGuard`: Verifica que el token JWT sea válido
- `RolesGuard`: Verifica que el usuario tenga el rol requerido
- `@Roles(Role.ADMIN)`: Decorador que especifica el rol requerido

## Casos de Uso

### ✅ **Acceso Permitido**:
- Usuario con rol ADMIN y token válido

### ❌ **Acceso Denegado**:
- Usuario sin token (401 Unauthorized)
- Usuario con token inválido (401 Unauthorized)
- Usuario con rol diferente a ADMIN (403 Forbidden)

## Ejemplo de Uso en Postman

### **1. Obtener Token de Admin**:
```
POST {{base_url}}/api/v1/auth/login
{
  "email": "admin@psicoespacios.com",
  "password": "tu_password_admin"
}
```

### **2. Usar el Token para Listar Usuarios**:
```
GET {{base_url}}/api/v1/users/admin/all
Headers:
  Authorization: Bearer {{admin_token}}
```

## Filtros y Ordenamiento

### **Ordenamiento**:
- Los usuarios se ordenan por fecha de creación (más recientes primero)
- Campo: `createdAt` en orden descendente

### **Filtros Disponibles**:
- Actualmente no hay filtros implementados
- Se pueden agregar filtros por rol, estado, fecha, etc. según necesidades

## Paginación

### **Estado Actual**:
- No implementada paginación
- Retorna todos los usuarios en una sola respuesta

### **Consideraciones**:
- Para bases de datos con muchos usuarios, considerar implementar paginación
- Sugerencia: Agregar parámetros `page`, `limit` y `offset`

## Manejo de Errores

### **400 Bad Request**:
- Usuario no tiene permisos suficientes

### **401 Unauthorized**:
- Token JWT faltante o inválido
- Token expirado

### **403 Forbidden**:
- Usuario autenticado pero sin rol ADMIN

### **500 Internal Server Error**:
- Error interno del servidor
- Error de base de datos

## Implementación Técnica

### **Archivos Modificados**:
- `src/auth/auth.service.ts` - Método `findAllUsers()`
- `src/auth/users.controller.ts` - Endpoint `GET /admin/all`
- `src/auth/dto/user-response.dto.ts` - DTO de respuesta

### **Dependencias**:
- `class-transformer` para transformación de datos
- `class-validator` para validación (implícita en DTOs)

### **Transformaciones Aplicadas**:
- Exclusión del campo `password`
- Formateo de fechas (`fechaNacimiento` como YYYY-MM-DD)
- Formateo de timestamps ISO para `createdAt` y `updatedAt`

## Testing

### **Script de Test**:
Se proporciona `test-users-endpoint.js` para verificar:
1. ✅ Acceso exitoso como ADMIN
2. ✅ Acceso denegado como usuario normal
3. ✅ Acceso denegado sin token
4. ✅ Estructura correcta de respuesta
5. ✅ Exclusión de datos sensibles

### **Ejecutar Tests**:
```bash
node test-users-endpoint.js
```

## Consideraciones de Rendimiento

### **Optimizaciones Implementadas**:
- Uso de `select` específico en consulta (aunque se simplificó)
- Transformación eficiente con `class-transformer`
- Ordenamiento en base de datos

### **Recomendaciones Futuras**:
- Implementar paginación para grandes volúmenes
- Agregar índices en campos de ordenamiento
- Implementar caché para consultas frecuentes
- Agregar filtros por rol, estado, fecha, etc.

## Mantenimiento

### **Monitoreo**:
- Verificar logs de acceso
- Monitorear tiempo de respuesta
- Revisar uso de memoria en transformaciones

### **Actualizaciones**:
- Mantener DTOs actualizados con cambios en entidad User
- Revisar permisos y roles regularmente
- Actualizar documentación según cambios 