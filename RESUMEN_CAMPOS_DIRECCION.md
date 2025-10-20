# Resumen: Campos de Dirección en Registro de Pacientes

## Cambios Implementados

Se han agregado los siguientes campos de dirección al registro de pacientes, basándose en el formulario proporcionado:

### Campos Agregados:
- **calleNumero** (obligatorio): Calle y número
- **observacionDireccion** (opcional): Observaciones como departamento, etc.
- **region** (obligatorio): Región
- **comuna** (obligatorio): Comuna  
- **compania** (opcional): Compañía

## Archivos Modificados

### 1. Entidad User (`src/common/entities/user.entity.ts`)
- ✅ Agregados 5 nuevos campos de dirección como columnas nullable
- ✅ Mantiene compatibilidad con el campo `direccion` existente

### 2. DTO de Registro (`src/auth/dto/register.dto.ts`)
- ✅ Agregados campos de dirección con validaciones apropiadas
- ✅ Campos obligatorios: calleNumero, region, comuna
- ✅ Campos opcionales: observacionDireccion, compania

### 3. Servicio de Autenticación (`src/auth/auth.service.ts`)
- ✅ Agregadas validaciones para campos obligatorios de dirección
- ✅ Actualizada creación de usuario para incluir nuevos campos
- ✅ Mensajes de error específicos para cada campo

### 4. DTO de Crear Paciente (`src/psicologos/dto/crear-paciente.dto.ts`)
- ✅ Agregados campos de dirección para creación por psicólogos
- ✅ Mismas validaciones que el registro público

### 5. Servicio de Crear Paciente (`src/psicologos/services/crear-paciente.service.ts`)
- ✅ Actualizada creación de usuario para incluir campos de dirección
- ✅ Mantiene funcionalidad existente

### 6. Migración de Base de Datos (`src/database/migrations/1760977464217-AddAddressFieldsToUsers.ts`)
- ✅ Nueva migración para agregar columnas a la tabla `users`
- ✅ Incluye rollback para deshacer cambios

## Validaciones Implementadas

### Campos Obligatorios:
- `calleNumero`: No puede estar vacío
- `region`: No puede estar vacío  
- `comuna`: No puede estar vacío

### Campos Opcionales:
- `observacionDireccion`: Puede estar vacío
- `compania`: Puede estar vacío

## Endpoints Afectados

### 1. Registro Público
- **POST** `/auth/register`
- Ahora requiere los campos de dirección obligatorios

### 2. Creación por Psicólogo
- **POST** `/psicologos/crear-paciente`
- Ahora incluye campos de dirección en la creación

## Próximos Pasos

1. **Ejecutar la migración**:
   ```bash
   npm run migration:run
   ```

2. **Probar los endpoints**:
   ```bash
   node test-address-fields.js
   ```

3. **Actualizar documentación**:
   - Actualizar colecciones de Postman
   - Actualizar documentación de API

## Notas Importantes

- Los campos son nullable en la base de datos para mantener compatibilidad
- Las validaciones se aplican a nivel de aplicación
- Se mantiene el campo `direccion` existente para compatibilidad
- Los campos opcionales pueden ser null o undefined

## Estructura de Datos Esperada

```json
{
  "calleNumero": "Av. Providencia 1234",
  "observacionDireccion": "Departamento 45, torre A",
  "region": "Región Metropolitana", 
  "comuna": "Providencia",
  "compania": "Empresa ABC S.A."
}
```
