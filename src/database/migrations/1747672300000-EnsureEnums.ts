import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnsureEnums1747672300000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar y crear las extensiones necesarias
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    
    // Verificar si ya existe el enum de roles antes de crearlo
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
          'PSICOLOGO',
          'PACIENTE'
        )
      `);
      console.log('Created users_role_enum successfully');
    } else {
      console.log('users_role_enum already exists');
    }

    // Verificar si ya existe el enum de estado antes de crearlo
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
          'SUSPENDIDO'
        )
      `);
      console.log('Created users_estado_enum successfully');
    } else {
      console.log('users_estado_enum already exists');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No hacemos nada en down para asegurarnos de que los enums permanezcan
  }
}
