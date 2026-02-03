import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProximamenteToPlanes1735600000000
  implements MigrationInterface
{
  name = 'AddProximamenteToPlanes1735600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "planes"
      ADD COLUMN IF NOT EXISTS "proximamente" BOOLEAN NOT NULL DEFAULT false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "planes"
      DROP COLUMN IF EXISTS "proximamente"
    `);
  }
}
