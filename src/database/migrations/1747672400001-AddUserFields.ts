import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserFields1747672400001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si ya existe el enum antes de crearlo
    const roleEnumExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_type
        WHERE typname = 'users_role_enum'
      );
    `);
    
    if (!roleEnumExists[0].exists) {
      await queryRunner.query(`
        CREATE TYPE "public"."users_role_enum" AS ENUM (
          'ADMIN',
          'PROFESIONAL',
          'CLIENTE'
        )
      `);
    }

    const estadoEnumExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_type
        WHERE typname = 'users_estado_enum'
      );
    `);

    if (!estadoEnumExists[0].exists) {
      await queryRunner.query(`
        CREATE TYPE "public"."users_estado_enum" AS ENUM (
          'ACTIVO',
          'INACTIVO',
          'PENDIENTE'
        )
      `);
    }

    // Verificar si la tabla users ya existe
    const tableExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    if (!tableExists[0].exists) {
      await queryRunner.query(`
        CREATE TABLE "users" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "email" character varying NOT NULL,
          "password" character varying NOT NULL,
          "firstName" character varying,
          "lastName" character varying,
          "rut" character varying,
          "telefono" character varying,
          "fechaNacimiento" DATE,
          "role" "public"."users_role_enum" NOT NULL DEFAULT 'CLIENTE',
          "estado" "public"."users_estado_enum" NOT NULL DEFAULT 'PENDIENTE',
          "verificado" boolean NOT NULL DEFAULT false,
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
          "isActive" boolean NOT NULL DEFAULT true,
          CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
          CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
        )
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Verificar si la tabla existe antes de intentar eliminarla
    const tableExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    if (tableExists[0].exists) {
      await queryRunner.query(`DROP TABLE "users"`);
    }
    
    // Verificar si los enums existen antes de intentar eliminarlos
    const estadoEnumExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_type
        WHERE typname = 'users_estado_enum'
      );
    `);
    
    if (estadoEnumExists[0].exists) {
      await queryRunner.query(`DROP TYPE "public"."users_estado_enum"`);
    }
    
    const roleEnumExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_type
        WHERE typname = 'users_role_enum'
      );
    `);
    
    if (roleEnumExists[0].exists) {
      await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    }
  }
}
