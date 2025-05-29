import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';
import { ApiErrorResponse, ErrorType, DatabaseErrorDetails } from '../interfaces/api-error.interface';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Error interno del servidor';
    let error = ErrorType.UNEXPECTED;
    let details: Record<string, any> | null = null;

    // HttpExceptions (excepciones lanzadas por NestJS)
    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        message = (exceptionResponse as any).message || message;
        error = (exceptionResponse as any).error || exception.name;
        details = (exceptionResponse as any).details || null;
      } else if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      }
    } 
    // Errores de TypeORM para problemas con la base de datos
    else if (exception instanceof QueryFailedError) {
      statusCode = HttpStatus.BAD_REQUEST;
      message = 'Error en la consulta a la base de datos';
      error = ErrorType.DATABASE;
      
      // Crear detalles del error de base de datos
      const dbErrorDetails: DatabaseErrorDetails = {
        detail: exception.message
      };

      // Interpretar tipos específicos de errores de PostgreSQL
      if (exception.message.includes('duplicate key')) {
        message = 'Ya existe un registro con esta información';
        dbErrorDetails.constraint = 'UNIQUE';
      } else if (exception.message.includes('violates foreign key constraint')) {
        message = 'La referencia a otro registro no es válida';
        dbErrorDetails.constraint = 'FOREIGN KEY';
      } else if (exception.message.includes('connection')) {
        statusCode = HttpStatus.SERVICE_UNAVAILABLE;
        message = 'No se pudo conectar a la base de datos';
        dbErrorDetails.code = 'CONNECTION_ERROR';
      }

      details = dbErrorDetails;
    } 
    // Errores de validación
    else if (exception instanceof Error && exception.name === 'ValidationError') {
      statusCode = HttpStatus.BAD_REQUEST;
      message = 'Error de validación en los datos enviados';
      error = ErrorType.VALIDATION;
      details = { validationMessage: exception.message };
    }
    // Error de sintaxis JSON
    else if (exception instanceof SyntaxError && exception.message.includes('JSON')) {
      statusCode = HttpStatus.BAD_REQUEST;
      message = 'Formato JSON inválido en la solicitud';
      error = ErrorType.VALIDATION;
    }
    // TypeErrors para problemas con propiedades o métodos indefinidos
    else if (exception instanceof TypeError) {
      message = 'Error en la estructura de datos de la solicitud';
      error = ErrorType.VALIDATION;
      details = { typeError: exception.message };
    }
    // Otros errores genéricos
    else if (exception instanceof Error) {
      message = exception.message || message;
      error = ErrorType.UNEXPECTED;
      
      // En entorno de desarrollo incluimos el stack trace para debug
      if (process.env.NODE_ENV !== 'production') {
        details = {
          stack: exception.stack?.split('\n').slice(0, 3).join('\n')
        };
      }
    }

    // Personalización adicional de mensajes por código HTTP
    switch (statusCode) {
      case HttpStatus.BAD_REQUEST:
        if (!message || message === 'Bad Request') {
          message = 'Solicitud incorrecta o mal estructurada';
        }
        break;
      case HttpStatus.UNAUTHORIZED:
        message = 'No autorizado: es necesario autenticarse';
        error = ErrorType.AUTHENTICATION;
        break;
      case HttpStatus.FORBIDDEN:
        message = 'Prohibido: no tiene permisos para acceder a este recurso';
        error = ErrorType.AUTHORIZATION;
        break;
      case HttpStatus.NOT_FOUND:
        message = 'Recurso no encontrado';
        error = ErrorType.NOT_FOUND;
        break;
      case HttpStatus.METHOD_NOT_ALLOWED:
        message = 'Método no permitido para este recurso';
        break;
      case HttpStatus.CONFLICT:
        message = 'Conflicto: la solicitud no pudo completarse debido a un conflicto con el estado actual del recurso';
        error = ErrorType.CONFLICT;
        break;
      case HttpStatus.UNPROCESSABLE_ENTITY:
        message = 'Entidad no procesable: la solicitud fue bien formada pero no se puede procesar';
        error = ErrorType.VALIDATION;
        break;
      case HttpStatus.TOO_MANY_REQUESTS:
        message = 'Demasiadas solicitudes: por favor, inténtelo más tarde';
        break;
      case HttpStatus.SERVICE_UNAVAILABLE:
        message = 'Servicio no disponible temporalmente';
        break;
    }

    // No incluir detalles en producción para errores del servidor (500+)
    if (process.env.NODE_ENV === 'production' && statusCode >= 500) {
      details = null;
    }

    // Estructura de respuesta de error 
    const errorResponse: ApiErrorResponse = {
      statusCode,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      details: process.env.NODE_ENV !== 'production' ? details : null
    };

    // Registrar el error en logs
    if (statusCode >= 500) {
      console.error(`[CRITICAL] ${request.method} ${request.url}:`, {
        statusCode,
        error,
        message,
        exception,
      });
    } else {
      console.warn(`[ERROR] ${request.method} ${request.url}:`, {
        statusCode,
        error,
        message,
      });
    }

    response.status(statusCode).json(errorResponse);
  }
}
