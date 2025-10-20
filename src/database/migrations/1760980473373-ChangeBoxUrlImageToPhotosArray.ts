import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeBoxUrlImageToPhotosArray1760980473373 implements MigrationInterface {
    name = 'ChangeBoxUrlImageToPhotosArray1760980473373'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Primero, agregar la nueva columna 'fotos' como array de texto
        await queryRunner.query(`
            ALTER TABLE "boxes" 
            ADD COLUMN "fotos" text[] DEFAULT '{}'
        `);

        // Migrar datos existentes de urlImage a fotos
        // Si hay una urlImage, la convertimos en el primer elemento del array fotos
        await queryRunner.query(`
            UPDATE "boxes" 
            SET "fotos" = CASE 
                WHEN "urlImage" IS NOT NULL AND "urlImage" != '' 
                THEN ARRAY["urlImage"]
                ELSE '{}'
            END
        `);

        // Eliminar la columna urlImage antigua
        await queryRunner.query(`
            ALTER TABLE "boxes" 
            DROP COLUMN "urlImage"
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Agregar de vuelta la columna urlImage
        await queryRunner.query(`
            ALTER TABLE "boxes" 
            ADD COLUMN "urlImage" character varying
        `);

        // Migrar datos de fotos a urlImage (tomar el primer elemento del array)
        await queryRunner.query(`
            UPDATE "boxes" 
            SET "urlImage" = CASE 
                WHEN array_length("fotos", 1) > 0 
                THEN "fotos"[1]
                ELSE NULL
            END
        `);

        // Eliminar la columna fotos
        await queryRunner.query(`
            ALTER TABLE "boxes" 
            DROP COLUMN "fotos"
        `);
    }
}
