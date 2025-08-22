import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeletedAtToVoucher1720800016000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Agregar columna deletedAt para soft delete (solo si no existe)
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "voucher" ADD COLUMN "deletedAt" TIMESTAMP NULL;
      EXCEPTION
        WHEN duplicate_column THEN null;
      END $$;
    `);

    // Crear índice para mejorar el rendimiento de consultas con soft delete (solo si no existe)
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE INDEX "IDX_voucher_deletedAt" ON "voucher" ("deletedAt");
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
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


