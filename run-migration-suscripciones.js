const { Client } = require('pg');
require('dotenv').config();

async function runMigration() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'psicoespacios',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  try {
    await client.connect();
    console.log('🔍 Conectado a la base de datos');

    // Crear el tipo enum para EstadoSuscripcion
    console.log('\n📋 Creando tipo enum...');
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."estado_suscripcion_enum" AS ENUM('PENDIENTE_PAGO', 'ACTIVA', 'CANCELADA', 'VENCIDA');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('✅ Tipo enum creado o ya existía');

    // Agregar campos faltantes si no existen
    console.log('\n📋 Agregando campos faltantes...');
    await client.query(`
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
    console.log('✅ Campos agregados');

    // Cambiar el tipo de la columna estado a enum
    console.log('\n📋 Cambiando tipo de columna estado...');
    await client.query(`
      ALTER TABLE "suscripciones" 
      ALTER COLUMN "estado" TYPE "public"."estado_suscripcion_enum" 
      USING "estado"::"public"."estado_suscripcion_enum";
    `);
    console.log('✅ Tipo de columna estado cambiado');

    // Actualizar valores existentes
    console.log('\n📋 Actualizando valores existentes...');
    await client.query(`
      UPDATE "suscripciones" 
      SET "estado" = 'PENDIENTE_PAGO'::"public"."estado_suscripcion_enum" 
      WHERE "estado" = 'PENDIENTE';
    `);
    console.log('✅ Valores actualizados');

    // Establecer valores por defecto
    console.log('\n📋 Estableciendo valores por defecto...');
    await client.query(`
      ALTER TABLE "suscripciones" 
      ALTER COLUMN "estado" SET DEFAULT 'PENDIENTE_PAGO'::"public"."estado_suscripcion_enum";
    `);
    console.log('✅ Valores por defecto establecidos');

    console.log('\n🎉 Migración completada exitosamente!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

runMigration();
















