import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Elimina tablas legacy que ya no usa el código activo.
 * - disponibilidad_psicologos → reemplazada por psicologo_disponibilidad
 * - reservas_psicologos → reemplazada por reservas_sesiones
 * - fichas_sesion → sin servicio ni endpoints
 * - configuracion_matching → matching usa config en código, no en BD
 */
export class DropLegacyUnusedTables1767000000000 implements MigrationInterface {
  name = 'DropLegacyUnusedTables1767000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS "disponibilidad_psicologos" CASCADE`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "reservas_psicologos" CASCADE`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "fichas_sesion" CASCADE`);
    await queryRunner.query(
      `DROP TABLE IF EXISTS "configuracion_matching" CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No se recrean tablas legacy; el esquema vigente no las necesita.
    void queryRunner;
  }
}
