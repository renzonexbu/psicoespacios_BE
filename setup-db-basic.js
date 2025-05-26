const { Client } = require('pg');
require('dotenv').config();

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DATABASE_HOST || 'localhost',
  port: process.env.DATABASE_PORT || 5432,
  user: process.env.DATABASE_USER || 'psicoespacios_user',
  password: process.env.DATABASE_PASSWORD || 'psicoespacios_password',
  database: process.env.DATABASE_NAME || 'psicoespacios',
};

console.log('🚀 Iniciando configuración básica de la base de datos...');
console.log('📊 Configuración:', {
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
  user: dbConfig.user,
});

async function setupDatabase() {
  const client = new Client(dbConfig);

  try {
    await client.connect();
    console.log('✅ Conexión a la base de datos establecida');

    // 1. Crear extensión UUID si no existe
    console.log('🔧 Creando extensión UUID...');
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    // 2. Crear tipos ENUM necesarios
    console.log('🔧 Creando tipos ENUM...');

    // Función para crear ENUMs de forma segura
    async function createEnumIfNotExists(name, values) {
      try {
        // Primero verificar si el tipo ya existe
        const checkResult = await client.query(
          `
          SELECT 1 FROM pg_type WHERE typname = $1
        `,
          [name],
        );

        if (checkResult.rows.length === 0) {
          // El tipo no existe, crearlo
          const valuesStr = values.map((v) => `'${v}'`).join(', ');
          await client.query(`CREATE TYPE ${name} AS ENUM (${valuesStr})`);
          console.log(`✅ ENUM creado: ${name}`);
        } else {
          console.log(`ℹ️  ENUM ya existe: ${name}`);
        }
      } catch (error) {
        console.log(`⚠️  Error con ENUM ${name}: ${error.message}`);
      }
    }

    // Crear ENUMs necesarios
    await createEnumIfNotExists('users_role_enum', [
      'ADMIN',
      'PSICOLOGO',
      'USUARIO',
    ]);
    await createEnumIfNotExists('users_estado_enum', [
      'ACTIVO',
      'INACTIVO',
      'PENDIENTE',
    ]);
    await createEnumIfNotExists('planes_tipo_enum', [
      'BASICO',
      'ESTANDAR',
      'PREMIUM',
    ]);
    await createEnumIfNotExists('suscripciones_estado_enum', [
      'ACTIVA',
      'COMPLETADA',
      'CANCELADA',
      'PENDIENTE',
    ]);
    await createEnumIfNotExists('reservas_estado_enum', [
      'PENDIENTE',
      'CONFIRMADA',
      'COMPLETADA',
      'CANCELADA',
    ]);
    await createEnumIfNotExists('reservas_tipo_enum', [
      'SESION',
      'EVALUACION',
      'SEGUIMIENTO',
    ]);
    await createEnumIfNotExists('pagos_estado_enum', [
      'PENDIENTE',
      'COMPLETADO',
      'FALLIDO',
      'CANCELADO',
    ]);
    await createEnumIfNotExists('pagos_tipo_enum', [
      'SUSCRIPCION',
      'SESION',
      'DERIVACION',
    ]);
    await createEnumIfNotExists('contactos_tipo_enum', [
      'CONSULTA',
      'SOPORTE',
      'COMERCIAL',
      'RECLAMO',
    ]);
    await createEnumIfNotExists('contactos_estado_enum', [
      'PENDIENTE',
      'EN_PROCESO',
      'RESUELTO',
      'CERRADO',
    ]);
    await createEnumIfNotExists('pacientes_estado_enum', [
      'ACTIVO',
      'INACTIVO',
      'ALTA',
    ]);
    await createEnumIfNotExists('solicitudes_derivacion_estado_enum', [
      'PENDIENTE',
      'APROBADA',
      'RECHAZADA',
      'COMPLETADA',
    ]);
    await createEnumIfNotExists('reportes_tipo_enum', [
      'INGRESOS',
      'RESERVAS',
      'USUARIOS',
      'SUSCRIPCIONES',
    ]);
    await createEnumIfNotExists('reportes_estado_enum', [
      'GENERANDO',
      'COMPLETADO',
      'ERROR',
    ]);
    await createEnumIfNotExists('reportes_formatoexportacion_enum', [
      'PDF',
      'EXCEL',
      'CSV',
    ]);

    // 3. Crear tabla de usuarios
    console.log('🔧 Creando tabla users...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "nombre" character varying NOT NULL,
        "apellido" character varying NOT NULL,
        "email" character varying NOT NULL,
        "password" character varying NOT NULL,
        "role" users_role_enum NOT NULL DEFAULT 'USUARIO',
        "telefono" character varying,
        "fechaNacimiento" TIMESTAMP,
        "rut" character varying,
        "direccion" character varying,
        "especialidad" character varying,
        "numeroRegistroProfesional" character varying,
        "experiencia" text,
        "estado" users_estado_enum NOT NULL DEFAULT 'ACTIVO',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
        CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
      )
    `);

    // 4. Crear tabla de configuración del sistema
    console.log('🔧 Creando tabla configuracion_sistema...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "configuracion_sistema" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "configuracionGeneral" jsonb NOT NULL DEFAULT '{"nombreSistema":"PsicoEspacios","colorPrimario":"#3f51b5","colorSecundario":"#f50057","contactoSoporte":"contacto@psicoespacios.com"}',
        "configuracionReservas" jsonb NOT NULL DEFAULT '{"tiempoMinimoReserva":60,"tiempoMaximoReserva":240,"anticipacionMinima":24,"anticipacionMaxima":720,"intervaloHorario":[9,19]}',
        "configuracionPagos" jsonb NOT NULL DEFAULT '{"moneda":"CLP","comisionPlataforma":5,"metodosHabilitados":["TARJETA","TRANSFERENCIA"]}',
        "configuracionDerivacion" jsonb NOT NULL DEFAULT '{"especialidades":[],"modalidades":[],"tiempoMaximoRespuesta":48,"comisionDerivacion":10}',
        "configuracionSuscripciones" jsonb NOT NULL DEFAULT '{"periodosRenovacion":[1,3,6,12],"descuentosRenovacion":[]}',
        "configuracionNotificaciones" jsonb NOT NULL DEFAULT '{"emailsHabilitados":true,"plantillasEmail":{}}',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_7a64268fe7d5d782f91277b5f8c" PRIMARY KEY ("id")
      )
    `);

    // 5. Crear tabla de sedes
    console.log('🔧 Creando tabla sedes...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "sedes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "nombre" character varying NOT NULL,
        "direccion" character varying NOT NULL,
        "telefono" character varying,
        "email" character varying,
        "horarioAtencion" jsonb,
        "serviciosDisponibles" text array,
        "estado" character varying NOT NULL DEFAULT 'ACTIVA',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_4ae55ad0b6ce5fd89e98d5ae8ab" PRIMARY KEY ("id")
      )
    `);

    // 6. Crear tabla de boxes
    console.log('🔧 Creando tabla boxes...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "boxes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "numero" character varying NOT NULL,
        "nombre" character varying,
        "capacidad" integer NOT NULL DEFAULT 2,
        "equipamiento" text array,
        "estado" character varying NOT NULL DEFAULT 'DISPONIBLE',
        "sedeId" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_25990896eba5e5ddf16af5b0fac" PRIMARY KEY ("id")
      )
    `);

    // 7. Crear tabla de planes
    console.log('🔧 Creando tabla planes...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "planes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "nombre" character varying NOT NULL,
        "descripcion" text,
        "precio" numeric(10,2) NOT NULL,
        "duracion" integer NOT NULL,
        "tipo" planes_tipo_enum NOT NULL DEFAULT 'BASICO',
        "horasIncluidas" integer NOT NULL DEFAULT 4,
        "beneficios" text array,
        "activo" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_bd2e21b26639c8045f6b6a9062b" PRIMARY KEY ("id")
      )
    `);

    // 8. Crear tabla de perfiles de derivación
    console.log('🔧 Creando tabla perfiles_derivacion...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "perfiles_derivacion" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "especialidades" text NOT NULL,
        "modalidades" text NOT NULL,
        "descripcion" text,
        "experiencia" text,
        "horariosAtencion" jsonb NOT NULL,
        "sedesAtencion" text NOT NULL,
        "tarifaHora" numeric(10,2) NOT NULL,
        "aprobado" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "psicologoId" uuid,
        CONSTRAINT "PK_43367115204e2e89279080d0490" PRIMARY KEY ("id"),
        CONSTRAINT "REL_43ab843e5cbb23fa71dd278901" UNIQUE ("psicologoId")
      )
    `);

    // 9. Crear otras tablas necesarias
    console.log('🔧 Creando tablas adicionales...');

    // Tabla de suscripciones
    await client.query(`
      CREATE TABLE IF NOT EXISTS "suscripciones" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "fechaInicio" TIMESTAMP NOT NULL,
        "fechaFin" TIMESTAMP NOT NULL,
        "estado" suscripciones_estado_enum NOT NULL DEFAULT 'PENDIENTE',
        "precioTotal" numeric(10,2) NOT NULL,
        "horasConsumidas" integer NOT NULL DEFAULT 0,
        "horasDisponibles" integer NOT NULL DEFAULT 0,
        "planId" uuid,
        "usuarioId" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_1db87fa98c0e6b8e6c0b1e95c4b" PRIMARY KEY ("id")
      )
    `);

    // Tabla de pacientes
    await client.query(`
      CREATE TABLE IF NOT EXISTS "pacientes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "nombre" character varying NOT NULL,
        "apellido" character varying NOT NULL,
        "rut" character varying,
        "fechaNacimiento" TIMESTAMP,
        "genero" character varying,
        "direccion" character varying,
        "telefono" character varying,
        "email" character varying,
        "contactoEmergencia" jsonb,
        "psicologoId" uuid,
        "datosAdicionales" jsonb,
        "estado" pacientes_estado_enum NOT NULL DEFAULT 'ACTIVO',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_n7b3cf6a0bf49af33a4c2cb7dc7" PRIMARY KEY ("id")
      )
    `);

    // Tabla de reservas
    await client.query(`
      CREATE TABLE IF NOT EXISTS "reservas" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "fechaInicio" TIMESTAMP NOT NULL,
        "fechaFin" TIMESTAMP NOT NULL,
        "estado" reservas_estado_enum NOT NULL DEFAULT 'PENDIENTE',
        "tipo" reservas_tipo_enum NOT NULL DEFAULT 'SESION',
        "notas" text,
        "psicologoId" uuid,
        "pacienteId" uuid,
        "boxId" uuid,
        "suscripcionId" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_d0b9ba3aaff50caef50d2c5e1de" PRIMARY KEY ("id")
      )
    `);

    // Tabla de pagos
    await client.query(`
      CREATE TABLE IF NOT EXISTS "pagos" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "monto" numeric(10,2) NOT NULL,
        "estado" pagos_estado_enum NOT NULL DEFAULT 'PENDIENTE',
        "tipo" pagos_tipo_enum NOT NULL,
        "datosTransaccion" jsonb,
        "metadatos" jsonb,
        "fechaCompletado" TIMESTAMP,
        "suscripcionId" uuid,
        "reservaId" uuid,
        "usuarioId" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_da1b30b3e7a9e94d75f6c7b4e57" PRIMARY KEY ("id")
      )
    `);

    // Tabla de contactos
    await client.query(`
      CREATE TABLE IF NOT EXISTS "contactos" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "nombre" character varying NOT NULL,
        "email" character varying NOT NULL,
        "telefono" character varying,
        "asunto" character varying NOT NULL,
        "mensaje" text NOT NULL,
        "tipo" contactos_tipo_enum NOT NULL DEFAULT 'CONSULTA',
        "estado" contactos_estado_enum NOT NULL DEFAULT 'PENDIENTE',
        "respuesta" text,
        "fechaRespuesta" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_e6143b5edb2bfe32edb0d3b71c5" PRIMARY KEY ("id")
      )
    `);

    // 10. Crear relaciones (foreign keys)
    console.log('🔧 Creando relaciones entre tablas...');

    const foreignKeys = [
      // Boxes -> Sedes
      `ALTER TABLE "boxes" ADD CONSTRAINT "FK_25990896eba5e5ddf16af5b0fac" FOREIGN KEY ("sedeId") REFERENCES "sedes"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,

      // Perfiles derivación -> Users
      `ALTER TABLE "perfiles_derivacion" ADD CONSTRAINT "FK_43ab843e5cbb23fa71dd2789013" FOREIGN KEY ("psicologoId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,

      // Suscripciones -> Planes y Users
      `ALTER TABLE "suscripciones" ADD CONSTRAINT "FK_plan_suscripcion" FOREIGN KEY ("planId") REFERENCES "planes"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
      `ALTER TABLE "suscripciones" ADD CONSTRAINT "FK_usuario_suscripcion" FOREIGN KEY ("usuarioId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,

      // Pacientes -> Users
      `ALTER TABLE "pacientes" ADD CONSTRAINT "FK_paciente_psicologo" FOREIGN KEY ("psicologoId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,

      // Reservas -> Users, Boxes, Suscripciones, Pacientes
      `ALTER TABLE "reservas" ADD CONSTRAINT "FK_reserva_psicologo" FOREIGN KEY ("psicologoId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
      `ALTER TABLE "reservas" ADD CONSTRAINT "FK_reserva_paciente" FOREIGN KEY ("pacienteId") REFERENCES "pacientes"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
      `ALTER TABLE "reservas" ADD CONSTRAINT "FK_reserva_box" FOREIGN KEY ("boxId") REFERENCES "boxes"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
      `ALTER TABLE "reservas" ADD CONSTRAINT "FK_reserva_suscripcion" FOREIGN KEY ("suscripcionId") REFERENCES "suscripciones"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,

      // Pagos -> Suscripciones, Reservas, Users
      `ALTER TABLE "pagos" ADD CONSTRAINT "FK_pago_suscripcion" FOREIGN KEY ("suscripcionId") REFERENCES "suscripciones"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
      `ALTER TABLE "pagos" ADD CONSTRAINT "FK_pago_reserva" FOREIGN KEY ("reservaId") REFERENCES "reservas"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
      `ALTER TABLE "pagos" ADD CONSTRAINT "FK_pago_usuario" FOREIGN KEY ("usuarioId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    ];

    for (const fkSQL of foreignKeys) {
      try {
        await client.query(fkSQL);
      } catch (error) {
        console.log(
          `⚠️  Relación ya existe: ${error.message.split('already exists')[0]}already exists`,
        );
      }
    }

    console.log('✅ Estructura básica de la base de datos creada exitosamente');
    console.log('📊 Verificando tablas creadas...');

    // Verificar tablas creadas
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    console.log('📋 Tablas creadas:');
    result.rows.forEach((row) => {
      console.log(`   ✓ ${row.table_name}`);
    });
  } catch (error) {
    console.error('❌ Error durante la configuración:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Ejecutar configuración
if (require.main === module) {
  setupDatabase()
    .then(() => {
      console.log(
        '🎉 ¡Configuración de base de datos completada exitosamente!',
      );
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { setupDatabase };
