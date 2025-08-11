import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddExperienciaToTipoDocumento1720800013000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Agregar 'experiencia' al enum TipoDocumento
    await queryRunner.query(`
      ALTER TYPE "public"."tipo_documento_enum" ADD VALUE 'experiencia';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No podemos remover valores de un enum en PostgreSQL
    // Solo podemos recrear el enum, pero esto podría causar problemas con datos existentes
    console.log('Warning: Cannot remove enum value "experiencia" without recreating the enum');
  }
} 