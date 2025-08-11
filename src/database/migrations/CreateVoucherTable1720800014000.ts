import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateVoucherTable1720800014000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear la tabla voucher
    await queryRunner.query(`
      CREATE TABLE "voucher" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "nombre" character varying(100) NOT NULL,
        "porcentaje" double precision NOT NULL,
        "vencimiento" date NOT NULL,
        "modalidad" character varying(50) NOT NULL,
        "psicologoId" uuid NOT NULL,
        "limiteUsos" integer NOT NULL,
        "usosActuales" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP NULL,
        CONSTRAINT "PK_voucher_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_voucher_psicologo" FOREIGN KEY ("psicologoId") REFERENCES "psicologo"("id") ON DELETE CASCADE
      )
    `);

    // Crear índices para mejorar el rendimiento
    await queryRunner.query(`
      CREATE INDEX "IDX_voucher_psicologoId" ON "voucher" ("psicologoId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_voucher_vencimiento" ON "voucher" ("vencimiento")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_voucher_modalidad" ON "voucher" ("modalidad")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar índices
    await queryRunner.query(`DROP INDEX "IDX_voucher_modalidad"`);
    await queryRunner.query(`DROP INDEX "IDX_voucher_vencimiento"`);
    await queryRunner.query(`DROP INDEX "IDX_voucher_psicologoId"`);
    
    // Eliminar tabla
    await queryRunner.query(`DROP TABLE "voucher"`);
  }
} 