import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateHistorialPaciente1720800000000 implements MigrationInterface {
  name = 'CreateHistorialPaciente1720800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "historial_paciente" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tipo" character varying NOT NULL,
        "idUsuarioPaciente" uuid NOT NULL,
        "descripcion" text NOT NULL,
        "url" character varying,
        CONSTRAINT "PK_historial_paciente" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "historial_paciente"`);
  }
} 