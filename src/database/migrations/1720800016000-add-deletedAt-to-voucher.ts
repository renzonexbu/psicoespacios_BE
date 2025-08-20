import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeletedAtToVoucher1720800016000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Agregar columna deletedAt para soft delete
    await queryRunner.query(`
      ALTER TABLE "voucher" 
      ADD COLUMN "deletedAt" TIMESTAMP NULL
    `);

    // Crear índice para mejorar el rendimiento de consultas con soft delete
    await queryRunner.query(`
      CREATE INDEX "IDX_voucher_deletedAt" ON "voucher" ("deletedAt")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar índice
    await queryRunner.query(`DROP INDEX "IDX_voucher_deletedAt"`);
    
    // Eliminar columna
    await queryRunner.query(`
      ALTER TABLE "voucher" 
      DROP COLUMN "deletedAt"
    `);
  }
}
