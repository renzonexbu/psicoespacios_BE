import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migración para crear tablas relacionadas con psicólogos
 */
export class PsicologosTables1716911400000 implements MigrationInterface {
  name = 'PsicologosTables1716911400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si ya existe la tabla de psicólogos
    const psicologosTableExists = await this.checkIfTableExists(queryRunner, 'psicologos');
    
    if (!psicologosTableExists) {
      // Crear tabla de psicólogos
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "psicologos" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "nombre" character varying NOT NULL,
          "fotoUrl" character varying,
          "modalidad" jsonb NOT NULL DEFAULT '[]',
          "especialidades" text[] NOT NULL DEFAULT '{}',
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
          "userId" uuid,
          CONSTRAINT "PK_psicologos" PRIMARY KEY ("id")
        )
      `);
      
      // Añadir relación con la tabla de usuarios si existe
      const usersTableExists = await this.checkIfTableExists(queryRunner, 'users');
      if (usersTableExists) {
        await queryRunner.query(`
          ALTER TABLE "psicologos" ADD CONSTRAINT "FK_psicologos_users"
          FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
      }
    }

    // Verificar si ya existe la tabla de disponibilidad
    const disponibilidadTableExists = await this.checkIfTableExists(queryRunner, 'disponibilidad_psicologos');
    
    if (!disponibilidadTableExists) {
      // Crear tabla de disponibilidad
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "disponibilidad_psicologos" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "fecha" date NOT NULL,
          "horarios" jsonb NOT NULL DEFAULT '[]',
          "psicologoId" uuid NOT NULL,
          "disponible" boolean NOT NULL DEFAULT true,
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_disponibilidad_psicologos" PRIMARY KEY ("id"),
          CONSTRAINT "FK_disponibilidad_psicologos" FOREIGN KEY ("psicologoId") 
            REFERENCES "psicologos"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        )
      `);
      
      // Crear índice para búsquedas eficientes
      await queryRunner.query(`
        CREATE INDEX "IDX_disponibilidad_fecha_psicologo" ON "disponibilidad_psicologos" ("fecha", "psicologoId")
      `);
    }

    // Verificar si ya existe la tabla de reservas
    const reservasTableExists = await this.checkIfTableExists(queryRunner, 'reservas_psicologos');
    
    if (!reservasTableExists) {
      // Crear tabla de reservas para psicólogos
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS "reservas_psicologos" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "psicologoId" uuid NOT NULL,
          "pacienteId" uuid NOT NULL,
          "fecha" date NOT NULL,
          "horaInicio" character varying NOT NULL,
          "horaFin" character varying NOT NULL,
          "modalidad" character varying NOT NULL,
          "estado" character varying NOT NULL DEFAULT 'pendiente',
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_reservas_psicologos" PRIMARY KEY ("id"),
          CONSTRAINT "FK_reservas_psicologos_psicologo" FOREIGN KEY ("psicologoId") 
            REFERENCES "psicologos"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        )
      `);
      
      // Crear índice para búsquedas eficientes
      await queryRunner.query(`
        CREATE INDEX "IDX_reservas_psicologo_fecha" ON "reservas_psicologos" ("psicologoId", "fecha")
      `);
      
      // Crear índice para búsquedas por paciente
      await queryRunner.query(`
        CREATE INDEX "IDX_reservas_paciente" ON "reservas_psicologos" ("pacienteId")
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar tablas en orden inverso para evitar problemas de restricciones de FK
    await queryRunner.query(`DROP TABLE IF EXISTS "reservas_psicologos"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "disponibilidad_psicologos"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "psicologos"`);
  }

  /**
   * Verifica si una tabla existe en la base de datos
   */
  private async checkIfTableExists(queryRunner: QueryRunner, tableName: string): Promise<boolean> {
    const result = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = '${tableName}'
      );
    `);
    
    return result[0].exists;
  }
}
