import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { ValidationFailedException } from '../exceptions/custom-exceptions';
import { ErrorType } from '../interfaces/api-error.interface';

@Injectable()
export class ValidationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError(error => {
        // Errores de validación de class-validator
        if (error.name === 'ValidationError' || error.name === 'BadRequestException') {
          // Formatear los errores para que sean más legibles
          const formattedErrors = error.response?.message || error.errors || error.message;
          
          return throwError(() => new ValidationFailedException(formattedErrors));
        }
        
        // Errores de tipo de dato
        if (error.name === 'TypeError' && 
           (error.message.includes('undefined') || error.message.includes('null'))) {
          
          return throwError(() => new ValidationFailedException(
            'La estructura de datos enviada no es correcta. Verifique los campos obligatorios.'
          ));
        }
        
        // Si no es un error de validación, pasar al siguiente manejador
        return throwError(() => error);
      }),
    );
  }
}
