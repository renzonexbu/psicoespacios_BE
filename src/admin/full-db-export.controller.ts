import { Controller, Get, Header, UseGuards } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

type TableRow = {
  table_name: string;
};

@Controller('api/v1/admin/export')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class FullDbExportController {
  constructor(private readonly dataSource: DataSource) {}

  @Get('full-db')
  @Header('Cache-Control', 'no-store')
  async exportFullDb() {
    const tables = await this.dataSource.query<TableRow[]>(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    const data: Record<string, { rowCount: number; rows: unknown[] }> = {};

    for (const table of tables) {
      const tableName = table.table_name;
      const rows = await this.dataSource.query(
        `SELECT * FROM public.${this.quoteIdentifier(tableName)}`,
      );
      data[tableName] = {
        rowCount: rows.length,
        rows,
      };
    }

    return {
      exportedAt: new Date().toISOString(),
      schema: 'public',
      tableCount: tables.length,
      tables: data,
    };
  }

  private quoteIdentifier(identifier: string): string {
    return `"${identifier.replace(/"/g, '""')}"`;
  }
}
