import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTimestampsToPagos1720800005000 implements MigrationInterface {
  name = 'AddTimestampsToPagos1720800005000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si las columnas ya existen
    const table = await queryRunner.getTable('pagos');
    const hasCreatedAt = table?.findColumnByName('createdAt');
    const hasUpdatedAt = table?.findColumnByName('updatedAt');

    if (!hasCreatedAt) {
      await queryRunner.query(`
        ALTER TABLE "pagos" 
        ADD COLUMN "createdAt" TIMESTAMP NOT NULL DEFAULT now()
      `);
    }

    if (!hasUpdatedAt) {
      await queryRunner.query(`
        ALTER TABLE "pagos" 
        ADD COLUMN "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "pagos" DROP COLUMN "updatedAt"`);
    await queryRunner.query(`ALTER TABLE "pagos" DROP COLUMN "createdAt"`);
  }
} 