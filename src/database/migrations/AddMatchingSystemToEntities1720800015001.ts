import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMatchingSystemToEntities1720800015001 implements MigrationInterface {
  name = 'AddMatchingSystemToEntities1720800015001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Agregar campos de matching a la tabla psicologo
    await queryRunner.query(`
      ALTER TABLE "psicologo" 
      ADD COLUMN IF NOT EXISTS "enfoque_teorico" text[] DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS "modalidad_atencion" text[] DEFAULT '{}'
    `);

    // Agregar campos de matching a la tabla pacientes
    await queryRunner.query(`
      ALTER TABLE "pacientes" 
      ADD COLUMN IF NOT EXISTS "diagnosticos_principales" text[] DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS "temas_principales" text[] DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS "estilo_terapeutico_preferido" text[] DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS "enfoque_teorico_preferido" text[] DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS "afinidad_personal_preferida" text[] DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS "genero" character varying(1),
      ADD COLUMN IF NOT EXISTS "modalidad_preferida" text[] DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS "genero_psicologo_preferido" text[] DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS "perfil_matching_completado" boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS "ultima_actualizacion_matching" TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP DEFAULT now(),
      ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP DEFAULT now()
    `);

    // Actualizar el campo genero en psicologo para incluir 'N' (no binario)
    await queryRunner.query(`
      ALTER TABLE "psicologo" 
      ALTER COLUMN "genero" TYPE character varying(1)
    `);

    // Crear índices para mejorar el rendimiento de las consultas de matching
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_psicologo_diagnosticos" ON "psicologo" USING GIN ("diagnosticos_experiencia");
      CREATE INDEX IF NOT EXISTS "IDX_psicologo_temas" ON "psicologo" USING GIN ("temas_experiencia");
      CREATE INDEX IF NOT EXISTS "IDX_psicologo_estilo" ON "psicologo" USING GIN ("estilo_terapeutico");
      CREATE INDEX IF NOT EXISTS "IDX_psicologo_enfoque" ON "psicologo" USING GIN ("enfoque_teorico");
      CREATE INDEX IF NOT EXISTS "IDX_psicologo_afinidad" ON "psicologo" USING GIN ("afinidad_paciente_preferida");
      CREATE INDEX IF NOT EXISTS "IDX_psicologo_modalidad" ON "psicologo" USING GIN ("modalidad_atencion");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_pacientes_diagnosticos" ON "pacientes" USING GIN ("diagnosticos_principales");
      CREATE INDEX IF NOT EXISTS "IDX_pacientes_temas" ON "pacientes" USING GIN ("temas_principales");
      CREATE INDEX IF NOT EXISTS "IDX_pacientes_estilo" ON "pacientes" USING GIN ("estilo_terapeutico_preferido");
      CREATE INDEX IF NOT EXISTS "IDX_pacientes_enfoque" ON "pacientes" USING GIN ("enfoque_teorico_preferido");
      CREATE INDEX IF NOT EXISTS "IDX_pacientes_afinidad" ON "pacientes" USING GIN ("afinidad_personal_preferida");
      CREATE INDEX IF NOT EXISTS "IDX_pacientes_modalidad" ON "pacientes" USING GIN ("modalidad_preferida");
      CREATE INDEX IF NOT EXISTS "IDX_pacientes_genero_psicologo" ON "pacientes" USING GIN ("genero_psicologo_preferido");
    `);

    // Crear tabla de configuración del sistema de matching
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "configuracion_matching" (
        "id" SERIAL PRIMARY KEY,
        "nombre" character varying(255) NOT NULL,
        "version" character varying(50) NOT NULL,
        "configuracion" jsonb NOT NULL,
        "activo" boolean DEFAULT true,
        "created_at" TIMESTAMP DEFAULT now(),
        "updated_at" TIMESTAMP DEFAULT now()
      )
    `);

    // Insertar configuración inicial del sistema de matching
    await queryRunner.query(`
      INSERT INTO "configuracion_matching" ("nombre", "version", "configuracion", "activo") 
      VALUES (
        'Sistema de Matching PsicoEspacios',
        '1.0.0',
        '{
          "criterios": [
            {"nombre": "Diagnósticos", "peso": 0.35, "descripcion": "Coincidencias Diagnósticas (35%)"},
            {"nombre": "Temas", "peso": 0.25, "descripcion": "Coincidencias Temáticas (25%)"},
            {"nombre": "Estilo", "peso": 0.20, "descripcion": "Coincidencias de Estilo Terapéutico (20%)"},
            {"nombre": "Enfoque", "peso": 0.10, "descripcion": "Enfoque teórico (10%)"},
            {"nombre": "Afinidad", "peso": 0.10, "descripcion": "Afinidad Personal (10%)"}
          ]
        }',
        true
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar índices
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_psicologo_diagnosticos";
      DROP INDEX IF EXISTS "IDX_psicologo_temas";
      DROP INDEX IF EXISTS "IDX_psicologo_estilo";
      DROP INDEX IF EXISTS "IDX_psicologo_enfoque";
      DROP INDEX IF EXISTS "IDX_psicologo_afinidad";
      DROP INDEX IF EXISTS "IDX_psicologo_modalidad";
      DROP INDEX IF EXISTS "IDX_pacientes_diagnosticos";
      DROP INDEX IF EXISTS "IDX_pacientes_temas";
      DROP INDEX IF EXISTS "IDX_pacientes_estilo";
      DROP INDEX IF EXISTS "IDX_pacientes_enfoque";
      DROP INDEX IF EXISTS "IDX_pacientes_afinidad";
      DROP INDEX IF EXISTS "IDX_pacientes_modalidad";
      DROP INDEX IF EXISTS "IDX_pacientes_genero_psicologo";
    `);

    // Eliminar tabla de configuración
    await queryRunner.query(`
      DROP TABLE IF EXISTS "configuracion_matching"
    `);

    // Eliminar campos de matching de la tabla pacientes
    await queryRunner.query(`
      ALTER TABLE "pacientes" 
      DROP COLUMN IF EXISTS "diagnosticos_principales",
      DROP COLUMN IF EXISTS "temas_principales",
      DROP COLUMN IF EXISTS "estilo_terapeutico_preferido",
      DROP COLUMN IF EXISTS "enfoque_teorico_preferido",
      DROP COLUMN IF EXISTS "afinidad_personal_preferida",
      DROP COLUMN IF EXISTS "genero",
      DROP COLUMN IF EXISTS "modalidad_preferida",
      DROP COLUMN IF EXISTS "genero_psicologo_preferido",
      DROP COLUMN IF EXISTS "perfil_matching_completado",
      DROP COLUMN IF EXISTS "ultima_actualizacion_matching",
      DROP COLUMN IF EXISTS "created_at",
      DROP COLUMN IF EXISTS "updated_at"
    `);

    // Eliminar campos de matching de la tabla psicologo
    await queryRunner.query(`
      ALTER TABLE "psicologo" 
      DROP COLUMN IF EXISTS "enfoque_teorico",
      DROP COLUMN IF EXISTS "modalidad_atencion"
    `);
  }
}

