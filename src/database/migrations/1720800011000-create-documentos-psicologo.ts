import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDocumentosPsicologo1720800011000 implements MigrationInterface {
  name = 'CreateDocumentosPsicologo1720800011000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear enum para tipos de documento
    await queryRunner.query(`
      CREATE TYPE "public"."tipo_documento_enum" AS ENUM('titulo', 'certificado', 'diploma', 'licencia', 'otro')
    `);

    // Crear tabla de documentos de psicólogos
    await queryRunner.query(`
      CREATE TABLE "documento_psicologo" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "psicologo_id" uuid NOT NULL,
        "tipo" "public"."tipo_documento_enum" NOT NULL DEFAULT 'titulo',
        "nombre" character varying(255) NOT NULL,
        "descripcion" text,
        "institucion" character varying(255),
        "fecha_emision" date,
        "numero_documento" character varying(255),
        "url_documento" character varying(500),
        "verificado" boolean NOT NULL DEFAULT false,
        "fecha_verificacion" date,
        "verificado_por" character varying(255),
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

    // Crear índices para mejorar el rendimiento
    await queryRunner.query(`
      CREATE INDEX "IDX_documento_psicologo_psicologo_id" ON "documento_psicologo" ("psicologo_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_documento_psicologo_tipo" ON "documento_psicologo" ("tipo")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_documento_psicologo_verificado" ON "documento_psicologo" ("verificado")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar índices
    await queryRunner.query(`DROP INDEX "IDX_documento_psicologo_verificado"`);
    await queryRunner.query(`DROP INDEX "IDX_documento_psicologo_tipo"`);
    await queryRunner.query(`DROP INDEX "IDX_documento_psicologo_psicologo_id"`);

    // Eliminar foreign key
    await queryRunner.query(`
      ALTER TABLE "documento_psicologo" DROP CONSTRAINT "FK_documento_psicologo_psicologo"
    `);

    // Eliminar tabla
    await queryRunner.query(`DROP TABLE "documento_psicologo"`);

    // Eliminar enum
    await queryRunner.query(`DROP TYPE "public"."tipo_documento_enum"`);
  }
} 