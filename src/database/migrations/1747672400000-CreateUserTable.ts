import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateUserTable1747672400000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        console.log("Skipping CreateUserTable migration as we're using AddUserFields instead");
        // Verificar si la tabla users ya existe
        const tableExists = await queryRunner.query(`
          SELECT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'users'
          );
        `);
        
        if (tableExists[0].exists) {
            console.log("Table 'users' already exists, skipping creation");
            return;
        }
        
        // No creamos la tabla aquí ya que se hace en AddUserFields
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // No action needed since we're not creating the table
    }
}