import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddFonasaToPsicologo1734650000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'psicologo',
      new TableColumn({
        name: 'fonasa',
        type: 'boolean',
        default: false,
        isNullable: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('psicologo', 'fonasa');
  }
}
