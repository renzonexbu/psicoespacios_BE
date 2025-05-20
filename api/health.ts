import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';

async function vercelHealthCheck() {
  try {
    // Crear una instancia temporal de la aplicación
    console.log('Iniciando verificación de salud...');
    const app = await NestFactory.create(AppModule);
    
    // Si llegamos aquí, la conexión a la base de datos fue exitosa
    console.log('✅ Conexión a la base de datos exitosa');
    
    // Cerrar la aplicación
    await app.close();
    return {
      statusCode: 200,
      message: 'Conexión exitosa a la base de datos',
    };
  } catch (error) {
    console.error('❌ Error durante la verificación de salud:', error);
    return {
      statusCode: 500,
      message: 'Error al conectar con la base de datos',
      error: error.message,
    };
  }
}

export default async function handler(req, res) {
  const result = await vercelHealthCheck();
  res.status(result.statusCode).json(result);
}
