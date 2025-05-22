// Importar el polyfill para crypto.randomUUID en versiones anteriores de Node.js
import './config/polyfills';

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  try {
    console.log('Iniciando aplicación...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Configurada' : 'No configurada');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });
    
    console.log('Aplicación NestJS creada exitosamente');
    
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    app.enableCors({
      origin: '*',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
    });
    
    // Usar puerto dinámico para Vercel o 3000 para desarrollo local
    const port = process.env.PORT || 3000;
    // Escuchar en 0.0.0.0 para que sea accesible desde fuera del contenedor
    await app.listen(port, '0.0.0.0');
    console.log(`✅ Aplicación iniciada exitosamente en 0.0.0.0:${port}`);
    console.log(`URL de la aplicación: ${await app.getUrl()}`);
  } catch (error) {
    console.error('❌ Error al iniciar la aplicación:', error);
    throw error;
  }
}
bootstrap();
