import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCreatedAtToHistorialPaciente1734567891000 implements MigrationInterface {
  name = 'AddCreatedAtToHistorialPaciente1734567891000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Agregar columna createdAt a la tabla historial_paciente
    await queryRunner.query(`
      ALTER TABLE "historial_paciente" 
      ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP DEFAULT now()
    `);

    // Crear índice para mejorar el rendimiento de consultas por fecha
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_historial_paciente_createdAt" ON "historial_paciente" ("createdAt")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar índice
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_historial_paciente_createdAt"
    `);

    // Eliminar columna createdAt
    await queryRunner.query(`
      ALTER TABLE "historial_paciente" 
      DROP COLUMN IF EXISTS "createdAt"
    `);
  }
}























