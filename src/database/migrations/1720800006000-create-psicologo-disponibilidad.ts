import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePsicologoDisponibilidad1720800006000 implements MigrationInterface {
  name = 'CreatePsicologoDisponibilidad1720800006000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear tabla psicologo_disponibilidad
    await queryRunner.query(`
      CREATE TABLE "psicologo_disponibilidad" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "psicologo_id" uuid NOT NULL,
        "day" character varying(20) NOT NULL,
        "active" boolean NOT NULL DEFAULT false,
        "hours" jsonb,
        "sede_id" character varying(50),
        "works_on_holidays" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_psicologo_disponibilidad" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_psicologo_disponibilidad_psicologo_day" UNIQUE ("psicologo_id", "day"),
        CONSTRAINT "FK_psicologo_disponibilidad_user" FOREIGN KEY ("psicologo_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // Crear índices para mejorar performance
    await queryRunner.query(`
      CREATE INDEX "IDX_psicologo_disponibilidad_psicologo" ON "psicologo_disponibilidad" ("psicologo_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_psicologo_disponibilidad_psicologo"`);
    await queryRunner.query(`DROP TABLE "psicologo_disponibilidad"`);
  }
} 