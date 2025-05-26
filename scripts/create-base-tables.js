// create-base-tables.js
const { Client } = require('pg');
require('dotenv').config();

async function createBaseTables() {
  try {
    console.log('Conectando a la base de datos...');
    const config = {
      connectionString: process.env.DATABASE_URL,
    };

    // Si la URL comienza con postgres:// o postgresql://, añadir SSL
    if (
      process.env.DATABASE_URL &&
      (process.env.DATABASE_URL.startsWith('postgres://') ||
        process.env.DATABASE_URL.startsWith('postgresql://'))
    ) {
      config.ssl = {
        rejectUnauthorized: false,
      };
    }

    const client = new Client(config);

    await client.connect();
    console.log('Conexión establecida.');

    // Verificar si la extensión uuid-ossp está disponible
    await client.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    `);

    // Verificar si existen las tablas principales
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'sedes', 'boxes', 'planes', 'suscripciones', 'contactos', 'pagos');
    `);

    const existingTables = tablesResult.rows.map((row) => row.table_name);
    console.log('Tablas existentes:', existingTables);

    // Crear tabla de usuarios si no existe
    if (!existingTables.includes('users')) {
      console.log('Creando tabla users...');
      await client.query(`
        CREATE TABLE "users" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "email" character varying NOT NULL,
          "password" character varying NOT NULL,
          "nombre" character varying NOT NULL,
          "apellido" character varying NOT NULL,
          "rut" character varying,
          "telefono" character varying,
          "role" character varying NOT NULL DEFAULT 'USUARIO',
          "especialidad" character varying,
          "bio" text,
          "fotoPerfil" character varying,
          "estado" character varying NOT NULL DEFAULT 'ACTIVO',
          "fechaCreacion" TIMESTAMP NOT NULL DEFAULT now(),
          "fechaActualizacion" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
          CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
        );
      `);
    }

    // Crear tabla de sedes si no existe
    if (!existingTables.includes('sedes')) {
      console.log('Creando tabla sedes...');
      await client.query(`
        CREATE TABLE "sedes" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "nombre" character varying NOT NULL,
          "direccion" character varying NOT NULL,
          "ciudad" character varying NOT NULL,
          "comuna" character varying,
          "descripcion" text,
          "activa" boolean NOT NULL DEFAULT true,
          "telefono" character varying,
          "email" character varying,
          "horarioAtencion" jsonb,
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_eef454a9fc26b3c3dc74a4c9e9a" PRIMARY KEY ("id")
        );
      `);
    }

    // Crear tabla de boxes si no existe
    if (!existingTables.includes('boxes')) {
      console.log('Creando tabla boxes...');
      await client.query(`
        CREATE TABLE "boxes" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "numero" character varying NOT NULL,
          "piso" integer NOT NULL,
          "descripcion" text,
          "capacidad" integer NOT NULL DEFAULT 2,
          "precioHora" numeric(10,2) NOT NULL,
          "precioJornada" numeric(10,2) NOT NULL,
          "equipamiento" jsonb,
          "dimensiones" jsonb,
          "activo" boolean NOT NULL DEFAULT true,
          "caracteristicas" text[],
          "sedeId" uuid,
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_46b1769cd5fdae40e51b24c0993" PRIMARY KEY ("id")
        );
      `);

      // Agregar la restricción de clave foránea
      await client.query(`
        ALTER TABLE "boxes" ADD CONSTRAINT "FK_3c5e1ebfb1d5b6a42a5ae1be41b" 
        FOREIGN KEY ("sedeId") REFERENCES "sedes"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
      `);
    }

    // Crear tabla de planes si no existe
    if (!existingTables.includes('planes')) {
      console.log('Creando tabla planes...');
      await client.query(`
        CREATE TABLE "planes" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "nombre" character varying NOT NULL,
          "descripcion" text,
          "precio" numeric(10,2) NOT NULL,
          "duracionMeses" integer NOT NULL DEFAULT 1,
          "caracteristicas" jsonb DEFAULT '[]',
          "horasIncluidas" integer NOT NULL DEFAULT 0,
          "descuentoHoraAdicional" numeric(5,2) DEFAULT 0,
          "estado" character varying NOT NULL DEFAULT 'ACTIVO',
          "fechaCreacion" TIMESTAMP NOT NULL DEFAULT now(),
          "fechaActualizacion" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_7b47e30cc7c4ecc52458b973673" PRIMARY KEY ("id")
        );
      `);
    }

    // Crear tabla de suscripciones si no existe
    if (!existingTables.includes('suscripciones')) {
      console.log('Creando tabla suscripciones...');
      await client.query(`
        CREATE TABLE "suscripciones" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "fechaInicio" TIMESTAMP NOT NULL,
          "fechaFin" TIMESTAMP NOT NULL,
          "estado" character varying NOT NULL DEFAULT 'PENDIENTE',
          "precioTotal" numeric(10,2) NOT NULL,
          "planId" uuid,
          "usuarioId" uuid,
          "horasConsumidas" integer NOT NULL DEFAULT 0,
          "horasDisponibles" integer NOT NULL DEFAULT 0,
          "fechaCreacion" TIMESTAMP NOT NULL DEFAULT now(),
          "fechaActualizacion" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_ad388dc7a1c954827616213bc8b" PRIMARY KEY ("id")
        );
      `);

      // Agregar las relaciones de clave foránea para suscripciones
      await client.query(`
        ALTER TABLE "suscripciones" ADD CONSTRAINT "FK_d2f1ae9e6f0f1aba0d1b1b1b1b1" 
        FOREIGN KEY ("planId") REFERENCES "planes"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
      `);

      await client.query(`
        ALTER TABLE "suscripciones" ADD CONSTRAINT "FK_e2f1ae9e6f0f1aba0d1b1b1b1b1" 
        FOREIGN KEY ("usuarioId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
      `);
    }

    // Crear tabla de pagos si no existe
    if (!existingTables.includes('pagos')) {
      console.log('Creando tabla pagos...');
      await client.query(`
        CREATE TABLE "pagos" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "monto" numeric(10,2) NOT NULL,
          "estado" character varying NOT NULL DEFAULT 'PENDIENTE',
          "tipo" character varying NOT NULL,
          "datosTransaccion" jsonb,
          "metadatos" jsonb,
          "notasReembolso" text,
          "fechaCompletado" TIMESTAMP,
          "fechaReembolso" TIMESTAMP,
          "suscripcionId" uuid,
          "solicitudDerivacionId" uuid,
          "usuarioId" uuid,
          "fechaCreacion" TIMESTAMP NOT NULL DEFAULT now(),
          "fechaActualizacion" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_c7b3cf6a0bf49af33a4c2cb7dc7" PRIMARY KEY ("id")
        );
      `);

      // Agregar relaciones para pagos
      await client.query(`
        ALTER TABLE "pagos" ADD CONSTRAINT "FK_f7b3cf6a0bf49af33a4c2cb7dc7" 
        FOREIGN KEY ("suscripcionId") REFERENCES "suscripciones"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
      `);

      await client.query(`
        ALTER TABLE "pagos" ADD CONSTRAINT "FK_g7b3cf6a0bf49af33a4c2cb7dc7" 
        FOREIGN KEY ("usuarioId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
      `);
    }

    console.log('Proceso completado exitosamente.');
    await client.end();
  } catch (error) {
    console.error('Error al crear tablas base:', error);
    process.exit(1);
  }
}

// Ejecutar la función si el archivo se ejecuta directamente
if (require.main === module) {
  createBaseTables()
    .then(() => {
      console.log('Script finalizado correctamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error en el script principal:', error);
      process.exit(1);
    });
}

module.exports = { createBaseTables };
