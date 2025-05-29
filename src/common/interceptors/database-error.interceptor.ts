import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { QueryFailedError } from 'typeorm';
import { 
  ResourceNotFoundException, 
  DatabaseConnectionException,
  DuplicateResourceException,
  BadRequestException
} from '../exceptions/custom-exceptions';

@Injectable()
export class DatabaseErrorInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        if (error instanceof QueryFailedError) {
          // Manejar errores específicos de PostgreSQL/TypeORM
          const message = error.message;
          
          // Error de clave duplicada
          if (message.includes('duplicate key')) {
            return throwError(() => new DuplicateResourceException());
          } 
          
          // Error de clave foránea
          if (message.includes('violates foreign key constraint')) {
            return throwError(() => new BadRequestException('La referencia a otro registro no es válida. Compruebe que el ID referenciado existe.'));
          } 
          
          // Error de conexión a la base de datos
          if (message.includes('connection') || message.includes('ECONNREFUSED')) {
            return throwError(() => new DatabaseConnectionException('No se pudo establecer conexión con la base de datos. Vuelva a intentarlo en unos momentos.'));
          }

          // Error de tipo CHECK constraint
          if (message.includes('check constraint')) {
            return throwError(() => new BadRequestException('El valor proporcionado no cumple con las restricciones de validación de la base de datos'));
          }

          // Error de NOT NULL constraint
          if (message.includes('violates not-null constraint')) {
            return throwError(() => new BadRequestException('Falta un valor obligatorio en la solicitud'));
          }
          
          // Error de valor de datos
          if (message.includes('invalid input syntax') || message.includes('out of range')) {
            return throwError(() => new BadRequestException('Formato de datos inválido. Compruebe que los tipos de datos son correctos.'));
          }

          // Otros errores de base de datos
          return throwError(() => new DatabaseConnectionException('Error en la operación de base de datos'));
        }
        
        // Si no es un error específico de DB, lo pasamos al siguiente manejador
        return throwError(() => error);
      }),
    );
  }
}
