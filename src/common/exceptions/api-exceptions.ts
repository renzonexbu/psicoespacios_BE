import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorType } from '../interfaces/api-error.interface';

export class MalformedJsonException extends HttpException {
  constructor(details?: Record<string, any>) {
    super({
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'La solicitud contiene JSON mal formado o inválido',
      error: ErrorType.VALIDATION,
      details,
    }, HttpStatus.BAD_REQUEST);
  }
}

export class MissingRequiredFieldsException extends HttpException {
  constructor(fields: string[] = []) {
    const fieldsStr = fields.length > 0 ? `(${fields.join(', ')})` : '';
    
    super({
      statusCode: HttpStatus.BAD_REQUEST,
      message: `Faltan campos requeridos en la solicitud ${fieldsStr}`,
      error: ErrorType.VALIDATION,
      details: { missingFields: fields },
    }, HttpStatus.BAD_REQUEST);
  }
}

export class InvalidCredentialsException extends HttpException {
  constructor(message = 'Credenciales inválidas. Compruebe su correo electrónico y contraseña.') {
    super({
      statusCode: HttpStatus.UNAUTHORIZED,
      message,
      error: ErrorType.AUTHENTICATION,
    }, HttpStatus.UNAUTHORIZED);
  }
}

export class TokenExpiredException extends HttpException {
  constructor(message = 'El token de autenticación ha expirado. Por favor, inicie sesión de nuevo.') {
    super({
      statusCode: HttpStatus.UNAUTHORIZED,
      message,
      error: ErrorType.AUTHENTICATION,
    }, HttpStatus.UNAUTHORIZED);
  }
}

export class InvalidTokenException extends HttpException {
  constructor(message = 'Token inválido o malformado') {
    super({
      statusCode: HttpStatus.UNAUTHORIZED,
      message,
      error: ErrorType.AUTHENTICATION,
    }, HttpStatus.UNAUTHORIZED);
  }
}

export class RateLimitExceededException extends HttpException {
  constructor(message = 'Ha excedido el límite de solicitudes. Por favor, espere antes de intentar nuevamente.', retryAfterSeconds = 60) {
    super({
      statusCode: HttpStatus.TOO_MANY_REQUESTS,
      message,
      error: ErrorType.BUSINESS_LOGIC,
      details: { retryAfter: retryAfterSeconds },
    }, HttpStatus.TOO_MANY_REQUESTS);
  }
}

export class InvalidOperationException extends HttpException {
  constructor(message = 'La operación solicitada no es válida en el contexto actual', details?: Record<string, any>) {
    super({
      statusCode: HttpStatus.BAD_REQUEST,
      message,
      error: ErrorType.BUSINESS_LOGIC,
      details,
    }, HttpStatus.BAD_REQUEST);
  }
}

export class UnsupportedMediaTypeException extends HttpException {
  constructor(message = 'Tipo de contenido no soportado. Verifique la cabecera Content-Type de su solicitud.') {
    super({
      statusCode: HttpStatus.UNSUPPORTED_MEDIA_TYPE,
      message,
      error: ErrorType.VALIDATION,
    }, HttpStatus.UNSUPPORTED_MEDIA_TYPE);
  }
}

export class PayloadTooLargeException extends HttpException {
  constructor(message = 'La solicitud es demasiado grande. Por favor, reduzca el tamaño de los datos enviados.') {
    super({
      statusCode: HttpStatus.PAYLOAD_TOO_LARGE,
      message,
      error: ErrorType.VALIDATION,
    }, HttpStatus.PAYLOAD_TOO_LARGE);
  }
}

export class ExternalServiceException extends HttpException {
  constructor(serviceName = 'servicio externo', message = `Error al comunicarse con el ${serviceName}`) {
    super({
      statusCode: HttpStatus.BAD_GATEWAY,
      message,
      error: ErrorType.EXTERNAL_SERVICE,
    }, HttpStatus.BAD_GATEWAY);
  }
}
