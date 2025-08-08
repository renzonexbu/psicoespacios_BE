import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateBlogsImagenNullable1720800008000 implements MigrationInterface {
  name = 'UpdateBlogsImagenNullable1720800008000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "blogs" ALTER COLUMN "imagen" DROP NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "blogs" ALTER COLUMN "imagen" SET NOT NULL
    `);
  }
} 