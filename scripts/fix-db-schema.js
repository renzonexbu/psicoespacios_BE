#!/usr/bin/env node
// fix-db-schema.js - Script para corregir inconsistencias en el esquema de la base de datos
const { Client } = require('pg');
require('dotenv').config();

async function fixDatabaseSchema() {
  console.log('Iniciando corrección del esquema de la base de datos...');

  // Configuración explícita para desarrollo local
  const config = {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    database: process.env.DATABASE_NAME || 'psicoespacios',
    user: process.env.DATABASE_USERNAME || 'psicoespacios_user',
    password: process.env.DATABASE_PASSWORD || 'psicoespacios_password',
  };

  // Usar DATABASE_URL si está definida (para producción)
  if (process.env.DATABASE_URL) {
    console.log('Usando DATABASE_URL para conectar a la base de datos');
    config.connectionString = process.env.DATABASE_URL;

    // Añadir SSL solo si estamos en producción y no en desarrollo local
    if (
      (process.env.DATABASE_URL.startsWith('postgres://') ||
        process.env.DATABASE_URL.startsWith('postgresql://')) &&
      process.env.NODE_ENV === 'production'
    ) {
      config.ssl = {
        rejectUnauthorized: false,
      };
    }
  }

  // Crear cliente de PostgreSQL
  const client = new Client(config);

  try {
    // Conectar a la base de datos
    await client.connect();
    console.log('Conexión a la base de datos establecida');

    // Verificar si existe la tabla configuracion_sistema
    const configTableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'configuracion_sistema'
      );
    `);

    if (configTableExists.rows[0].exists) {
      console.log(
        'La tabla configuracion_sistema existe, verificando su estructura...',
      );

      // Comprobar si tiene la estructura antigua (columnas planas)
      const hasOldStructure = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'configuracion_sistema' 
          AND column_name = 'nombresistema'
        );
      `);

      // Comprobar si tiene la estructura nueva (columnas JSON)
      const hasNewStructure = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'configuracion_sistema' 
          AND column_name = 'configuraciongeneral'
        );
      `);

      if (hasOldStructure.rows[0].exists && !hasNewStructure.rows[0].exists) {
        console.log(
          'La tabla tiene la estructura antigua, migrando a la nueva estructura...',
        );

        // Hacer backup de los datos existentes
        await client.query(`
          CREATE TABLE IF NOT EXISTS configuracion_sistema_backup AS 
          SELECT * FROM configuracion_sistema;
        `);
        console.log('Backup creado en configuracion_sistema_backup');

        // Eliminar la tabla antigua
        await client.query(`DROP TABLE configuracion_sistema;`);
        console.log('Tabla antigua eliminada');

        // Crear la tabla con la nueva estructura
        await client.query(`
          CREATE TABLE "configuracion_sistema" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "configuracionGeneral" jsonb NOT NULL DEFAULT '{"nombreSistema":"PsicoEspacios","logotipo":"","colorPrimario":"#3f51b5","colorSecundario":"#f50057","contactoSoporte":"contacto@psicoespacios.com"}',
            "configuracionReservas" jsonb NOT NULL DEFAULT '{"tiempoMinimoReserva":60,"tiempoMaximoReserva":240,"anticipacionMinima":24,"anticipacionMaxima":720,"intervaloHorario":[9,19]}',
            "configuracionPagos" jsonb NOT NULL DEFAULT '{"moneda":"CLP","comisionPlataforma":5,"metodosHabilitados":["TARJETA","TRANSFERENCIA"],"datosTransferencia":{"banco":"Banco Estado","tipoCuenta":"Corriente","numeroCuenta":"123456789","titular":"PsicoEspacios SpA","rut":"76.123.456-7","email":"pagos@psicoespacios.com"}}',
            "configuracionDerivacion" jsonb NOT NULL DEFAULT '{"especialidades":["Psicología Clínica","Psicología Infantil","Terapia de Pareja","Terapia Familiar"],"modalidades":["Presencial","Online"],"tiempoMaximoRespuesta":48,"comisionDerivacion":10}',
            "configuracionSuscripciones" jsonb NOT NULL DEFAULT '{"periodosRenovacion":[1,3,6,12],"descuentosRenovacion":[{"periodo":3,"descuento":5},{"periodo":6,"descuento":10},{"periodo":12,"descuento":15}]}',
            "configuracionNotificaciones" jsonb NOT NULL DEFAULT '{"emailsHabilitados":true,"plantillasEmail":{"bienvenida":{"asunto":"Bienvenido a PsicoEspacios","plantilla":"Bienvenido a nuestra plataforma..."}}}',
            "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
            "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "PK_7a64268fe7d5d782f91277b5f8c" PRIMARY KEY ("id")
          );
        `);
        console.log('Tabla recreada con la nueva estructura');

        // Insertar un registro con la configuración por defecto
        await client.query(`
          INSERT INTO configuracion_sistema DEFAULT VALUES;
        `);
        console.log('Datos por defecto insertados en la nueva tabla');
      } else if (hasNewStructure.rows[0].exists) {
        console.log('La tabla ya tiene la estructura correcta (columnas JSON)');
      } else {
        console.log(
          'La estructura de la tabla no coincide con ninguna esperada, recreando...',
        );

        // Eliminar la tabla existente
        await client.query(`DROP TABLE configuracion_sistema;`);

        // Crear la tabla con la estructura correcta
        await client.query(`
          CREATE TABLE "configuracion_sistema" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "configuracionGeneral" jsonb NOT NULL DEFAULT '{"nombreSistema":"PsicoEspacios","logotipo":"","colorPrimario":"#3f51b5","colorSecundario":"#f50057","contactoSoporte":"contacto@psicoespacios.com"}',
            "configuracionReservas" jsonb NOT NULL DEFAULT '{"tiempoMinimoReserva":60,"tiempoMaximoReserva":240,"anticipacionMinima":24,"anticipacionMaxima":720,"intervaloHorario":[9,19]}',
            "configuracionPagos" jsonb NOT NULL DEFAULT '{"moneda":"CLP","comisionPlataforma":5,"metodosHabilitados":["TARJETA","TRANSFERENCIA"],"datosTransferencia":{"banco":"Banco Estado","tipoCuenta":"Corriente","numeroCuenta":"123456789","titular":"PsicoEspacios SpA","rut":"76.123.456-7","email":"pagos@psicoespacios.com"}}',
            "configuracionDerivacion" jsonb NOT NULL DEFAULT '{"especialidades":["Psicología Clínica","Psicología Infantil","Terapia de Pareja","Terapia Familiar"],"modalidades":["Presencial","Online"],"tiempoMaximoRespuesta":48,"comisionDerivacion":10}',
            "configuracionSuscripciones" jsonb NOT NULL DEFAULT '{"periodosRenovacion":[1,3,6,12],"descuentosRenovacion":[{"periodo":3,"descuento":5},{"periodo":6,"descuento":10},{"periodo":12,"descuento":15}]}',
            "configuracionNotificaciones" jsonb NOT NULL DEFAULT '{"emailsHabilitados":true,"plantillasEmail":{"bienvenida":{"asunto":"Bienvenido a PsicoEspacios","plantilla":"Bienvenido a nuestra plataforma..."}}}',
            "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
            "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "PK_7a64268fe7d5d782f91277b5f8c" PRIMARY KEY ("id")
          );
        `);
        console.log('Tabla recreada con la estructura correcta');

        // Insertar un registro con la configuración por defecto
        await client.query(`
          INSERT INTO configuracion_sistema DEFAULT VALUES;
        `);
        console.log('Datos por defecto insertados en la tabla');
      }
    } else {
      console.log('La tabla configuracion_sistema no existe, creándola...');

      // Crear la tabla con la estructura correcta
      await client.query(`
        CREATE TABLE "configuracion_sistema" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "configuracionGeneral" jsonb NOT NULL DEFAULT '{"nombreSistema":"PsicoEspacios","logotipo":"","colorPrimario":"#3f51b5","colorSecundario":"#f50057","contactoSoporte":"contacto@psicoespacios.com"}',
          "configuracionReservas" jsonb NOT NULL DEFAULT '{"tiempoMinimoReserva":60,"tiempoMaximoReserva":240,"anticipacionMinima":24,"anticipacionMaxima":720,"intervaloHorario":[9,19]}',
          "configuracionPagos" jsonb NOT NULL DEFAULT '{"moneda":"CLP","comisionPlataforma":5,"metodosHabilitados":["TARJETA","TRANSFERENCIA"],"datosTransferencia":{"banco":"Banco Estado","tipoCuenta":"Corriente","numeroCuenta":"123456789","titular":"PsicoEspacios SpA","rut":"76.123.456-7","email":"pagos@psicoespacios.com"}}',
          "configuracionDerivacion" jsonb NOT NULL DEFAULT '{"especialidades":["Psicología Clínica","Psicología Infantil","Terapia de Pareja","Terapia Familiar"],"modalidades":["Presencial","Online"],"tiempoMaximoRespuesta":48,"comisionDerivacion":10}',
          "configuracionSuscripciones" jsonb NOT NULL DEFAULT '{"periodosRenovacion":[1,3,6,12],"descuentosRenovacion":[{"periodo":3,"descuento":5},{"periodo":6,"descuento":10},{"periodo":12,"descuento":15}]}',
          "configuracionNotificaciones" jsonb NOT NULL DEFAULT '{"emailsHabilitados":true,"plantillasEmail":{"bienvenida":{"asunto":"Bienvenido a PsicoEspacios","plantilla":"Bienvenido a nuestra plataforma..."}}}',
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_7a64268fe7d5d782f91277b5f8c" PRIMARY KEY ("id")
        );
      `);
      console.log('Tabla creada con la estructura correcta');

      // Insertar un registro con la configuración por defecto
      await client.query(`
        INSERT INTO configuracion_sistema DEFAULT VALUES;
      `);
      console.log('Datos por defecto insertados en la tabla');
    }

    // Verificar si la tabla planes tiene el campo 'tipo'
    const plansTableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'planes'
      );
    `);

    if (plansTableExists.rows[0].exists) {
      console.log(
        'La tabla planes existe, verificando si tiene el campo tipo...',
      );

      const hasTipoField = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'planes' 
          AND column_name = 'tipo'
        );
      `);

      if (!hasTipoField.rows[0].exists) {
        console.log('La tabla planes no tiene el campo tipo, añadiéndolo...');

        await client.query(`
          ALTER TABLE planes 
          ADD COLUMN tipo character varying NOT NULL DEFAULT 'BASICO';
        `);
        console.log('Campo tipo añadido a la tabla planes');
      } else {
        console.log('La tabla planes ya tiene el campo tipo');
      }

      // Verificar si la tabla planes tiene el campo 'descuento'
      const hasDescuentoField = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'planes' 
          AND column_name = 'descuento'
        );
      `);

      if (!hasDescuentoField.rows[0].exists) {
        console.log(
          'La tabla planes no tiene el campo descuento, añadiéndolo...',
        );

        await client.query(`
          ALTER TABLE planes 
          ADD COLUMN descuento numeric(5,2) DEFAULT 0;
        `);
        console.log('Campo descuento añadido a la tabla planes');
      } else {
        console.log('La tabla planes ya tiene el campo descuento');
      }
    } else {
      console.log('La tabla planes no existe');
    }

    console.log('Corrección del esquema completada exitosamente');
    await client.end();
    return true;
  } catch (error) {
    console.error('Error durante la corrección del esquema:', error);
    try {
      await client.end();
    } catch (e) {
      // Ignorar errores al cerrar conexión
    }
    return false;
  }
}

// Ejecutar el script directamente
if (require.main === module) {
  fixDatabaseSchema()
    .then((success) => {
      if (success) {
        console.log('✅ Script de corrección completado exitosamente');
        process.exit(0);
      } else {
        console.error('❌ Falló la corrección del esquema');
        process.exit(1);
      }
    })
    .catch((err) => {
      console.error('Error fatal en el script:', err);
      process.exit(1);
    });
}

module.exports = { fixDatabaseSchema };
