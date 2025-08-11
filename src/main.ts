// Importar el polyfill para crypto.randomUUID en versiones anteriores de Node.js
import './config/polyfills';

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { DatabaseErrorInterceptor } from './common/interceptors/database-error.interceptor';
// Quitamos el import del ValidationInterceptor
// import { ValidationInterceptor } from './common/interceptors/validation.interceptor';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
import * as express from 'express';
import { join } from 'path';
import { BadRequestException } from '@nestjs/common';

async function bootstrap() {
  try {
    console.log('Iniciando aplicación...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Configurada' : 'No configurada');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });
      console.log('Aplicación NestJS creada exitosamente');
    
    // Servir archivos estáticos de /uploads
    app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

    // Configurar el filtro global de excepciones
    app.useGlobalFilters(new AllExceptionsFilter());
      // Configurar interceptores globales
    app.useGlobalInterceptors(
      new DatabaseErrorInterceptor(),
      // Quitamos el ValidationInterceptor que causa problemas
      // new ValidationInterceptor(),
      new TimeoutInterceptor(60000), // 60 segundos de timeout
    );
    
    // Quitamos el ValidationPipe global que causa problemas con archivos
    // app.useGlobalPipes(
    //   new ValidationPipe({
    //     whitelist: true,
    //     transform: true,
    //     transformOptions: {
    //       enableImplicitConversion: true,
    //     },
    //     skipMissingProperties: false,
    //     forbidNonWhitelisted: false,
    //     exceptionFactory: (errors) => {
    //       console.log('🔍 ValidationPipe - Errores de validación:', errors);
    //       const result = {};
    //       errors.forEach(error => {
    //         result[error.property] = Object.values(error.constraints || { error: 'Valor inválido' });
    //       });
    //       return new BadRequestException({
    //         message: 'Error de validación en los datos proporcionados',
    //         errors: result,
    //         details: errors,
    //       });
    //     }
    //   }),
    // );

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
