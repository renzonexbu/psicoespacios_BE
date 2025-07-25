import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateArriendosBox1720800004000 implements MigrationInterface {
  name = 'CreateArriendosBox1720800004000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear enum para tipos de arriendo
    await queryRunner.query(`
      CREATE TYPE "public"."tipo_arriendo_enum" AS ENUM(
        'MENSUAL',
        'TRIMESTRAL', 
        'SEMESTRAL',
        'ANUAL',
        'PERSONALIZADO'
      )
    `);

    // Crear enum para estados de arriendo
    await queryRunner.query(`
      CREATE TYPE "public"."estado_arriendo_enum" AS ENUM(
        'PENDIENTE',
        'ACTIVO',
        'SUSPENDIDO',
        'CANCELADO',
        'VENCIDO'
      )
    `);

    // Crear tabla de arriendos de boxes
    await queryRunner.query(`
      CREATE TABLE "arriendos_box" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "boxId" uuid NOT NULL,
        "psicologoId" uuid NOT NULL,
        "tipoArriendo" "public"."tipo_arriendo_enum" NOT NULL DEFAULT 'MENSUAL',
        "fechaInicio" date NOT NULL,
        "fechaFin" date NOT NULL,
        "horarios" jsonb NOT NULL,
        "precioMensual" numeric(10,2) NOT NULL,
        "precioTotal" numeric(10,2) NOT NULL,
        "estado" "public"."estado_arriendo_enum" NOT NULL DEFAULT 'PENDIENTE',
        "observaciones" text,
        "condicionesEspeciales" jsonb,
        "renovacionAutomatica" boolean NOT NULL DEFAULT false,
        "fechaRenovacion" date,
        "motivoCancelacion" text,
        "fechaCancelacion" timestamp,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_arriendos_box" PRIMARY KEY ("id"),
        CONSTRAINT "FK_arriendos_box_box" FOREIGN KEY ("boxId") REFERENCES "boxes"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_arriendos_box_psicologo" FOREIGN KEY ("psicologoId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    // Crear índices para búsquedas eficientes
    await queryRunner.query(`
      CREATE INDEX "IDX_arriendos_box_psicologo" ON "arriendos_box" ("psicologoId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_arriendos_box_box" ON "arriendos_box" ("boxId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_arriendos_box_estado" ON "arriendos_box" ("estado")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_arriendos_box_fechas" ON "arriendos_box" ("fechaInicio", "fechaFin")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_arriendos_box_activos" ON "arriendos_box" ("estado", "fechaInicio", "fechaFin")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar índices
    await queryRunner.query(`DROP INDEX "IDX_arriendos_box_activos"`);
    await queryRunner.query(`DROP INDEX "IDX_arriendos_box_fechas"`);
    await queryRunner.query(`DROP INDEX "IDX_arriendos_box_estado"`);
    await queryRunner.query(`DROP INDEX "IDX_arriendos_box_box"`);
    await queryRunner.query(`DROP INDEX "IDX_arriendos_box_psicologo"`);

    // Eliminar tabla
    await queryRunner.query(`DROP TABLE "arriendos_box"`);

    // Eliminar enums
    await queryRunner.query(`DROP TYPE "public"."estado_arriendo_enum"`);
    await queryRunner.query(`DROP TYPE "public"."tipo_arriendo_enum"`);
  }
} 