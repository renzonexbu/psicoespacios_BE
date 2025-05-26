// 1685394100000-additional-tables.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migración para crear tablas adicionales
 */
export class AdditionalTables1685394100000 implements MigrationInterface {
  name = 'AdditionalTables1685394100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si las tablas ya existen para evitar errores
    const tablesExist = await this.checkIfTablesExist(queryRunner);
    
    if (tablesExist) {
      console.log('Las tablas adicionales ya existen en la base de datos. Omitiendo creación.');
      return;
    }

    // Crear tabla de perfiles de derivación
    await queryRunner.query(`
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

    // Agregar relación para perfiles de derivación
    await queryRunner.query(`
      ALTER TABLE "perfiles_derivacion" ADD CONSTRAINT "FK_43ab843e5cbb23fa71dd2789013" 
      FOREIGN KEY ("psicologoId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // Crear tabla de solicitudes de derivación
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "solicitudes_derivacion" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "motivo" text NOT NULL,
        "informacionAdicional" text,
        "estado" character varying NOT NULL DEFAULT 'PENDIENTE',
        "pacienteId" uuid,
        "psicologoId" uuid,
        "perfilDerivacionId" uuid,
        "fechaPrimeraSesion" TIMESTAMP,
        "montoPrimeraSesion" numeric(10,2),
        "notasRechazo" text,
        "fechaCreacion" TIMESTAMP NOT NULL DEFAULT now(),
        "fechaActualizacion" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_j7b3cf6a0bf49af33a4c2cb7dc7" PRIMARY KEY ("id")
      )
    `);

    // Agregar relaciones para solicitudes de derivación
    await queryRunner.query(`
      ALTER TABLE "solicitudes_derivacion" ADD CONSTRAINT "FK_k7b3cf6a0bf49af33a4c2cb7dc7" 
      FOREIGN KEY ("pacienteId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "solicitudes_derivacion" ADD CONSTRAINT "FK_l7b3cf6a0bf49af33a4c2cb7dc7" 
      FOREIGN KEY ("psicologoId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "solicitudes_derivacion" ADD CONSTRAINT "FK_527cf4cc7783936d28724db2b75" 
      FOREIGN KEY ("perfilDerivacionId") REFERENCES "perfiles_derivacion"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    // Crear tabla de pacientes
    await queryRunner.query(`
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
        "estado" character varying NOT NULL DEFAULT 'ACTIVO',
        "fechaCreacion" TIMESTAMP NOT NULL DEFAULT now(),
        "fechaActualizacion" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_n7b3cf6a0bf49af33a4c2cb7dc7" PRIMARY KEY ("id")
      )
    `);

    // Agregar relación para pacientes
    await queryRunner.query(`
      ALTER TABLE "pacientes" ADD CONSTRAINT "FK_o7b3cf6a0bf49af33a4c2cb7dc7" 
      FOREIGN KEY ("psicologoId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    // Crear tabla de fichas de sesión
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "fichas_sesion" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "fecha" TIMESTAMP NOT NULL,
        "duracion" integer NOT NULL DEFAULT 60,
        "motivoConsulta" text,
        "contenidoSesion" text,
        "observaciones" text,
        "tareas" text,
        "psicologoId" uuid,
        "pacienteId" uuid,
        "reservaId" uuid,
        "estado" character varying NOT NULL DEFAULT 'COMPLETA',
        "fechaCreacion" TIMESTAMP NOT NULL DEFAULT now(),
        "fechaActualizacion" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_p7b3cf6a0bf49af33a4c2cb7dc7" PRIMARY KEY ("id")
      )
    `);

    // Agregar relaciones para fichas de sesión
    await queryRunner.query(`
      ALTER TABLE "fichas_sesion" ADD CONSTRAINT "FK_q7b3cf6a0bf49af33a4c2cb7dc7" 
      FOREIGN KEY ("psicologoId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "fichas_sesion" ADD CONSTRAINT "FK_r7b3cf6a0bf49af33a4c2cb7dc7" 
      FOREIGN KEY ("pacienteId") REFERENCES "pacientes"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    // Crear tabla de reservas
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "reservas" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "fechaInicio" TIMESTAMP NOT NULL,
        "fechaFin" TIMESTAMP NOT NULL,
        "estado" character varying NOT NULL DEFAULT 'PENDIENTE',
        "notas" text,
        "psicologoId" uuid,
        "boxId" uuid,
        "suscripcionId" uuid,
        "fechaCreacion" TIMESTAMP NOT NULL DEFAULT now(),
        "fechaActualizacion" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_s7b3cf6a0bf49af33a4c2cb7dc7" PRIMARY KEY ("id")
      )
    `);

    // Agregar relaciones para reservas
    await queryRunner.query(`
      ALTER TABLE "reservas" ADD CONSTRAINT "FK_t7b3cf6a0bf49af33a4c2cb7dc7" 
      FOREIGN KEY ("psicologoId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "reservas" ADD CONSTRAINT "FK_u7b3cf6a0bf49af33a4c2cb7dc7" 
      FOREIGN KEY ("boxId") REFERENCES "boxes"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "reservas" ADD CONSTRAINT "FK_v7b3cf6a0bf49af33a4c2cb7dc7" 
      FOREIGN KEY ("suscripcionId") REFERENCES "suscripciones"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    // Completar relación faltante para fichas de sesión
    await queryRunner.query(`
      ALTER TABLE "fichas_sesion" ADD CONSTRAINT "FK_w7b3cf6a0bf49af33a4c2cb7dc7" 
      FOREIGN KEY ("reservaId") REFERENCES "reservas"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    // Completar relación faltante para pagos
    await queryRunner.query(`
      ALTER TABLE "pagos" ADD CONSTRAINT "FK_x7b3cf6a0bf49af33a4c2cb7dc7" 
      FOREIGN KEY ("solicitudDerivacionId") REFERENCES "solicitudes_derivacion"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar relaciones
    await queryRunner.query(`ALTER TABLE "pagos" DROP CONSTRAINT IF EXISTS "FK_x7b3cf6a0bf49af33a4c2cb7dc7"`);
    await queryRunner.query(`ALTER TABLE "fichas_sesion" DROP CONSTRAINT IF EXISTS "FK_w7b3cf6a0bf49af33a4c2cb7dc7"`);
    await queryRunner.query(`ALTER TABLE "reservas" DROP CONSTRAINT IF EXISTS "FK_v7b3cf6a0bf49af33a4c2cb7dc7"`);
    await queryRunner.query(`ALTER TABLE "reservas" DROP CONSTRAINT IF EXISTS "FK_u7b3cf6a0bf49af33a4c2cb7dc7"`);
    await queryRunner.query(`ALTER TABLE "reservas" DROP CONSTRAINT IF EXISTS "FK_t7b3cf6a0bf49af33a4c2cb7dc7"`);
    await queryRunner.query(`ALTER TABLE "fichas_sesion" DROP CONSTRAINT IF EXISTS "FK_r7b3cf6a0bf49af33a4c2cb7dc7"`);
    await queryRunner.query(`ALTER TABLE "fichas_sesion" DROP CONSTRAINT IF EXISTS "FK_q7b3cf6a0bf49af33a4c2cb7dc7"`);
    await queryRunner.query(`ALTER TABLE "pacientes" DROP CONSTRAINT IF EXISTS "FK_o7b3cf6a0bf49af33a4c2cb7dc7"`);
    await queryRunner.query(`ALTER TABLE "solicitudes_derivacion" DROP CONSTRAINT IF EXISTS "FK_m7b3cf6a0bf49af33a4c2cb7dc7"`);
    await queryRunner.query(`ALTER TABLE "solicitudes_derivacion" DROP CONSTRAINT IF EXISTS "FK_l7b3cf6a0bf49af33a4c2cb7dc7"`);
    await queryRunner.query(`ALTER TABLE "solicitudes_derivacion" DROP CONSTRAINT IF EXISTS "FK_k7b3cf6a0bf49af33a4c2cb7dc7"`);
    await queryRunner.query(`ALTER TABLE "perfiles_derivacion" DROP CONSTRAINT IF EXISTS "FK_43ab843e5cbb23fa71dd2789013"`);
    
    // Eliminar tablas
    await queryRunner.query(`DROP TABLE IF EXISTS "reservas"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "fichas_sesion"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "pacientes"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "solicitudes_derivacion"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "perfiles_derivacion"`);
  }

  private async checkIfTablesExist(queryRunner: QueryRunner): Promise<boolean> {
    const tablas = ['perfiles_derivacion', 'solicitudes_derivacion', 'pacientes', 'fichas_sesion', 'reservas'];
    
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
