import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMatchingSystem1703609400000 implements MigrationInterface {
    name = 'AddMatchingSystem1703609400000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Crear extensión UUID si no existe
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

        // 2. Actualizar tabla users - hacer campos obligatorios
        await queryRunner.query(`UPDATE users SET rut = 'PENDIENTE' WHERE rut IS NULL`);
        await queryRunner.query(`ALTER TABLE users ALTER COLUMN rut SET NOT NULL`);
        
        await queryRunner.query(`UPDATE users SET telefono = 'PENDIENTE' WHERE telefono IS NULL`);
        await queryRunner.query(`ALTER TABLE users ALTER COLUMN telefono SET NOT NULL`);
        
        await queryRunner.query(`UPDATE users SET "fechaNacimiento" = '1990-01-01' WHERE "fechaNacimiento" IS NULL`);
        await queryRunner.query(`ALTER TABLE users ALTER COLUMN "fechaNacimiento" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE users ALTER COLUMN "fechaNacimiento" TYPE date`);

        // 3. Añadir fotoUrl a users
        await queryRunner.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS "fotoUrl" character varying`);

        // 4. Actualizar enum users_role_enum si es necesario
        const roleEnumExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid 
                WHERE t.typname = 'users_role_enum' AND e.enumlabel = 'USUARIO'
            )
        `);

        if (roleEnumExists[0].exists) {
            await queryRunner.query(`ALTER TABLE users ALTER COLUMN role DROP DEFAULT`);
            await queryRunner.query(`ALTER TABLE users ALTER COLUMN role TYPE VARCHAR`);
            await queryRunner.query(`UPDATE users SET role = 'PACIENTE' WHERE role = 'USUARIO'`);
            await queryRunner.query(`DROP TYPE users_role_enum CASCADE`);
            await queryRunner.query(`CREATE TYPE users_role_enum AS ENUM ('ADMIN', 'PSICOLOGO', 'PACIENTE')`);
            await queryRunner.query(`ALTER TABLE users ALTER COLUMN role TYPE users_role_enum USING role::users_role_enum`);
            await queryRunner.query(`ALTER TABLE users ALTER COLUMN role SET DEFAULT 'PACIENTE'::users_role_enum`);
        }

        // 5. Crear tabla psicologo
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "psicologo" (
                "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
                "usuarioId" uuid NOT NULL,
                "diagnosticos_experiencia" text[] DEFAULT '{}',
                "temas_experiencia" text[] DEFAULT '{}',
                "estilo_terapeutico" text[] DEFAULT '{}',
                "afinidad_paciente_preferida" text[] DEFAULT '{}',
                "genero" character varying(1) NOT NULL,
                "numeroRegistroProfesional" character varying,
                "experiencia" integer,
                "descripcion" text,
                "modalidades" text[] DEFAULT '{}',
                "disponibilidad" jsonb,
                "createdAt" timestamp DEFAULT now() NOT NULL,
                "updatedAt" timestamp DEFAULT now() NOT NULL,
                CONSTRAINT "PK_psicologo" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_psicologo_usuario" UNIQUE ("usuarioId"),
                CONSTRAINT "FK_psicologo_usuario" FOREIGN KEY ("usuarioId") REFERENCES "users"("id") ON DELETE CASCADE
            )
        `);

        // 6. Backup y recrear tabla pacientes
        const pacientesExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'pacientes' AND column_name = 'psicologo'
            )
        `);

        if (pacientesExists[0].exists) {
            // Crear backup de pacientes existentes
            await queryRunner.query(`CREATE TABLE IF NOT EXISTS pacientes_backup AS SELECT * FROM pacientes`);
            await queryRunner.query(`DROP TABLE pacientes CASCADE`);
        }

        // Crear nueva tabla pacientes
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "pacientes" (
                "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
                "usuarioId" uuid NOT NULL,
                "diagnosticos" text[] DEFAULT '{}',
                "temas" text[] DEFAULT '{}',
                "estilo_esperado" text[] DEFAULT '{}',
                "afinidad" text[] DEFAULT '{}',
                "preferencias" jsonb,
                "estado" character varying DEFAULT 'ACTIVO' NOT NULL,
                "notas" text,
                "createdAt" timestamp DEFAULT now() NOT NULL,
                "updatedAt" timestamp DEFAULT now() NOT NULL,
                CONSTRAINT "PK_pacientes" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_pacientes_usuario" UNIQUE ("usuarioId"),
                CONSTRAINT "FK_pacientes_usuario" FOREIGN KEY ("usuarioId") REFERENCES "users"("id") ON DELETE CASCADE
            )
        `);

        // 7. Crear índices para performance
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_psicologo_usuario ON psicologo("usuarioId")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_pacientes_usuario ON pacientes("usuarioId")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Reversar cambios
        await queryRunner.query(`DROP INDEX IF EXISTS idx_users_role`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_pacientes_usuario`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_psicologo_usuario`);
        
        await queryRunner.query(`DROP TABLE IF EXISTS pacientes CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS psicologo CASCADE`);
        
        // Restaurar backup de pacientes si existe
        const backupExists = await queryRunner.query(`
            SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pacientes_backup')
        `);
        
        if (backupExists[0].exists) {
            await queryRunner.query(`CREATE TABLE pacientes AS SELECT * FROM pacientes_backup`);
            await queryRunner.query(`DROP TABLE pacientes_backup`);
        }
        
        await queryRunner.query(`ALTER TABLE users DROP COLUMN IF EXISTS "fotoUrl"`);
        
        // Revertir campos obligatorios (opcional, puede causar problemas con datos existentes)
        // await queryRunner.query(`ALTER TABLE users ALTER COLUMN rut DROP NOT NULL`);
        // await queryRunner.query(`ALTER TABLE users ALTER COLUMN telefono DROP NOT NULL`);
        // await queryRunner.query(`ALTER TABLE users ALTER COLUMN "fechaNacimiento" DROP NOT NULL`);
    }
}
