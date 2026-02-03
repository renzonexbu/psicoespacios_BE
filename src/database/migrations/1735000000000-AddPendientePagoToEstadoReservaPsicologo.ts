import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPendientePagoToEstadoReservaPsicologo1735000000000
  implements MigrationInterface
{
  name = 'AddPendientePagoToEstadoReservaPsicologo1735000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Agregar 'pendiente_pago' al enum estado_reserva_psicologo_enum
    await queryRunner.query(`
      ALTER TYPE "public"."estado_reserva_psicologo_enum" 
      ADD VALUE IF NOT EXISTS 'pendiente_pago'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Nota: PostgreSQL no permite eliminar valores de un enum directamente
    // Si necesitas revertir esto, tendrías que:
    // 1. Crear un nuevo enum sin 'pendiente_pago'
    // 2. Migrar los datos
    // 3. Eliminar el enum viejo
    // 4. Renombrar el nuevo enum
    // Por ahora, simplemente no hacemos nada en el down
    // ya que eliminar valores de enum es complejo y rara vez necesario
    // Si hay registros usando 'pendiente_pago', primero hay que actualizarlos
  }
}
