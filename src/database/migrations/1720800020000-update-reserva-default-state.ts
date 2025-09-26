import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateReservaDefaultState1720800020000 implements MigrationInterface {
    name = 'UpdateReservaDefaultState1720800020000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Actualizar el valor por defecto de la columna estado en la tabla reservas
        await queryRunner.query(`ALTER TABLE "reservas" ALTER COLUMN "estado" SET DEFAULT 'confirmada'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revertir el valor por defecto a 'pendiente'
        await queryRunner.query(`ALTER TABLE "reservas" ALTER COLUMN "estado" SET DEFAULT 'pendiente'`);
    }
}

