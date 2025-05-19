import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateContactoTable1747673000000 implements MigrationInterface {
    name = 'CreateContactoTable1747673000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE "public"."contactos_tipo_enum" AS ENUM (
                'CONSULTA', 
                'RECLAMO', 
                'SUGERENCIA', 
                'OTRO'
            )
        `);
        
        await queryRunner.query(`
            CREATE TYPE "public"."contactos_estado_enum" AS ENUM (
                'NUEVA', 
                'VISTA', 
                'SOLUCIONADA'
            )
        `);
        
        await queryRunner.query(`
            CREATE TABLE "contactos" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "nombre" character varying NOT NULL,
                "tipo" "public"."contactos_tipo_enum" NOT NULL DEFAULT 'CONSULTA',
                "email" character varying NOT NULL,
                "telefono" character varying,
                "mensaje" text NOT NULL,
                "fecha" TIMESTAMP NOT NULL DEFAULT now(),
                "estado" "public"."contactos_estado_enum" NOT NULL DEFAULT 'NUEVA',
                CONSTRAINT "PK_994cdcb2c56dfb5b66217c854cc" PRIMARY KEY ("id")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "contactos"`);
        await queryRunner.query(`DROP TYPE "public"."contactos_estado_enum"`);
        await queryRunner.query(`DROP TYPE "public"."contactos_tipo_enum"`);
    }
}
