import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFlowFields1766000000000 implements MigrationInterface {
  name = 'AddFlowFields1766000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // planes
    await queryRunner.query(
      `ALTER TABLE "planes" ADD COLUMN IF NOT EXISTS "flowPlanId" character varying`,
    );
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'UQ_planes_flowPlanId'
        ) THEN
          ALTER TABLE "planes"
          ADD CONSTRAINT "UQ_planes_flowPlanId" UNIQUE ("flowPlanId");
        END IF;
      END$$;
    `);

    // users
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "flowCustomerId" character varying`,
    );

    // suscripciones
    await queryRunner.query(
      `ALTER TABLE "suscripciones" ADD COLUMN IF NOT EXISTS "flowSubscriptionId" character varying`,
    );
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'UQ_suscripciones_flowSubscriptionId'
        ) THEN
          ALTER TABLE "suscripciones"
          ADD CONSTRAINT "UQ_suscripciones_flowSubscriptionId" UNIQUE ("flowSubscriptionId");
        END IF;
      END$$;
    `);
    await queryRunner.query(
      `ALTER TABLE "suscripciones" ADD COLUMN IF NOT EXISTS "flowLastInvoiceId" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "suscripciones" ADD COLUMN IF NOT EXISTS "flowNextInvoiceDate" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "suscripciones" ADD COLUMN IF NOT EXISTS "flowStatus" integer`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // suscripciones
    await queryRunner.query(
      `ALTER TABLE "suscripciones" DROP COLUMN IF EXISTS "flowStatus"`,
    );
    await queryRunner.query(
      `ALTER TABLE "suscripciones" DROP COLUMN IF EXISTS "flowNextInvoiceDate"`,
    );
    await queryRunner.query(
      `ALTER TABLE "suscripciones" DROP COLUMN IF EXISTS "flowLastInvoiceId"`,
    );
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'UQ_suscripciones_flowSubscriptionId'
        ) THEN
          ALTER TABLE "suscripciones" DROP CONSTRAINT "UQ_suscripciones_flowSubscriptionId";
        END IF;
      END$$;
    `);
    await queryRunner.query(
      `ALTER TABLE "suscripciones" DROP COLUMN IF EXISTS "flowSubscriptionId"`,
    );

    // users
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "flowCustomerId"`,
    );

    // planes
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'UQ_planes_flowPlanId'
        ) THEN
          ALTER TABLE "planes" DROP CONSTRAINT "UQ_planes_flowPlanId";
        END IF;
      END$$;
    `);
    await queryRunner.query(
      `ALTER TABLE "planes" DROP COLUMN IF EXISTS "flowPlanId"`,
    );
  }
}

