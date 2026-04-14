import { MigrationInterface, QueryRunner } from 'typeorm';

export class LinkDocumentosToUsuario1760010000000
  implements MigrationInterface
{
  name = 'LinkDocumentosToUsuario1760010000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "documento_psicologo"
      ADD COLUMN IF NOT EXISTS "usuario_id" uuid
    `);

    await queryRunner.query(`
      UPDATE "documento_psicologo" d
      SET "usuario_id" = p."usuarioId"
      FROM "psicologo" p
      WHERE d."psicologo_id" = p."id"
        AND d."usuario_id" IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "documento_psicologo"
      ALTER COLUMN "usuario_id" SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "documento_psicologo"
      ALTER COLUMN "psicologo_id" DROP NOT NULL
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'FK_documento_psicologo_usuario'
        ) THEN
          ALTER TABLE "documento_psicologo"
          ADD CONSTRAINT "FK_documento_psicologo_usuario"
          FOREIGN KEY ("usuario_id") REFERENCES "users"("id") ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_documento_psicologo_usuario_id"
      ON "documento_psicologo" ("usuario_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_documento_psicologo_usuario_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "documento_psicologo"
      DROP CONSTRAINT IF EXISTS "FK_documento_psicologo_usuario"
    `);

    // Mantener consistencia al volver a NOT NULL en psicologo_id.
    await queryRunner.query(`
      DELETE FROM "documento_psicologo"
      WHERE "psicologo_id" IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "documento_psicologo"
      ALTER COLUMN "psicologo_id" SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "documento_psicologo"
      DROP COLUMN IF EXISTS "usuario_id"
    `);
  }
}
