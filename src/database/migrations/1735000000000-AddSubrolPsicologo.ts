import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSubrolPsicologo1735000000000 implements MigrationInterface {
  name = 'AddSubrolPsicologo1735000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear el tipo enum para subrol de psicólogo
    await queryRunner.query(`
      CREATE TYPE subrol_psicologo_enum AS ENUM ('ADB', 'CDD', 'AMBOS')
    `);

    // Agregar la columna subrol a la tabla users
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD COLUMN "subrol" subrol_psicologo_enum
    `);

    // Crear índice para mejorar performance en consultas por subrol
    await queryRunner.query(`
      CREATE INDEX "IDX_users_subrol" ON "users" ("subrol")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar el índice
    await queryRunner.query(`DROP INDEX "IDX_users_subrol"`);
    
    // Eliminar la columna subrol
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "subrol"`);
    
    // Eliminar el tipo enum
    await queryRunner.query(`DROP TYPE subrol_psicologo_enum`);
  }
}









