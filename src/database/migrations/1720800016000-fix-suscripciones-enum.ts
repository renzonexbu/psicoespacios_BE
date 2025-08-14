import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixSuscripcionesEnum1720800016000 implements MigrationInterface {
  name = 'FixSuscripcionesEnum1720800016000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear el tipo enum para EstadoSuscripcion
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."estado_suscripcion_enum" AS ENUM('PENDIENTE_PAGO', 'ACTIVA', 'CANCELADA', 'VENCIDA');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Agregar campos faltantes si no existen
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "suscripciones" ADD COLUMN IF NOT EXISTS "fechaProximaRenovacion" TIMESTAMP;
        ALTER TABLE "suscripciones" ADD COLUMN IF NOT EXISTS "precioRenovacion" numeric(10,2);
        ALTER TABLE "suscripciones" ADD COLUMN IF NOT EXISTS "renovacionAutomatica" boolean DEFAULT false;
        ALTER TABLE "suscripciones" ADD COLUMN IF NOT EXISTS "datosPago" json;
        ALTER TABLE "suscripciones" ADD COLUMN IF NOT EXISTS "notasCancelacion" text;
        ALTER TABLE "suscripciones" ADD COLUMN IF NOT EXISTS "motivoCancelacion" text;
        ALTER TABLE "suscripciones" ADD COLUMN IF NOT EXISTS "fechaCancelacion" TIMESTAMP;
        ALTER TABLE "suscripciones" ADD COLUMN IF NOT EXISTS "notificacionesHabilitadas" boolean DEFAULT true;
        ALTER TABLE "suscripciones" ADD COLUMN IF NOT EXISTS "historialPagos" jsonb;
        ALTER TABLE "suscripciones" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP DEFAULT now();
        ALTER TABLE "suscripciones" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP DEFAULT now();
      EXCEPTION
        WHEN duplicate_column THEN null;
      END $$;
    `);

    // Actualizar valores existentes ANTES de cambiar el tipo
    await queryRunner.query(`
      UPDATE "suscripciones" 
      SET "estado" = 'PENDIENTE_PAGO' 
      WHERE "estado" = 'PENDIENTE';
    `);

    // Eliminar el valor por defecto temporalmente
    await queryRunner.query(`
      ALTER TABLE "suscripciones" ALTER COLUMN "estado" DROP DEFAULT;
    `);

    // Cambiar el tipo de la columna estado a enum
    await queryRunner.query(`
      ALTER TABLE "suscripciones" 
      ALTER COLUMN "estado" TYPE "public"."estado_suscripcion_enum" 
      USING "estado"::"public"."estado_suscripcion_enum";
    `);

    // Establecer valores por defecto
    await queryRunner.query(`
      ALTER TABLE "suscripciones" 
      ALTER COLUMN "estado" SET DEFAULT 'PENDIENTE_PAGO'::"public"."estado_suscripcion_enum";
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revertir el tipo de la columna estado
    await queryRunner.query(`
      ALTER TABLE "suscripciones" 
      ALTER COLUMN "estado" TYPE character varying;
    `);

    // Restaurar el valor por defecto original
    await queryRunner.query(`
      ALTER TABLE "suscripciones" 
      ALTER COLUMN "estado" SET DEFAULT 'PENDIENTE';
    `);

    // Eliminar campos agregados
    await queryRunner.query(`
      ALTER TABLE "suscripciones" DROP COLUMN IF EXISTS "fechaProximaRenovacion";
      ALTER TABLE "suscripciones" DROP COLUMN IF EXISTS "precioRenovacion";
      ALTER TABLE "suscripciones" DROP COLUMN IF EXISTS "renovacionAutomatica";
      ALTER TABLE "suscripciones" DROP COLUMN IF EXISTS "datosPago";
      ALTER TABLE "suscripciones" DROP COLUMN IF EXISTS "notasCancelacion";
      ALTER TABLE "suscripciones" DROP COLUMN IF EXISTS "motivoCancelacion";
      ALTER TABLE "suscripciones" DROP COLUMN IF EXISTS "fechaCancelacion";
      ALTER TABLE "suscripciones" DROP COLUMN IF EXISTS "notificacionesHabilitadas";
      ALTER TABLE "suscripciones" DROP COLUMN IF EXISTS "historialPagos";
      ALTER TABLE "suscripciones" DROP COLUMN IF EXISTS "createdAt";
      ALTER TABLE "suscripciones" DROP COLUMN IF EXISTS "updatedAt";
    `);

    // Eliminar el tipo enum
    await queryRunner.query(`
      DROP TYPE IF EXISTS "public"."estado_suscripcion_enum";
    `);
  }
}
