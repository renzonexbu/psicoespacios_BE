import { Injectable, mixin, NestInterceptor, Type } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { memoryStorage } from 'multer';

export interface BackblazeUploadOptions {
  fieldName?: string;
  maxFileSize?: number;
  allowedMimeTypes?: string[];
  folder?: string;
}

export function BackblazeUploadInterceptor(
  options: BackblazeUploadOptions = {}
): Type<NestInterceptor> {
  @Injectable()
  class MixinInterceptor extends FileInterceptor(options.fieldName || 'file', {
    storage: memoryStorage(),
    limits: {
      fileSize: options.maxFileSize || 10 * 1024 * 1024, // 10MB por defecto
    },
    fileFilter: (req, file, callback) => {
      const allowedTypes = options.allowedMimeTypes || [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];

      if (!allowedTypes.includes(file.mimetype)) {
        return callback(
          new Error(`Tipo de archivo no permitido. Tipos permitidos: ${allowedTypes.join(', ')}`),
          false
        );
      }

      callback(null, true);
    },
  } as MulterOptions) {}

  return mixin(MixinInterceptor);
} 