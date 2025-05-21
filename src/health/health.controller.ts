import { Controller, Get } from '@nestjs/common';

@Controller('api/v1/health')
export class HealthController {
  @Get()
  check() {
    return {
      statusCode: 200,
      message: 'Conexión exitosa a la base de datos',
    };
  }
}

@Controller('health')
export class RootHealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'API funcionando correctamente',
    };
  }
}
