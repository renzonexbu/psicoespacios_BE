import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEsGlobalAndNullablePsicologoIdToVoucher1735501000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Agregar columna esGlobal (boolean, default false, not null)
    await queryRunner.query(`
      ALTER TABLE "voucher"
      ADD COLUMN IF NOT EXISTS "esGlobal" boolean NOT NULL DEFAULT false
    `);

    // Hacer opcional la columna psicologoId para permitir cupones globales
    await queryRunner.query(`
      ALTER TABLE "voucher"
      ALTER COLUMN "psicologoId" DROP NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revertir opcionalidad de psicologoId (volver a NOT NULL)
    await queryRunner.query(`
      ALTER TABLE "voucher"
      ALTER COLUMN "psicologoId" SET NOT NULL
    `);

    // Eliminar columna esGlobal
    await queryRunner.query(`
      ALTER TABLE "voucher"
      DROP COLUMN IF EXISTS "esGlobal"
    `);
  }
}


