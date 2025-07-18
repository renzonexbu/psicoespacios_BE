import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAcreditaciones1720800001000 implements MigrationInterface {
  name = 'CreateAcreditaciones1720800001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "acreditaciones" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "idPsicologo" uuid NOT NULL,
        "nombre" character varying NOT NULL,
        "urlFile" character varying NOT NULL,
        "estado" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_acreditaciones" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "acreditaciones"`);
  }
} 