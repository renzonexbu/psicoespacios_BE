import { HttpException, HttpStatus } from '@nestjs/common';

export class DatabaseConnectionException extends HttpException {
  constructor(message = 'No se pudo establecer conexión con la base de datos') {
    super({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message,
      error: 'Database Connection Error',
    }, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

export class ResourceNotFoundException extends HttpException {
  constructor(resource = 'recurso', id?: string | number) {
    const message = id 
      ? `No se encontró ${resource} con ID: ${id}` 
      : `No se encontró el ${resource} especificado`;
    
    super({
      statusCode: HttpStatus.NOT_FOUND,
      message,
      error: 'Not Found',
    }, HttpStatus.NOT_FOUND);
  }
}

export class ValidationFailedException extends HttpException {
  constructor(errors: Record<string, string[]> | string) {
    super({
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'Error de validación en los datos proporcionados',
      error: 'Validation Failed',
      errors,
    }, HttpStatus.BAD_REQUEST);
  }
}

export class DuplicateResourceException extends HttpException {
  constructor(resource = 'recurso', field?: string) {
    const message = field 
      ? `Ya existe un ${resource} con el mismo valor de ${field}` 
      : `Ya existe un ${resource} con estos datos`;
    
    super({
      statusCode: HttpStatus.CONFLICT,
      message,
      error: 'Duplicate Resource',
    }, HttpStatus.CONFLICT);
  }
}

export class UnauthorizedAccessException extends HttpException {
  constructor(message = 'No está autorizado para realizar esta acción') {
    super({
      statusCode: HttpStatus.UNAUTHORIZED,
      message,
      error: 'Unauthorized',
    }, HttpStatus.UNAUTHORIZED);
  }
}

export class ForbiddenResourceException extends HttpException {
  constructor(message = 'No tiene permisos para acceder a este recurso') {
    super({
      statusCode: HttpStatus.FORBIDDEN,
      message,
      error: 'Forbidden',
    }, HttpStatus.FORBIDDEN);
  }
}

export class BadRequestException extends HttpException {
  constructor(message = 'Solicitud incorrecta o mal estructurada') {
    super({
      statusCode: HttpStatus.BAD_REQUEST,
      message,
      error: 'Bad Request',
    }, HttpStatus.BAD_REQUEST);
  }
}

export class PaymentRequiredException extends HttpException {
  constructor(message = 'Es necesario un pago para continuar') {
    super({
      statusCode: HttpStatus.PAYMENT_REQUIRED,
      message,
      error: 'Payment Required',
    }, HttpStatus.PAYMENT_REQUIRED);
  }
}

export class ConflictException extends HttpException {
  constructor(message = 'La solicitud no pudo completarse debido a un conflicto con el estado actual del recurso') {
    super({
      statusCode: HttpStatus.CONFLICT,
      message,
      error: 'Conflict',
    }, HttpStatus.CONFLICT);
  }
}

export class ServiceUnavailableException extends HttpException {
  constructor(message = 'El servicio no está disponible actualmente, intente más tarde') {
    super({
      statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      message,
      error: 'Service Unavailable',
    }, HttpStatus.SERVICE_UNAVAILABLE);
  }
}
