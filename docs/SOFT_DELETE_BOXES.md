# Soft Delete para Boxes

## Descripción
Se ha implementado un sistema de soft delete para los boxes, lo que significa que cuando se "elimina" un box, no se borra físicamente de la base de datos, sino que se marca como eliminado con un timestamp en el campo `deletedAt`.

## Cambios Implementados

### 1. Nueva Migración
- **Archivo**: `src/database/migrations/AddSoftDeleteToBoxes1720800015000.ts`
- **Cambio**: Agrega el campo `deletedAt` a la tabla `boxes`

### 2. Entidad Actualizada
- **Archivo**: `src/common/entities/box.entity.ts`
- **Campo agregado**: `deletedAt: Date | null`

### 3. Servicio Actualizado
- **Archivo**: `src/boxes/boxes.service.ts`
- **Métodos modificados**:
  - `findAll()`: Solo retorna boxes no eliminados
  - `findOne()`: Solo retorna boxes no eliminados
  - `remove()`: Implementa soft delete
  - `findBySede()`: Solo retorna boxes no eliminados
- **Métodos nuevos**:
  - `restore()`: Restaura un box eliminado
  - `findAllWithDeleted()`: Lista todos los boxes (incluyendo eliminados)

### 4. Controlador Actualizado
- **Archivo**: `src/boxes/boxes.controller.ts`
- **Endpoints nuevos**:
  - `POST /api/v1/boxes/:id/restore`: Restaura un box eliminado
  - `GET /api/v1/boxes/admin/all`: Lista todos los boxes (incluyendo eliminados)

## Cómo Ejecutar la Migración

### Opción 1: Script Automático
```bash
node scripts/run-migration-soft-delete-boxes.js
```

### Opción 2: Manual (TypeORM CLI)
```bash
npm run typeorm migration:run
```

## Nuevos Endpoints

### Restaurar Box Eliminado
```
POST /api/v1/boxes/:id/restore
Authorization: Bearer {jwt_token}
Roles: ADMIN
```

**Respuesta exitosa**:
```json
{
  "message": "Box restaurado correctamente",
  "box": {
    "id": "uuid",
    "numero": "A1",
    "nombre": "Box Terapia Individual",
    "deletedAt": null,
    // ... otros campos
  }
}
```

### Listar Todos los Boxes (Incluyendo Eliminados)
```
GET /api/v1/boxes/admin/all
Authorization: Bearer {jwt_token}
Roles: ADMIN
```

## Comportamiento del Soft Delete

### Al Eliminar un Box:
- El campo `deletedAt` se establece con la fecha/hora actual
- El box no aparece en las consultas normales
- Los datos se mantienen en la base de datos

### Al Restaurar un Box:
- El campo `deletedAt` se establece en `null`
- El box vuelve a aparecer en las consultas normales
- Se mantiene toda la información original

### Consultas que Excluyen Boxes Eliminados:
- `GET /api/v1/boxes` (listar todos)
- `GET /api/v1/boxes/:id` (obtener por ID)
- `GET /api/v1/boxes/sede/:sedeId` (filtrar por sede)

## Ventajas del Soft Delete

1. **Recuperación de datos**: Los boxes eliminados pueden ser restaurados
2. **Integridad referencial**: No se rompen las relaciones con otras entidades
3. **Auditoría**: Se mantiene un historial de cuándo se eliminó cada box
4. **Seguridad**: Los administradores pueden revisar y restaurar boxes eliminados por error

## Consideraciones

- Solo los usuarios con rol ADMIN pueden restaurar boxes
- Los boxes eliminados no aparecen en las consultas normales
- El campo `deletedAt` se usa para filtrar automáticamente
- Se mantiene la compatibilidad con el código existente 