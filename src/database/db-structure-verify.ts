/**
 * Utilidad para verificar y corregir la estructura de las tablas
 * en la base de datos antes de ejecutar las migraciones
 */
import { DataSource, QueryRunner } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config();

// Configuración de conexión a la base de datos
const getConnectionOptions = () => {
  // Si existe DATABASE_URL, usar esa configuración (para producción/Neon)
  if (process.env.DATABASE_URL) {
    return {
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [path.join(__dirname, '../**/*.entity{.ts,.js}')],
      migrations: [path.join(__dirname, '/migrations/*{.ts,.js}')],
      ssl: process.env.NODE_ENV === 'production' 
        ? { rejectUnauthorized: false } 
        : false,
    };
  }

  // Configuración para desarrollo local
  return {
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USERNAME || 'psicoespacios_user',
    password: process.env.DATABASE_PASSWORD || 'psicoespacios_password',
    database: process.env.DATABASE_NAME || 'psicoespacios',
    entities: [path.join(__dirname, '../**/*.entity{.ts,.js}')],
    migrations: [path.join(__dirname, '/migrations/*{.ts,.js}')],
    ssl: false,
  };
};

// Crear una nueva conexión a la base de datos
const AppDataSource = new DataSource({
  ...getConnectionOptions(),
  type: 'postgres',
  migrations: [path.join(__dirname, '/migrations/*.{ts,js}')],
  migrationsTableName: 'migrations_history'
});

/**
 * Verifica si una tabla existe en la base de datos
 */
async function tableExists(queryRunner: QueryRunner, tableName: string): Promise<boolean> {
  const result = await queryRunner.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_name = $1
    )
  `, [tableName]);
  
  return result[0].exists;
}

/**
 * Verifica si una columna existe en una tabla específica
 */
async function columnExists(queryRunner: QueryRunner, tableName: string, columnName: string): Promise<boolean> {
  const result = await queryRunner.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = $1
      AND column_name = $2
    )
  `, [tableName, columnName]);
  
  return result[0].exists;
}

/**
 * Elimina todas las tablas de la base de datos
 */
async function dropAllTables(queryRunner: QueryRunner): Promise<void> {
  console.log('Eliminando todas las tablas...');
  
  await queryRunner.query(`
    DO $$ DECLARE
      r RECORD;
    BEGIN
      FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
      END LOOP;
    END $$;
  `);
  
  console.log('Todas las tablas han sido eliminadas.');
}

/**
 * Crea la extensión uuid-ossp si no existe
 */
async function createUuidExtension(queryRunner: QueryRunner): Promise<void> {
  console.log('Creando extensión UUID-OSSP...');
  await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
}

/**
 * Verifica y arregla la estructura de la base de datos
 */
export async function verifyAndFixDatabaseStructure(): Promise<void> {
  let queryRunner: QueryRunner | undefined;
  
  try {
    console.log('Iniciando verificación de la estructura de la base de datos...');
    await AppDataSource.initialize();
    
    queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    
    // Verificar si necesitamos recrear todas las tablas
    const recreateTables = process.env.RECREATE_TABLES === 'true';
    
    if (recreateTables) {
      console.log('Recreando todas las tablas desde cero...');
      await dropAllTables(queryRunner);
    }
    
    // Crear extensión uuid-ossp
    await createUuidExtension(queryRunner);
    
    // Verificar si las tablas principales existen
    const usersExists = await tableExists(queryRunner, 'users');
    const configExists = await tableExists(queryRunner, 'configuracion_sistema');
    const sedesExists = await tableExists(queryRunner, 'sedes');
    const boxesExists = await tableExists(queryRunner, 'boxes');
    
    if (!usersExists || !configExists || !sedesExists || !boxesExists) {
      console.log('Una o más tablas principales no existen. Las migraciones crearán todas las tablas necesarias.');
    } else {
      console.log('Las tablas principales existen. Verificando estructura...');
      
      // Verificar estructura de la tabla boxes (que causó problemas anteriormente)
      if (boxesExists) {
        const nombreExists = await columnExists(queryRunner, 'boxes', 'nombre');
        const numeroExists = await columnExists(queryRunner, 'boxes', 'numero');
        
        if (numeroExists && !nombreExists) {
          console.log('Corrigiendo estructura de la tabla boxes...');
          
          // Opcional: Corregir estructura si es necesario (por ejemplo, renombrar columnas)
          // await queryRunner.query('ALTER TABLE boxes RENAME COLUMN numero TO nombre');
          
          // En lugar de corregir, es más seguro recrear desde cero
          await queryRunner.query('DROP TABLE boxes CASCADE');
          console.log('Tabla boxes eliminada para ser recreada correctamente por las migraciones.');
        }
      }
      
      // Verificar estructura de la tabla configuracion_sistema
      if (configExists) {
        const configGeneralExists = await columnExists(queryRunner, 'configuracion_sistema', 'configuracionGeneral');
        const configGeneralLowercaseExists = await columnExists(queryRunner, 'configuracion_sistema', 'configuraciongeneral');
        
        if (!configGeneralExists && configGeneralLowercaseExists) {
          // PostgreSQL convierte los nombres de columna a minúsculas a menos que estén entre comillas
          // Vamos a asegurarnos de que la consulta SQL use comillas para preservar las mayúsculas
          console.log('Detectada diferencia en mayúsculas/minúsculas en configuracion_sistema. Ajustando migración...');
        }
      }
    }
    
    console.log('Verificación de estructura completada.');
    
  } catch (error) {
    console.error('Error al verificar la estructura de la base de datos:', error);
    throw error;
  } finally {
    if (queryRunner) {
      await queryRunner.release();
    }
    
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

// Ejecutar la función directamente si este archivo se ejecuta como un script
if (require.main === module) {
  verifyAndFixDatabaseStructure()
    .then(() => {
      console.log('Verificación de estructura completada exitosamente.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error en la verificación de estructura:', error);
      process.exit(1);
    });
}

export { AppDataSource };
