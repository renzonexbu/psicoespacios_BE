// 1685394000000-initial-schema.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migración inicial que crea la estructura de tablas básica
 */
export class InitialSchema1685394000000 implements MigrationInterface {
  name = 'InitialSchema1685394000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si las tablas ya existen para evitar errores
    const tablesExist = await this.checkIfTablesExist(queryRunner);
    
    if (tablesExist) {
      console.log('Las tablas ya existen en la base de datos. Omitiendo creación inicial de esquema.');
      return;
    }

    // Crear tabla de usuarios
    await queryRunner.query(`
  CREATE TABLE IF NOT EXISTS "users" ( -- Asegúrate que IF NOT EXISTS esté aquí si lo necesitas
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "email" character varying NOT NULL,
    "password" character varying NOT NULL,
    "nombre" character varying,
    "apellido" character varying,
    "rut" character varying,
    "telefono" character varying,
    "fechaNacimiento" date,
    "direccion" text,
    "bio" text, -- <<< AGREGA ESTA LÍNEA
    "especialidad" character varying,
    "numeroRegistroProfesional" character varying,
    "experiencia" text,
    "role" character varying NOT NULL DEFAULT 'USER',
    "estado" character varying NOT NULL DEFAULT 'PENDIENTE',
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
    CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
  )
`);
   // Crear tabla de configuración del sistema
    await queryRunner.query(`
      CREATE TABLE "configuracion_sistema" (
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
    
    // Crear tabla de sedes
    await queryRunner.query(`
      CREATE TABLE "sedes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "nombre" character varying NOT NULL,
        "direccion" character varying NOT NULL,
        "ciudad" character varying NOT NULL,
        "telefono" character varying,
        "email" character varying,
        "coordenadas" jsonb,
        "horarioAtencion" jsonb DEFAULT '[{"dia":"LUNES","inicio":"09:00","fin":"18:00","cerrado":false},{"dia":"MARTES","inicio":"09:00","fin":"18:00","cerrado":false},{"dia":"MIERCOLES","inicio":"09:00","fin":"18:00","cerrado":false},{"dia":"JUEVES","inicio":"09:00","fin":"18:00","cerrado":false},{"dia":"VIERNES","inicio":"09:00","fin":"18:00","cerrado":false},{"dia":"SABADO","inicio":"09:00","fin":"13:00","cerrado":false},{"dia":"DOMINGO","inicio":"00:00","fin":"00:00","cerrado":true}]',
        "serviciosDisponibles" text[] DEFAULT '{A/C,"Agua purificada","Estación de té y café","Sala de espera","Ingreso autogestionado"}',
        "imageUrl" character varying DEFAULT 'assets/images/location-default.png',
        "thumbnailUrl" character varying DEFAULT 'assets/images/thumbnail-location-default.png',
        "description" character varying DEFAULT 'Sede de PsicoEspacios con instalaciones modernas y profesionales',
        "features" jsonb DEFAULT '["A/C", "Agua purificada", "Estación de té y café", "Sala de espera", "Ingreso autogestionado"]',
        "estado" character varying NOT NULL DEFAULT 'ACTIVA',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_eef454a9fc26b3c3dc74a4c9e9a" PRIMARY KEY ("id")
      )
    `);

    // Crear tabla de boxes
    await queryRunner.query(`
      CREATE TABLE "boxes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "numero" character varying NOT NULL,
        "nombre" character varying,
        "descripcion" text,
        "precio" numeric(10,2) NOT NULL,
        "capacidad" integer DEFAULT 2,
        "equipamiento" text[] DEFAULT '{}',
        "estado" character varying DEFAULT 'DISPONIBLE',
        "sedeId" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_46b1769cd5fdae40e51b24c0993" PRIMARY KEY ("id")
      )
    `);

   
      await queryRunner.query(`
        CREATE TABLE "blogs" (
          "id" SERIAL PRIMARY KEY,
          "titulo" character varying(255) NOT NULL,
          "descripcion" text NOT NULL,
          "imagen" character varying(255) NOT NULL,
          "fecha" date NOT NULL,
          "categoria" character varying(100) NOT NULL,
          "contenido" text NOT NULL
        )
      `);
    
    // Agregar relación entre boxes y sedes
    await queryRunner.query(`
      ALTER TABLE "boxes" ADD CONSTRAINT "FK_3c5e1ebfb1d5b6a42a5ae1be41b" 
      FOREIGN KEY ("sedeId") REFERENCES "sedes"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);
    
    // Crear tabla de planes
    await queryRunner.query(`
      CREATE TABLE "planes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "nombre" character varying NOT NULL,
        "descripcion" text,
        "precio" numeric(10,2) NOT NULL,
        "duracion" integer,
        "caracteristicas" jsonb,
        "tipo" character varying,
        "beneficios" jsonb DEFAULT '[]',
        "horasIncluidas" integer NOT NULL DEFAULT 0,
        "descuentoHoraAdicional" numeric(5,2) DEFAULT 0,
        "activo" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_7b47e30cc7c4ecc52458b973673" PRIMARY KEY ("id")
      )
    `);

    // Crear tabla de suscripciones
    await queryRunner.query(`
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
      )
    `);

    // Agregar relaciones para suscripciones
    await queryRunner.query(`
      ALTER TABLE "suscripciones" ADD CONSTRAINT "FK_d2f1ae9e6f0f1aba0d1b1b1b1b1" 
      FOREIGN KEY ("planId") REFERENCES "planes"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);
    
    await queryRunner.query(`
      ALTER TABLE "suscripciones" ADD CONSTRAINT "FK_e2f1ae9e6f0f1aba0d1b1b1b1b1" 
      FOREIGN KEY ("usuarioId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    
    // Crear tabla de contactos
    await queryRunner.query(`
      CREATE TABLE "contactos" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "nombre" character varying NOT NULL,
        "email" character varying NOT NULL,
        "telefono" character varying,
        "asunto" character varying,
        "mensaje" text NOT NULL,
        "tipo" character varying NOT NULL DEFAULT 'CONSULTA',
        "estado" character varying NOT NULL DEFAULT 'PENDIENTE',
        "respuesta" text,
        "fechaRespuesta" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_b3a3b8b7a3a8b5c3d5e2f1a2b3c" PRIMARY KEY ("id")
      )
    `);
    
    // Crear tabla de pagos
    await queryRunner.query(`
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
      )
    `);
    
    // Agregar relaciones para pagos
    await queryRunner.query(`
      ALTER TABLE "pagos" ADD CONSTRAINT "FK_f7b3cf6a0bf49af33a4c2cb7dc7" 
      FOREIGN KEY ("suscripcionId") REFERENCES "suscripciones"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);
    
    await queryRunner.query(`
      ALTER TABLE "pagos" ADD CONSTRAINT "FK_g7b3cf6a0bf49af33a4c2cb7dc7" 
      FOREIGN KEY ("usuarioId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    // Crear tabla de psicólogos
    await queryRunner.query(`
      CREATE TABLE "psicologo" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "usuarioId" uuid NOT NULL,
        "diagnosticos_experiencia" text[] DEFAULT '{}',
        "temas_experiencia" text[] DEFAULT '{}',
        "estilo_terapeutico" text[] DEFAULT '{}',
        "afinidad_paciente_preferida" text[] DEFAULT '{}',
        "genero" character varying(1) NOT NULL,
        "numeroRegistroProfesional" character varying,
        "experiencia" integer,
        "descripcion" text,
        "precioPresencial" numeric(10,2),
        "precioOnline" numeric(10,2),
        "disponibilidad" jsonb,
        "createdAt" timestamp DEFAULT now() NOT NULL,
        "updatedAt" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "PK_psicologo" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_psicologo_usuario" UNIQUE ("usuarioId"),
        CONSTRAINT "FK_psicologo_usuario" FOREIGN KEY ("usuarioId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // Crear tabla de reservas
    await queryRunner.query(`
      CREATE TABLE "reservas" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "boxId" uuid NOT NULL,
        "pacienteId" uuid NOT NULL,
        "psicologoId" uuid NOT NULL,
        "fecha" date NOT NULL,
        "horario" character varying NOT NULL,
        "precio" numeric(10,2) NOT NULL,
        "estado" character varying NOT NULL DEFAULT 'PENDIENTE',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_reservas" PRIMARY KEY ("id"),
        CONSTRAINT "FK_reservas_box" FOREIGN KEY ("boxId") REFERENCES "boxes"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_reservas_paciente" FOREIGN KEY ("pacienteId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_reservas_psicologo" FOREIGN KEY ("psicologoId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar relaciones
    await queryRunner.query(`ALTER TABLE "pagos" DROP CONSTRAINT IF EXISTS "FK_g7b3cf6a0bf49af33a4c2cb7dc7"`);
    await queryRunner.query(`ALTER TABLE "pagos" DROP CONSTRAINT IF EXISTS "FK_f7b3cf6a0bf49af33a4c2cb7dc7"`);
    await queryRunner.query(`ALTER TABLE "suscripciones" DROP CONSTRAINT IF EXISTS "FK_e2f1ae9e6f0f1aba0d1b1b1b1b1"`);
    await queryRunner.query(`ALTER TABLE "suscripciones" DROP CONSTRAINT IF EXISTS "FK_d2f1ae9e6f0f1aba0d1b1b1b1b1"`);
    await queryRunner.query(`ALTER TABLE "boxes" DROP CONSTRAINT IF EXISTS "FK_3c5e1ebfb1d5b6a42a5ae1be41b"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "bio"`);
    
    // Eliminar tablas
    await queryRunner.query(`DROP TABLE IF EXISTS "pagos"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "contactos"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "suscripciones"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "planes"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "boxes"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sedes"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "configuracion_sistema"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "psicologo"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "reservas"`);
  }

  private async checkIfTablesExist(queryRunner: QueryRunner): Promise<boolean> {
    const tablas = ['users', 'configuracion_sistema', 'sedes', 'boxes', 'planes', 'suscripciones', 'contactos', 'pagos', 'psicologo', 'reservas'];
    
    for (const tabla of tablas) {
      const result = await queryRunner.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = '${tabla}'
        );
      `);
      
      if (result[0].exists) {
        return true;
      }
    }
    
    return false;
  }
}
