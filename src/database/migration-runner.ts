// migration-runner.ts
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { verifyAndFixDatabaseStructure, AppDataSource } from './db-structure-verify';

// Cargar variables de entorno
dotenv.config();

// Función para ejecutar las migraciones
export async function runMigrations() {
  try {
    // Primero verificar y corregir la estructura de la base de datos
    await verifyAndFixDatabaseStructure();
    
    console.log('Iniciando conexión a la base de datos...');
    await AppDataSource.initialize();
    console.log('Conexión establecida correctamente.');
    
    console.log('Ejecutando migraciones...');
    await AppDataSource.runMigrations({ transaction: 'all' });
    console.log('Migraciones ejecutadas correctamente.');
    
    return { success: true, message: 'Migraciones completadas con éxito' };
  } catch (error) {
    console.error('Error al ejecutar migraciones:', error);
    return { success: false, message: `Error: ${error.message}` };
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('Conexión cerrada.');
    }
  }
}

// Ejecutar migraciones si el archivo se ejecuta directamente
if (require.main === module) {
  runMigrations()
    .then((result) => {
      console.log(result.message);
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Error inesperado:', error);
      process.exit(1);
    });
}

export { AppDataSource };
