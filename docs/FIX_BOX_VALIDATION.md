# Corrección de Validación en Boxes

## Problema Identificado

Se detectó un error en la validación de boxes donde el sistema impedía actualizar un box incluso cuando no se estaban cambiando los campos críticos (número o sede). El error ocurría porque la validación se ejecutaba incorrectamente.

## Error Original

```typescript
// ❌ Validación problemática (antes)
if (updateBoxDto.numero && updateBoxDto.sedeId) {
  const existingBox = await this.boxesRepository.findOne({
    where: {
      numero: updateBoxDto.numero,
      sede: { id: updateBoxDto.sedeId },
      id: Not(id),
    },
  });
  if (existingBox) {
    throw new BadRequestException('Ya existe un box con ese número en esta sede');
  }
}
```

**Problema**: Esta validación solo se ejecutaba cuando AMBOS campos (`numero` Y `sedeId`) estaban presentes en la actualización, pero no consideraba si realmente habían cambiado.

## Solución Implementada

```typescript
// ✅ Validación corregida (después)
// Solo validar si se está cambiando el número o la sede
const numeroChanged = updateBoxDto.numero && updateBoxDto.numero !== box.numero;
const sedeChanged = updateBoxDto.sedeId && updateBoxDto.sedeId !== box.sede?.id;

if (numeroChanged || sedeChanged) {
  const numeroToCheck = updateBoxDto.numero || box.numero;
  const sedeIdToCheck = updateBoxDto.sedeId || box.sede?.id;
  
  if (numeroToCheck && sedeIdToCheck) {
    const existingBox = await this.boxesRepository.findOne({
      where: {
        numero: numeroToCheck,
        sede: { id: sedeIdToCheck },
        id: Not(id), // Excluir el box actual
        deletedAt: IsNull(), // Solo considerar boxes activos
      },
    });
    if (existingBox) {
      throw new BadRequestException('Ya existe un box con ese número en esta sede');
    }
  }
}
```

## Cómo Funciona Ahora

### 1. **Detección Inteligente de Cambios**
- Solo se valida cuando realmente hay cambios en `numero` o `sedeId`
- Si no se cambian estos campos, no hay validación (permite actualizar otros campos)

### 2. **Validación Contextual**
- `numeroChanged`: Solo `true` si se proporciona un nuevo número DIFERENTE al actual
- `sedeChanged`: Solo `true` si se proporciona una nueva sede DIFERENTE a la actual

### 3. **Uso de Valores Actuales**
- Si no se proporciona `numero` en la actualización, usa el valor actual del box
- Si no se proporciona `sedeId` en la actualización, usa la sede actual del box

### 4. **Filtrado por Soft Delete**
- Solo considera boxes activos (`deletedAt: IsNull()`)
- Evita conflictos con boxes eliminados

## Casos de Uso Válidos

### ✅ **Actualizar solo el nombre** (sin cambios en número/sede)
```json
PUT /api/v1/boxes/:id
{
  "nombre": "Nuevo Nombre del Box"
}
```
**Resultado**: ✅ Funciona correctamente

### ✅ **Actualizar solo el precio** (sin cambios en número/sede)
```json
PUT /api/v1/boxes/:id
{
  "precio": 30000
}
```
**Resultado**: ✅ Funciona correctamente

### ✅ **Cambiar solo el número** (si no hay conflicto)
```json
PUT /api/v1/boxes/:id
{
  "numero": "A2"
}
```
**Resultado**: ✅ Funciona si no existe otro box con número "A2" en la misma sede

### ✅ **Cambiar solo la sede** (si no hay conflicto)
```json
PUT /api/v1/boxes/:id
{
  "sedeId": "nueva-sede-uuid"
}
```
**Resultado**: ✅ Funciona si no existe otro box con el mismo número en la nueva sede

### ❌ **Crear box con número duplicado en la misma sede**
```json
POST /api/v1/boxes
{
  "numero": "A1",
  "sedeId": "sede-uuid"
}
```
**Resultado**: ❌ Falla correctamente con error de validación

## Test de Validación

Se creó un script de test (`test-box-validation.js`) que verifica:

1. ✅ No se puede crear box con número duplicado
2. ✅ Se puede actualizar sin cambiar número/sede
3. ✅ Se puede actualizar solo el nombre
4. ✅ Se puede actualizar solo el número (si no hay conflicto)
5. ✅ Se puede actualizar solo la sede (si no hay conflicto)

## Ejecutar Tests

```bash
node test-box-validation.js
```

## Archivos Modificados

- `src/boxes/boxes.service.ts` - Lógica de validación corregida
- `test-box-validation.js` - Script de test para validar la corrección

## Beneficios de la Corrección

1. **Flexibilidad**: Permite actualizar campos no críticos sin restricciones
2. **Inteligencia**: Solo valida cuando es necesario
3. **Consistencia**: Mantiene la integridad de datos sin ser restrictivo
4. **Experiencia de Usuario**: Evita errores innecesarios en actualizaciones simples
5. **Mantenibilidad**: Código más claro y fácil de entender 