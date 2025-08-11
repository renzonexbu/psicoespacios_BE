import { MigrationInterface, QueryRunner } from 'typeorm';

export class SimplifyDocumentosPsicologo1720800012000 implements MigrationInterface {
  name = 'SimplifyDocumentosPsicologo1720800012000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Primero eliminar la tabla existente si existe
    await queryRunner.query(`
      DROP TABLE IF EXISTS "documento_psicologo" CASCADE
    `);

    // Eliminar el tipo enum si existe
    await queryRunner.query(`
      DROP TYPE IF EXISTS "public"."tipo_documento_enum" CASCADE
    `);

    // Crear el tipo enum simplificado
    await queryRunner.query(`
      CREATE TYPE "public"."tipo_documento_enum" AS ENUM('titulo', 'certificado', 'diploma', 'licencia', 'otro')
    `);

    // Crear la tabla simplificada
    await queryRunner.query(`
      CREATE TABLE "documento_psicologo" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "psicologo_id" uuid NOT NULL,
        "tipo" "public"."tipo_documento_enum" NOT NULL DEFAULT 'titulo',
        "nombre" character varying(255) NOT NULL,
        "url_documento" character varying(500),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_documento_psicologo" PRIMARY KEY ("id")
      )
    `);

    // Agregar foreign key
    await queryRunner.query(`
      ALTER TABLE "documento_psicologo"
      ADD CONSTRAINT "FK_documento_psicologo_psicologo"
      FOREIGN KEY ("psicologo_id") REFERENCES "psicologo"("id") ON DELETE CASCADE
    `);

    // Crear índices
    await queryRunner.query(`
      CREATE INDEX "IDX_documento_psicologo_psicologo_id" ON "documento_psicologo" ("psicologo_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_documento_psicologo_tipo" ON "documento_psicologo" ("tipo")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar índices
    await queryRunner.query(`
      DROP INDEX "IDX_documento_psicologo_tipo"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_documento_psicologo_psicologo_id"
    `);

    // Eliminar foreign key
    await queryRunner.query(`
      ALTER TABLE "documento_psicologo" DROP CONSTRAINT "FK_documento_psicologo_psicologo"
    `);

    // Eliminar tabla
    await queryRunner.query(`
      DROP TABLE "documento_psicologo"
    `);

    // Eliminar tipo enum
    await queryRunner.query(`
      DROP TYPE "public"."tipo_documento_enum"
    `);
  }
} 