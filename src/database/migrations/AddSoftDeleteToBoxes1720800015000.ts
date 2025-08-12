import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSoftDeleteToBoxes1720800015000 implements MigrationInterface {
  name = 'AddSoftDeleteToBoxes1720800015000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "boxes" 
      ADD COLUMN "deletedAt" TIMESTAMP NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "boxes" 
      DROP COLUMN "deletedAt"
    `);
  }
} 