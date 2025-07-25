import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUrlImageToBoxes1720800003000 implements MigrationInterface {
  name = 'AddUrlImageToBoxes1720800003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "boxes" 
      ADD COLUMN "urlImage" character varying
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "boxes" 
      DROP COLUMN "urlImage"
    `);
  }
} 