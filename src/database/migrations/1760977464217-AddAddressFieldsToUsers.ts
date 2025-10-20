import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAddressFieldsToUsers1760977464217 implements MigrationInterface {
    name = 'AddAddressFieldsToUsers1760977464217'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD COLUMN "calleNumero" varchar NULL,
            ADD COLUMN "observacionDireccion" varchar NULL,
            ADD COLUMN "region" varchar NULL,
            ADD COLUMN "comuna" varchar NULL,
            ADD COLUMN "compania" varchar NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "users" 
            DROP COLUMN "calleNumero",
            DROP COLUMN "observacionDireccion",
            DROP COLUMN "region",
            DROP COLUMN "comuna",
            DROP COLUMN "compania"
        `);
    }
}
