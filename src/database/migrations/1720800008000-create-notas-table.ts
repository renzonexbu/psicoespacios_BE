import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotasTable1720800008000 implements MigrationInterface {
  name = 'CreateNotasTable1720800008000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear enum para tipos de nota
    await queryRunner.query(`
      CREATE TYPE "public"."tipo_nota_enum" AS ENUM(
        'sesion',
        'evaluacion', 
        'observacion',
        'plan_tratamiento',
        'progreso',
        'otro'
      )
    `);

    // Crear tabla notas
    await queryRunner.query(`
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
      )
    `);

    // Agregar foreign keys
    await queryRunner.query(`
      ALTER TABLE "notas" 
      ADD CONSTRAINT "FK_notas_psicologo" 
      FOREIGN KEY ("psicologo_id") 
      REFERENCES "users"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "notas" 
      ADD CONSTRAINT "FK_notas_paciente" 
      FOREIGN KEY ("paciente_id") 
      REFERENCES "users"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // Crear índices para mejorar performance
    await queryRunner.query(`
      CREATE INDEX "IDX_notas_psicologo_id" ON "notas" ("psicologo_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_notas_paciente_id" ON "notas" ("paciente_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_notas_tipo" ON "notas" ("tipo")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_notas_created_at" ON "notas" ("created_at")
    `);

    // Índice para búsqueda en contenido y título
    await queryRunner.query(`
      CREATE INDEX "IDX_notas_contenido_search" ON "notas" USING gin(to_tsvector('spanish', contenido))
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_notas_titulo_search" ON "notas" USING gin(to_tsvector('spanish', titulo))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar índices
    await queryRunner.query(`DROP INDEX "IDX_notas_contenido_search"`);
    await queryRunner.query(`DROP INDEX "IDX_notas_titulo_search"`);
    await queryRunner.query(`DROP INDEX "IDX_notas_created_at"`);
    await queryRunner.query(`DROP INDEX "IDX_notas_tipo"`);
    await queryRunner.query(`DROP INDEX "IDX_notas_paciente_id"`);
    await queryRunner.query(`DROP INDEX "IDX_notas_psicologo_id"`);

    // Eliminar foreign keys
    await queryRunner.query(`ALTER TABLE "notas" DROP CONSTRAINT "FK_notas_paciente"`);
    await queryRunner.query(`ALTER TABLE "notas" DROP CONSTRAINT "FK_notas_psicologo"`);

    // Eliminar tabla
    await queryRunner.query(`DROP TABLE "notas"`);

    // Eliminar enum
    await queryRunner.query(`DROP TYPE "public"."tipo_nota_enum"`);
  }
} 