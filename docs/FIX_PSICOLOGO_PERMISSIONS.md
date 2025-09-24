# Corrección de Permisos para Psicólogos

## Problema Identificado

Se detectó un error de permisos donde los usuarios con rol `PSICOLOGO` no podían acceder al endpoint `/psicologos/:id/pacientes` para ver sus propios pacientes. El error ocurría porque el endpoint solo permitía acceso a usuarios con roles `ADMIN` y `TERAPEUTA`, excluyendo a los psicólogos.

## Error Original

```
{
  "statusCode": 403,
  "message": "Prohibido: no tiene permisos para acceder a este recurso",
  "error": "Authorization Error",
  "method": "GET",
  "path": "/psicologos/a1129fd3-5456-49e4-a11f-96563a8aacc2/pacientes"
}
```

## Causa del Problema

El endpoint estaba configurado con:
```typescript
@Roles(Role.ADMIN, Role.TERAPEUTA) // ❌ PSICOLOGO no incluido
```

Pero el usuario tenía rol `PSICOLOGO`, no `TERAPEUTA`.

## Solución Implementada

### 1. **Actualización de Roles en Endpoints**

Se modificaron todos los endpoints relevantes para permitir acceso tanto a `TERAPEUTA` como a `PSICOLOGO`:

```typescript
// ✅ Antes (solo TERAPEUTA)
@Roles(Role.ADMIN, Role.TERAPEUTA)

// ✅ Después (TERAPEUTA y PSICOLOGO)
@Roles(Role.ADMIN, Role.TERAPEUTA, Role.PSICOLOGO)
```

### 2. **Implementación de Seguridad por Usuario**

Se agregó validación para asegurar que los psicólogos solo puedan acceder a sus propios datos:

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

## Endpoints Corregidos

### **1. Listar Pacientes Asignados**
- **URL**: `GET /psicologos/:usuarioId/pacientes`
- **Roles**: `ADMIN`, `TERAPEUTA`, `PSICOLOGO`
- **Seguridad**: Psicólogos solo ven sus propios pacientes

### **2. Ver Perfil de Psicólogo**
- **URL**: `GET /psicologos/usuario/:usuarioId`
- **Roles**: `ADMIN`, `TERAPEUTA`, `PSICOLOGO`
- **Seguridad**: Psicólogos solo ven su propio perfil

### **3. Ver Descripción de Psicólogo**
- **URL**: `GET /psicologos/usuario/:usuarioId/descripcion`
- **Roles**: `ADMIN`, `TERAPEUTA`, `PSICOLOGO`
- **Seguridad**: Psicólogos solo ven su propia descripción

### **4. Ver Disponibilidad de Días**
- **URL**: `GET /psicologos/:id/disponibilidad/dias`
- **Roles**: `ADMIN`, `TERAPEUTA`, `PSICOLOGO`
- **Seguridad**: Psicólogos solo ven su propia disponibilidad

### **5. Ver Disponibilidad de Horarios**
- **URL**: `GET /psicologos/:id/disponibilidad/horarios`
- **Roles**: `ADMIN`, `TERAPEUTA`, `PSICOLOGO`
- **Seguridad**: Psicólogos solo ven su propia disponibilidad

### **6. Actualizar Perfil de Psicólogo**
- **URL**: `PATCH /psicologos/usuario/:usuarioId`
- **Roles**: `ADMIN`, `TERAPEUTA`, `PSICOLOGO`
- **Seguridad**: Psicólogos solo actualizan su propio perfil

## Reglas de Seguridad Implementadas

### **Para Usuarios con Rol PSICOLOGO**:
1. ✅ Pueden ver sus propios pacientes
2. ✅ Pueden ver su propio perfil
3. ✅ Pueden ver su propia descripción
4. ✅ Pueden ver su propia disponibilidad
5. ✅ Pueden actualizar su propio perfil
6. ❌ NO pueden ver datos de otros psicólogos
7. ❌ NO pueden ver pacientes de otros psicólogos

