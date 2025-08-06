import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateReservasTable1720800007000 implements MigrationInterface {
  name = 'UpdateReservasTable1720800007000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si la tabla existe
    const table = await queryRunner.getTable('reservas');
    if (!table) {
      // Crear la tabla si no existe
      await queryRunner.query(`
        CREATE TABLE "reservas" (
          "id" uuid NOT NULL DEFAULT gen_random_uuid(),
          "boxId" uuid NOT NULL,
          "psicologoId" uuid NOT NULL,
          "fecha" date NOT NULL,
          "horaInicio" character varying(5) NOT NULL,
          "horaFin" character varying(5) NOT NULL,
          "estado" character varying(20) NOT NULL DEFAULT 'pendiente',
          "precio" decimal(10,2) NOT NULL,
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_reservas" PRIMARY KEY ("id"),
          CONSTRAINT "FK_reservas_user" FOREIGN KEY ("psicologoId") REFERENCES "users"("id") ON DELETE CASCADE
        )
      `);
    } else {
      // Actualizar la tabla existente
      
      // Verificar si existe la columna pacienteId y eliminarla si existe
      const hasPacienteId = table.findColumnByName('pacienteId');
      if (hasPacienteId) {
        await queryRunner.query(`ALTER TABLE "reservas" DROP COLUMN "pacienteId"`);
      }

      // Verificar si existe la columna horario y eliminarla si existe
      const hasHorario = table.findColumnByName('horario');
      if (hasHorario) {
        await queryRunner.query(`ALTER TABLE "reservas" DROP COLUMN "horario"`);
      }

      // Agregar columnas nuevas si no existen
      const hasHoraInicio = table.findColumnByName('horaInicio');
      if (!hasHoraInicio) {
        await queryRunner.query(`ALTER TABLE "reservas" ADD COLUMN "horaInicio" character varying(5) NOT NULL DEFAULT '09:00'`);
      }

      const hasHoraFin = table.findColumnByName('horaFin');
      if (!hasHoraFin) {
        await queryRunner.query(`ALTER TABLE "reservas" ADD COLUMN "horaFin" character varying(5) NOT NULL DEFAULT '10:00'`);
      }

      // Actualizar el tipo de la columna fecha si es necesario
      await queryRunner.query(`ALTER TABLE "reservas" ALTER COLUMN "fecha" TYPE date`);

      // Actualizar el tipo de la columna estado
      await queryRunner.query(`ALTER TABLE "reservas" ALTER COLUMN "estado" TYPE character varying(20)`);
      await queryRunner.query(`ALTER TABLE "reservas" ALTER COLUMN "estado" SET DEFAULT 'pendiente'`);

      // Actualizar el tipo de la columna precio
      await queryRunner.query(`ALTER TABLE "reservas" ALTER COLUMN "precio" TYPE decimal(10,2)`);
    }

    // Crear índices para mejorar performance
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_reservas_psicologo" ON "reservas" ("psicologoId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_reservas_box" ON "reservas" ("boxId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_reservas_fecha" ON "reservas" ("fecha")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_reservas_estado" ON "reservas" ("estado")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar índices
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_reservas_estado"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_reservas_fecha"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_reservas_box"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_reservas_psicologo"`);

    // Revertir cambios en la tabla
    const table = await queryRunner.getTable('reservas');
    if (table) {
      // Eliminar columnas nuevas
      const hasHoraInicio = table.findColumnByName('horaInicio');
      if (hasHoraInicio) {
        await queryRunner.query(`ALTER TABLE "reservas" DROP COLUMN "horaInicio"`);
      }

      const hasHoraFin = table.findColumnByName('horaFin');
      if (hasHoraFin) {
        await queryRunner.query(`ALTER TABLE "reservas" DROP COLUMN "horaFin"`);
      }

      // Restaurar columnas originales
      await queryRunner.query(`ALTER TABLE "reservas" ADD COLUMN "pacienteId" uuid`);
      await queryRunner.query(`ALTER TABLE "reservas" ADD COLUMN "horario" character varying`);
      await queryRunner.query(`ALTER TABLE "reservas" ALTER COLUMN "fecha" TYPE character varying`);
      await queryRunner.query(`ALTER TABLE "reservas" ALTER COLUMN "estado" TYPE character varying`);
      await queryRunner.query(`ALTER TABLE "reservas" ALTER COLUMN "estado" SET DEFAULT 'PENDIENTE'`);
      await queryRunner.query(`ALTER TABLE "reservas" ALTER COLUMN "precio" TYPE numeric(10,2)`);
    }
  }
} 