import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddFonasaToReservasSesiones1734651000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'reservas_sesiones',
      new TableColumn({
        name: 'fonasa',
        type: 'boolean',
        default: false,
        isNullable: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('reservas_sesiones', 'fonasa');
  }
}

