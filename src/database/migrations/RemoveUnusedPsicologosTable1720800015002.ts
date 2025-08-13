import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveUnusedPsicologosTable1720800015002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Eliminar tabla psicologos si existe (no se usa)
    console.log('Eliminando tabla psicologos innecesaria...');
    await queryRunner.query(`DROP TABLE IF EXISTS "psicologos" CASCADE`);
    console.log('Tabla psicologos eliminada exitosamente');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No es necesario recrear la tabla innecesaria
    console.log('No se puede revertir la eliminación de la tabla psicologos');
  }
}
