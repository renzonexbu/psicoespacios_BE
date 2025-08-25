import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCuponToPagos1720800017000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Agregar columna cuponId
    await queryRunner.query(`
      ALTER TABLE "pagos" 
      ADD COLUMN "cuponId" uuid NULL
    `);

    // Agregar columna descuentoAplicado
    await queryRunner.query(`
      ALTER TABLE "pagos" 
      ADD COLUMN "descuentoAplicado" numeric(10,2) NOT NULL DEFAULT 0
    `);

    // Agregar columna montoFinal
    await queryRunner.query(`
      ALTER TABLE "pagos" 
      ADD COLUMN "montoFinal" numeric(10,2) NOT NULL DEFAULT 0
    `);

    // Crear foreign key para cuponId
    await queryRunner.query(`
      ALTER TABLE "pagos" 
      ADD CONSTRAINT "FK_pagos_cupon" 
      FOREIGN KEY ("cuponId") REFERENCES "voucher"("id") ON DELETE SET NULL
    `);

    // Crear índice para mejorar rendimiento de consultas por cupón
    await queryRunner.query(`
      CREATE INDEX "IDX_pagos_cuponId" ON "pagos" ("cuponId")
    `);

    // Actualizar montoFinal para registros existentes (monto - descuentoAplicado)
    await queryRunner.query(`
      UPDATE "pagos" 
      SET "montoFinal" = "monto" - "descuentoAplicado"
      WHERE "descuentoAplicado" > 0
    `);

    // Para registros sin descuento, montoFinal = monto
    await queryRunner.query(`
      UPDATE "pagos" 
      SET "montoFinal" = "monto"
      WHERE "descuentoAplicado" = 0 OR "descuentoAplicado" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar foreign key
    await queryRunner.query(`ALTER TABLE "pagos" DROP CONSTRAINT "FK_pagos_cupon"`);
    
    // Eliminar índice
    await queryRunner.query(`DROP INDEX "IDX_pagos_cuponId"`);
    
    // Eliminar columnas
    await queryRunner.query(`ALTER TABLE "pagos" DROP COLUMN "montoFinal"`);
    await queryRunner.query(`ALTER TABLE "pagos" DROP COLUMN "descuentoAplicado"`);
    await queryRunner.query(`ALTER TABLE "pagos" DROP COLUMN "cuponId"`);
  }
}



