import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEstadoPagoReservas1720800030000 implements MigrationInterface {
  name = 'AddEstadoPagoReservas1720800030000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear el tipo enum para estado de pago
    await queryRunner.query(`
      CREATE TYPE "estado_pago_reserva_enum" AS ENUM('pendiente_pago', 'pagado')
    `);

    // Agregar la columna estadoPago a la tabla reservas
    await queryRunner.query(`
      ALTER TABLE "reservas" 
      ADD COLUMN "estadoPago" "estado_pago_reserva_enum" NOT NULL DEFAULT 'pendiente_pago'
    `);

    // Opcional: Actualizar registros existentes
    // Si quieres que todas las reservas existentes tengan estado 'pagado' por defecto:
    // await queryRunner.query(`
    //   UPDATE "reservas" 
    //   SET "estadoPago" = 'pagado' 
    //   WHERE "estadoPago" = 'pendiente_pago'
    // `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar la columna estadoPago
    await queryRunner.query(`
      ALTER TABLE "reservas" 
      DROP COLUMN "estadoPago"
    `);

    // Eliminar el tipo enum
    await queryRunner.query(`
      DROP TYPE "estado_pago_reserva_enum"
    `);
  }
}

