import { HttpStatus } from '@nestjs/common';

export interface ApiErrorResponse {
  statusCode: HttpStatus;
  message: string;
  error: string;
  timestamp: string;
  path: string;
  method: string;
  details?: Record<string, any> | null;
}

export interface ApiValidationError extends ApiErrorResponse {
  validationErrors: Record<string, string[]>;
}

export interface DatabaseErrorDetails {
  code?: string;
  table?: string;
  constraint?: string;
  detail?: string;
}

export enum ErrorType {
  VALIDATION = 'Validation Error',
  AUTHENTICATION = 'Authentication Error',
  AUTHORIZATION = 'Authorization Error',
  NOT_FOUND = 'Resource Not Found',
  DATABASE = 'Database Error',
  CONFLICT = 'Resource Conflict',
  BUSINESS_LOGIC = 'Business Logic Error',
  EXTERNAL_SERVICE = 'External Service Error',
  UNEXPECTED = 'Unexpected Error',
}
