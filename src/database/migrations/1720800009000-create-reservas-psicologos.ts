import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateReservasSesiones1720800009000 implements MigrationInterface {
  name = 'CreateReservasSesiones1720800009000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear enum para EstadoReservaPsicologo
    await queryRunner.query(`
      CREATE TYPE "public"."estado_reserva_psicologo_enum" AS ENUM(
        'pendiente',
        'confirmada',
        'cancelada',
        'completada',
        'no_show'
      )
    `);

    // Crear enum para ModalidadSesion
    await queryRunner.query(`
      CREATE TYPE "public"."modalidad_sesion_enum" AS ENUM(
        'online',
        'presencial'
      )
    `);

    // Crear tabla reservas_sesiones
    await queryRunner.query(`
      CREATE TABLE "reservas_sesiones" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "psicologo_id" uuid NOT NULL,
        "paciente_id" uuid NOT NULL,
        "fecha" date NOT NULL,
        "hora_inicio" character varying(5) NOT NULL,
        "hora_fin" character varying(5) NOT NULL,
        "box_id" uuid,
        "modalidad" "public"."modalidad_sesion_enum" NOT NULL DEFAULT 'presencial',
        "estado" "public"."estado_reserva_psicologo_enum" NOT NULL DEFAULT 'pendiente',
        "observaciones" text,
        "metadatos" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_reservas_sesiones" PRIMARY KEY ("id")
      )
    `);

    // Agregar foreign keys
    await queryRunner.query(`
      ALTER TABLE "reservas_sesiones" 
      ADD CONSTRAINT "FK_reservas_sesiones_psicologo" 
      FOREIGN KEY ("psicologo_id") REFERENCES "psicologos"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "reservas_sesiones" 
      ADD CONSTRAINT "FK_reservas_sesiones_paciente" 
      FOREIGN KEY ("paciente_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "reservas_sesiones" 
      ADD CONSTRAINT "FK_reservas_sesiones_box" 
      FOREIGN KEY ("box_id") REFERENCES "boxes"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    // Crear índices para mejorar el rendimiento
    await queryRunner.query(`
      CREATE INDEX "IDX_reservas_sesiones_psicologo_id" ON "reservas_sesiones" ("psicologo_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_reservas_sesiones_paciente_id" ON "reservas_sesiones" ("paciente_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_reservas_sesiones_fecha" ON "reservas_sesiones" ("fecha")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_reservas_sesiones_box_id" ON "reservas_sesiones" ("box_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_reservas_sesiones_estado" ON "reservas_sesiones" ("estado")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_reservas_sesiones_modalidad" ON "reservas_sesiones" ("modalidad")
    `);

    // Índice compuesto para consultas de disponibilidad
    await queryRunner.query(`
      CREATE INDEX "IDX_reservas_sesiones_disponibilidad" 
      ON "reservas_sesiones" ("psicologo_id", "fecha", "hora_inicio", "hora_fin")
    `);

    // Índice compuesto para consultas de disponibilidad de box
    await queryRunner.query(`
      CREATE INDEX "IDX_reservas_sesiones_box_disponibilidad" 
      ON "reservas_sesiones" ("box_id", "fecha", "hora_inicio", "hora_fin")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar índices
    await queryRunner.query(`DROP INDEX "IDX_reservas_sesiones_box_disponibilidad"`);
    await queryRunner.query(`DROP INDEX "IDX_reservas_sesiones_disponibilidad"`);
    await queryRunner.query(`DROP INDEX "IDX_reservas_sesiones_modalidad"`);
    await queryRunner.query(`DROP INDEX "IDX_reservas_sesiones_estado"`);
    await queryRunner.query(`DROP INDEX "IDX_reservas_sesiones_box_id"`);
    await queryRunner.query(`DROP INDEX "IDX_reservas_sesiones_fecha"`);
    await queryRunner.query(`DROP INDEX "IDX_reservas_sesiones_paciente_id"`);
    await queryRunner.query(`DROP INDEX "IDX_reservas_sesiones_psicologo_id"`);

    // Eliminar foreign keys
    await queryRunner.query(`ALTER TABLE "reservas_sesiones" DROP CONSTRAINT "FK_reservas_sesiones_box"`);
    await queryRunner.query(`ALTER TABLE "reservas_sesiones" DROP CONSTRAINT "FK_reservas_sesiones_paciente"`);
    await queryRunner.query(`ALTER TABLE "reservas_sesiones" DROP CONSTRAINT "FK_reservas_sesiones_psicologo"`);

    // Eliminar tabla
    await queryRunner.query(`DROP TABLE "reservas_sesiones"`);

    // Eliminar enums
    await queryRunner.query(`DROP TYPE "public"."modalidad_sesion_enum"`);
    await queryRunner.query(`DROP TYPE "public"."estado_reserva_psicologo_enum"`);
  }
} 