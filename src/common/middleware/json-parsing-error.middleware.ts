import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { MalformedJsonException } from '../exceptions';

/**
 * Middleware que detecta errores de parsing JSON en las solicitudes
 */
@Injectable()
export class JsonParsingErrorMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const originalBody = req.body;

    // Detectamos los errores de parsing JSON que Express ya haya capturado
    if (req.headers['content-type']?.includes('application/json') && 
        req.body instanceof SyntaxError && 
        (req.body as any).type === 'entity.parse.failed') {
      
      // Recuperamos el error original que Express capturó
      const error = req.body;
      
      // Limpiamos req.body para evitar comportamientos inesperados
      req.body = originalBody;
      
      // Lanzamos nuestra excepción personalizada
      throw new MalformedJsonException({
        originalError: error.message
      });
    }

    next();
  }
}
