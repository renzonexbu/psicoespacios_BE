import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePacksTables1720800100000 implements MigrationInterface {
  name = 'CreatePacksTables1720800100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // packs_horas
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "packs_horas" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "nombre" varchar(120) NOT NULL,
        "horas" integer NOT NULL,
        "precio" numeric(10,2) NOT NULL,
        "activo" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // packs_asignaciones
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "packs_asignaciones" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "packId" uuid NOT NULL,
        "usuarioId" uuid NOT NULL,
        "estado" varchar NOT NULL DEFAULT 'ACTIVA',
        "recurrente" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_packs_asignaciones_pack" FOREIGN KEY ("packId") REFERENCES "packs_horas"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_packs_asignaciones_user" FOREIGN KEY ("usuarioId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // packs_asignaciones_horarios
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "packs_asignaciones_horarios" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "asignacionId" uuid NOT NULL,
        "diaSemana" integer NOT NULL,
        "horaInicio" varchar(5) NOT NULL,
        "horaFin" varchar(5) NOT NULL,
        "boxId" uuid NOT NULL,
        CONSTRAINT "FK_packs_asign_hor_asign" FOREIGN KEY ("asignacionId") REFERENCES "packs_asignaciones"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_packs_asign_hor_box" FOREIGN KEY ("boxId") REFERENCES "boxes"("id") ON DELETE CASCADE
      )
    `);

    // reservas.packAsignacionId
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "reservas" ADD COLUMN IF NOT EXISTS "packAsignacionId" uuid NULL;
      EXCEPTION
        WHEN duplicate_column THEN NULL;
      END $$;
    `);

    // FK para reservas.packAsignacionId
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "reservas" ADD CONSTRAINT "FK_reservas_pack_asignacion" FOREIGN KEY ("packAsignacionId") REFERENCES "packs_asignaciones"("id") ON DELETE SET NULL;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    // Índices útiles
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_packs_asignaciones_usuario" ON "packs_asignaciones"("usuarioId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_packs_asignaciones_estado" ON "packs_asignaciones"("estado")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_reservas_packAsignacionId" ON "reservas"("packAsignacionId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "reservas" DROP CONSTRAINT IF EXISTS "FK_reservas_pack_asignacion";
      EXCEPTION WHEN undefined_object THEN NULL; END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "reservas" DROP COLUMN IF EXISTS "packAsignacionId";
      EXCEPTION WHEN undefined_column THEN NULL; END $$;
    `);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_reservas_packAsignacionId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_packs_asignaciones_estado"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_packs_asignaciones_usuario"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "packs_asignaciones_horarios"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "packs_asignaciones"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "packs_horas"`);
  }
}


