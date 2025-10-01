import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreatePackPagosMensualesTable1735000000001 implements MigrationInterface {
  name = 'CreatePackPagosMensualesTable1735000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'packs_pagos_mensuales',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'asignacionId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'usuarioId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'mes',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'año',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'monto',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'montoPagado',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
            isNullable: false,
          },
          {
            name: 'montoReembolsado',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
            isNullable: false,
          },
          {
            name: 'estado',
            type: 'enum',
            enum: ['pendiente_pago', 'pagado', 'reembolsado', 'cancelado'],
            default: "'pendiente_pago'",
            isNullable: false,
          },
          {
            name: 'fechaPago',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'fechaVencimiento',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'observaciones',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'metodoPago',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'referenciaPago',
            type: 'varchar',
            length: '200',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Crear índices
    await queryRunner.createIndex(
      'packs_pagos_mensuales',
      new TableIndex({
        name: 'IDX_packs_pagos_mensuales_asignacion_mes_año',
        columnNames: ['asignacionId', 'mes', 'año'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'packs_pagos_mensuales',
      new TableIndex({
        name: 'IDX_packs_pagos_mensuales_usuario',
        columnNames: ['usuarioId'],
      }),
    );

    await queryRunner.createIndex(
      'packs_pagos_mensuales',
      new TableIndex({
        name: 'IDX_packs_pagos_mensuales_estado',
        columnNames: ['estado'],
      }),
    );

    await queryRunner.createIndex(
      'packs_pagos_mensuales',
      new TableIndex({
        name: 'IDX_packs_pagos_mensuales_fecha_vencimiento',
        columnNames: ['fechaVencimiento'],
      }),
    );

    // Crear foreign keys
    await queryRunner.query(`
      ALTER TABLE "packs_pagos_mensuales" 
      ADD CONSTRAINT "FK_packs_pagos_mensuales_asignacion" 
      FOREIGN KEY ("asignacionId") 
      REFERENCES "packs_asignaciones"("id") 
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "packs_pagos_mensuales" 
      ADD CONSTRAINT "FK_packs_pagos_mensuales_usuario" 
      FOREIGN KEY ("usuarioId") 
      REFERENCES "users"("id") 
      ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('packs_pagos_mensuales');
  }
}
