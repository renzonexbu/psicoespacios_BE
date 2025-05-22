# Sistema de Migraciones PsicoEspacios

Esta documentación explica cómo funciona el sistema de migraciones para la base de datos de PsicoEspacios, diseñado para facilitar la configuración inicial al clonar el repositorio.

## Descripción General

El sistema de migraciones permite:

- Crear automáticamente todas las tablas necesarias en la base de datos
- Poblar las tablas con datos iniciales para pruebas
- Garantizar que las migraciones sean seguras y no generen errores si se ejecutan múltiples veces
- Simplificar el proceso de configuración en nuevos entornos

## Estructura de Archivos

El sistema de migraciones está organizado de la siguiente manera:

```
src/
  database/
    migration-runner.ts      # Ejecutor de migraciones
    migrations/
      1685394000000-initial-schema.ts         # Creación de tablas iniciales
      1685394100000-additional-tables.ts      # Creación de tablas adicionales
      1685394200000-seed-initial-data.ts      # Datos iniciales
      1685394300000-seed-additional-data.ts   # Datos adicionales
scripts/
  run-migrations.sh          # Script para ejecutar migraciones desde terminal
```

## Ejecución de Migraciones

Las migraciones se ejecutan automáticamente al iniciar la aplicación. Sin embargo, también se pueden ejecutar manualmente usando los siguientes comandos:

```bash
# Ejecutar migraciones en entorno de desarrollo
npm run db:migrate

# Ejecutar migraciones en entorno de producción
npm run db:migrate:prod
```

## Funcionamiento

El sistema de migraciones funciona de la siguiente manera:

1. **Detección de tablas existentes**: Antes de crear tablas, verifica si ya existen.
2. **Creación de tablas**: Si las tablas no existen, las crea con la estructura adecuada.
3. **Verificación de datos**: Antes de insertar datos, verifica si las tablas ya tienen registros.
4. **Inserción de datos**: Si las tablas están vacías, inserta los datos iniciales.

Cada migración implementa dos métodos principales:

- `up()`: Se ejecuta al aplicar la migración.
- `down()`: Se ejecuta al revertir la migración (actualmente no tiene implementación completa).

## Añadir Nuevas Migraciones

Para crear nuevas migraciones:

1. Crea un nuevo archivo en `src/database/migrations/` con un timestamp único.
2. Implementa las clases `MigrationInterface` de TypeORM.
3. Define los métodos `up()` y `down()`.
4. Incluye validaciones para evitar errores en ejecuciones repetidas.

Ejemplo de estructura básica:

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class NuevaMigracion1234567890 implements MigrationInterface {
  name = 'NuevaMigracion1234567890';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Comprobar si la tabla ya existe
    const tableExists = await queryRunner.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'mi_tabla'
      )`,
    );

    if (!tableExists[0].exists) {
      // Crear tabla si no existe
      await queryRunner.query(`
        CREATE TABLE "mi_tabla" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "nombre" character varying NOT NULL,
          "fechaCreacion" TIMESTAMP NOT NULL DEFAULT now(),
          "fechaActualizacion" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_mi_tabla" PRIMARY KEY ("id")
        )
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar tabla (opcional)
    await queryRunner.query(`DROP TABLE IF EXISTS "mi_tabla"`);
  }
}
```

## Notas Importantes

- Los nombres de archivo incluyen un timestamp para garantizar el orden de ejecución.
- Todas las migraciones incluyen validaciones para que sean idempotentes (se pueden ejecutar múltiples veces sin error).
- Las migraciones de datos (`seed`) contienen comprobaciones para evitar duplicados.
- En producción, considere ejecutar solo las migraciones de esquema y no las de datos semilla.
