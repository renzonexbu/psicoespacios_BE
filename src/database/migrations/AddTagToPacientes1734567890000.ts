import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTagToPacientes1734567890000 implements MigrationInterface {
  name = 'AddTagToPacientes1734567890000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Agregar columna tag a la tabla pacientes
    await queryRunner.query(`
      ALTER TABLE "pacientes" 
      ADD COLUMN IF NOT EXISTS "tag" character varying(100)
    `);

    // Crear índice para mejorar el rendimiento de búsquedas por tag
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_pacientes_tag" ON "pacientes" ("tag")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar índice
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_pacientes_tag"
    `);

    // Eliminar columna tag
    await queryRunner.query(`
      ALTER TABLE "pacientes" 
      DROP COLUMN IF EXISTS "tag"
    `);
  }
}

