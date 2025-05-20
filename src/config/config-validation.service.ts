import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ConfigValidationService implements OnModuleInit {
  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    // Validar variables de entorno críticas
    const requiredEnvVars = [
      'DATABASE_URL',
      'JWT_SECRET',
    ];

    const missingVars = requiredEnvVars.filter(
      (envVar) => !this.configService.get(envVar),
    );

    if (missingVars.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missingVars.join(', ')}`,
      );
    }

    // Validar conexión a la base de datos
    try {
      const dbUrl = this.configService.get('DATABASE_URL');
      console.log('Database URL configurada:', dbUrl ? 'Sí' : 'No');
      
      if (dbUrl) {
        const urlParts = new URL(dbUrl);
        console.log('Host de la base de datos:', urlParts.hostname);
        console.log('Puerto de la base de datos:', urlParts.port);
        console.log('Nombre de la base de datos:', urlParts.pathname.slice(1));
      }
    } catch (error) {
      console.error('Error al validar la URL de la base de datos:', error.message);
      throw error;
    }
  }
}
