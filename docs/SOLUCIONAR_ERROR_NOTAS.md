# Solucionar Error en Endpoint de Crear Notas

## 🚨 Problema Identificado

El endpoint `POST /api/v1/notas` estaba fallando con el siguiente error:

```
error: column "esPrivada" of relation "notas" does not exist
```

## 🔍 Causa del Problema

El problema era un **mismatch entre los nombres de las columnas** en la base de datos y la entidad TypeORM:

- **Base de datos**: `es_privada` (snake_case)
- **Entidad TypeORM**: `esPrivada` (camelCase)

TypeORM por defecto convierte camelCase a snake_case, pero en este caso necesitábamos especificar explícitamente el nombre de la columna.

## 🛠️ Solución

### **Paso 1: Corregir Mapeo de Columnas en TypeORM**

El problema se solucionó corrigiendo la entidad TypeORM para que mapee correctamente los nombres de las columnas:

```typescript
// Antes (causaba error)
@Column({ type: 'boolean', default: false })
esPrivada: boolean;

// Después (funciona correctamente)
@Column({ name: 'es_privada', type: 'boolean', default: false })
esPrivada: boolean;
```

### **Paso 2: Verificar que la Tabla Existe**

Si la tabla `notas` no existe o le faltan columnas, ejecuta:

```bash
node scripts/fix-notas-table.js
```

### **Paso 3: Probar el Endpoint**

Ahora prueba el endpoint con el script de test rápido:

```bash
node test-nota-rapido.js
```

O si prefieres el test completo:

```bash
node test-crear-nota-simple.js
```

## 📋 Estructura Esperada de la Tabla

La tabla `notas` debe tener la siguiente estructura:

```sql
CREATE TABLE "notas" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "psicologo_id" uuid NOT NULL,
  "paciente_id" uuid NOT NULL,
  "contenido" text NOT NULL,
  "titulo" character varying(255),
  "tipo" "public"."tipo_nota_enum" NOT NULL DEFAULT 'otro',
  "es_privada" boolean NOT NULL DEFAULT false,
  "metadatos" jsonb,
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "PK_notas_id" PRIMARY KEY ("id")
);
```

### **Enum de Tipos de Nota**

```sql
CREATE TYPE "public"."tipo_nota_enum" AS ENUM(
  'sesion',
  'evaluacion', 
  'observacion',
  'plan_tratamiento',
  'progreso',
  'otro'
);
```

## 🔧 Scripts Disponibles

### **1. `scripts/fix-notas-table.js`**
- Script principal para corregir la tabla
- Verifica y agrega columnas faltantes
- Crea el enum si es necesario

### **2. `test-crear-nota-simple.js`**
- Script de test simplificado
- Prueba la creación de una nota básica
- No requiere pacientes existentes

### **3. `test-crear-nota.js`**
- Script de test completo
- Prueba múltiples escenarios
- Requiere pacientes existentes

## 🚀 Flujo de Solución Completo

```bash
# 1. Corregir la tabla
node scripts/fix-notas-table.js

# 2. Probar el endpoint
node test-crear-nota-simple.js

# 3. Si todo funciona, ejecutar tests completos
node test-crear-nota.js
```

## 📝 Ejemplo de Request Válido

```json
{
  "pacienteId": "00000000-0000-0000-0000-000000000001",
  "contenido": "Esta es una nota de prueba para evaluar el progreso del paciente.",
  "titulo": "Nota de Evaluación Inicial",
  "tipo": "evaluacion",
  "esPrivada": false,
  "metadatos": {
    "prioridad": "media",
    "estado": "completada",
    "tags": ["evaluacion", "inicial"]
  }
}
```

## 🔍 Verificación Manual en Base de Datos

Si quieres verificar manualmente, puedes ejecutar en psql:

```sql
-- Verificar estructura de la tabla
\d notas

-- Verificar columnas específicas
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'notas'
ORDER BY ordinal_position;

-- Verificar si existe el enum
SELECT typname FROM pg_type WHERE typname = 'tipo_nota_enum';
```

## ⚠️ Posibles Errores Adicionales

### **Error: "uuid-ossp" extension not found**
```bash
# En psql, ejecutar:
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### **Error: Foreign key constraint**
```bash
# Verificar que la tabla users existe y tiene datos
SELECT COUNT(*) FROM users;
```

### **Error: Permission denied**
```bash
# Verificar que el usuario de la BD tiene permisos
GRANT ALL PRIVILEGES ON DATABASE psicoespacios TO tu_usuario;
```

## 📞 Soporte

Si el problema persiste después de ejecutar los scripts:

1. ✅ Verifica que la base de datos esté funcionando
2. ✅ Verifica que las credenciales en `.env` sean correctas
3. ✅ Verifica que la tabla `users` exista y tenga datos
4. ✅ Revisa los logs del servidor para más detalles

## ✅ Solución Implementada

### **Cambios Realizados**:

1. **Entidad TypeORM Corregida** (`src/common/entities/nota.entity.ts`):
   - ✅ Agregado `name: 'es_privada'` para mapear correctamente la columna
   - ✅ Agregado `name: 'created_at'` para el timestamp de creación
   - ✅ Agregado `name: 'updated_at'` para el timestamp de actualización

2. **Mapeo Correcto de Columnas**:
   - `esPrivada` → `es_privada` ✅
   - `createdAt` → `created_at` ✅
   - `updatedAt` → `updated_at` ✅

### **Archivos Modificados**:
- `src/common/entities/nota.entity.ts` - Entidad corregida
- `test-nota-rapido.js` - Test rápido para verificar funcionamiento

## 🎯 Resultado Esperado

Después de la corrección, deberías poder:

- ✅ Crear notas con todos los campos opcionales
- ✅ Usar diferentes tipos de nota (sesion, evaluacion, etc.)
- ✅ Marcar notas como privadas
- ✅ Incluir metadatos JSON personalizados
- ✅ Obtener respuestas estructuradas del endpoint 