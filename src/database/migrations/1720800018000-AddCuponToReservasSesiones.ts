import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCuponToReservasSesiones1720800018000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('🔄 Iniciando migración: Agregar cupón a reservas sesiones...');

    try {
      // Primero, verificar si las columnas ya existen
      const hasColumns = await queryRunner.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'reservas_sesiones' 
        AND column_name IN ('cupon_id', 'descuento_aplicado')
      `);

      if (hasColumns.length === 0) {
        // Agregar columna cupon_id
        console.log('➕ Agregando columna cupon_id...');
        await queryRunner.query(`
          ALTER TABLE "reservas_sesiones" 
          ADD COLUMN "cupon_id" uuid NULL
        `);

        // Agregar columna descuento_aplicado
        console.log('➕ Agregando columna descuento_aplicado...');
        await queryRunner.query(`
          ALTER TABLE "reservas_sesiones" 
          ADD COLUMN "descuento_aplicado" numeric(10,2) NULL DEFAULT 0
        `);

        // Crear índice para cupon_id
        console.log('📊 Creando índice para cupon_id...');
        await queryRunner.query(`
          CREATE INDEX "IDX_reservas_sesiones_cupon_id" ON "reservas_sesiones" ("cupon_id")
        `);

        // Verificar si la tabla voucher existe antes de crear la foreign key
        const voucherTable = await queryRunner.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_name = 'voucher'
        `);

        if (voucherTable.length > 0) {
          console.log('🔗 Agregando foreign key constraint...');
          await queryRunner.query(`
            ALTER TABLE "reservas_sesiones" 
            ADD CONSTRAINT "FK_reservas_sesiones_cupon" 
            FOREIGN KEY ("cupon_id") REFERENCES "voucher"("id") ON DELETE SET NULL
          `);
        } else {
          console.log('⚠️  Tabla voucher no existe, omitiendo foreign key constraint');
        }

        console.log('✅ Migración completada exitosamente');
      } else {
        console.log('ℹ️  Las columnas ya existen, omitiendo migración');
      }

    } catch (error) {
      console.error('❌ Error en migración:', error.message);
      throw error;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('🔄 Revirtiendo migración: Eliminar cupón de reservas sesiones...');

    try {
      // Verificar si el constraint existe antes de eliminarlo
      const constraintExists = await queryRunner.query(`
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'reservas_sesiones' 
        AND constraint_name = 'FK_reservas_sesiones_cupon'
      `);

      if (constraintExists.length > 0) {
        console.log('🗑️  Eliminando foreign key constraint...');
        await queryRunner.query(`
          ALTER TABLE "reservas_sesiones" 
          DROP CONSTRAINT "FK_reservas_sesiones_cupon"
        `);
      }

      // Verificar si el índice existe antes de eliminarlo
      const indexExists = await queryRunner.query(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'reservas_sesiones' 
        AND indexname = 'IDX_reservas_sesiones_cupon_id'
      `);

      if (indexExists.length > 0) {
        console.log('🗑️  Eliminando índice...');
        await queryRunner.query(`
          DROP INDEX "IDX_reservas_sesiones_cupon_id"
        `);
      }

      // Verificar si las columnas existen antes de eliminarlas
      const hasColumns = await queryRunner.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'reservas_sesiones' 
        AND column_name IN ('cupon_id', 'descuento_aplicado')
      `);

      if (hasColumns.length > 0) {
        console.log('🗑️  Eliminando columnas...');
        await queryRunner.query(`
          ALTER TABLE "reservas_sesiones" 
          DROP COLUMN IF EXISTS "descuento_aplicado"
        `);

        await queryRunner.query(`
          ALTER TABLE "reservas_sesiones" 
          DROP COLUMN IF EXISTS "cupon_id"
        `);
      }

      console.log('✅ Rollback completado exitosamente');

    } catch (error) {
      console.error('❌ Error en rollback:', error.message);
      throw error;
    }
  }
}