### **Para Usuarios con Rol ADMIN**:
1. ✅ Pueden ver todos los psicólogos
2. ✅ Pueden ver pacientes de cualquier psicólogo
3. ✅ Pueden ver todos los perfiles
4. ✅ Pueden ver toda la disponibilidad
5. ✅ Pueden actualizar cualquier perfil

### **Para Usuarios con Rol TERAPEUTA**:
1. ✅ Mismos permisos que ADMIN (por compatibilidad)

## Casos de Uso Válidos

### ✅ **Psicólogo accede a sus propios pacientes**:
```
GET /psicologos/123e4567-e89b-12d3-a456-426614174000/pacientes
Authorization: Bearer {token_psicologo}
```
**Resultado**: ✅ Funciona correctamente

### ✅ **Psicólogo accede a su propio perfil**:
```
GET /psicologos/usuario/123e4567-e89b-12d3-a456-426614174000
Authorization: Bearer {token_psicologo}
```
**Resultado**: ✅ Funciona correctamente

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
**Resultado**: ✅ Funciona correctamente

## Archivos Modificados

### **Controlador Principal**:
- `src/gestion/controllers/psicologos.controller.ts`

### **Cambios Realizados**:
1. Agregado `Role.PSICOLOGO` a todos los endpoints relevantes
2. Implementada validación de seguridad por usuario
3. Agregados imports necesarios (`Request`, `ForbiddenException`)
4. Agregada lógica de verificación de propiedad de datos

## Testing

### **Script de Test**:
Se proporciona `test-psicologo-permissions.js` para verificar:

1. ✅ Psicólogo puede ver sus propios pacientes
2. ✅ Psicólogo NO puede ver pacientes de otro psicólogo
3. ✅ Admin puede ver pacientes de cualquier psicólogo
4. ✅ Psicólogo puede ver su propio perfil
5. ✅ Psicólogo NO puede ver perfil de otro psicólogo

### **Ejecutar Tests**:
```bash
node test-psicologo-permissions.js
```

## Consideraciones de Seguridad

### **Validaciones Implementadas**:
1. **Verificación de Rol**: Solo usuarios autorizados pueden acceder
2. **Verificación de Propiedad**: Psicólogos solo ven sus propios datos
3. **Prevención de Acceso Cruzado**: No se puede acceder a datos de otros usuarios
4. **Manejo de Errores**: Respuestas claras cuando se deniega acceso

### **Logs de Seguridad**:
- Todos los accesos se registran a través de los guards
- Los intentos de acceso no autorizado se registran
- Se pueden monitorear patrones de acceso sospechoso

## Compatibilidad

### **Con Roles Existentes**:
- `ADMIN`: Mantiene todos los permisos
- `TERAPEUTA`: Mantiene todos los permisos (por compatibilidad)
- `PSICOLOGO`: Nuevos permisos agregados con restricciones de seguridad

### **Con Endpoints Existentes**:
- No se modificó la funcionalidad existente
- Solo se agregaron permisos y validaciones de seguridad
- Se mantiene la compatibilidad hacia atrás

## Mantenimiento

### **Monitoreo Recomendado**:
1. Verificar logs de acceso a endpoints de psicólogos
2. Monitorear intentos de acceso no autorizado
3. Revisar patrones de uso de los endpoints
4. Verificar que las validaciones de seguridad funcionen correctamente

### **Actualizaciones Futuras**:
1. Mantener consistencia entre roles `TERAPEUTA` y `PSICOLOGO`
2. Considerar unificar estos roles si no hay diferencia conceptual
3. Agregar más endpoints específicos para psicólogos según necesidades
4. Implementar auditoría más detallada de accesos

## Beneficios de la Corrección

1. **Funcionalidad Restaurada**: Los psicólogos pueden acceder a sus pacientes
2. **Seguridad Mejorada**: Validaciones específicas por usuario
3. **Consistencia**: Permisos uniformes en todos los endpoints relacionados
4. **Mantenibilidad**: Código más claro y fácil de mantener
5. **Experiencia de Usuario**: Los psicólogos pueden usar la aplicación correctamente 