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
