import { Controller, Post, UploadedFile, UseInterceptors, BadRequestException, Delete, Param, UseGuards } from '@nestjs/common';
import { File as MulterFile } from 'multer';
import { BackblazeService } from './services/backblaze.service';
import { BackblazeUploadInterceptor } from './interceptors/backblaze-upload.interceptor';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('api/v1/uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  constructor(private readonly backblazeService: BackblazeService) {}

  @Post('image')
  @UseInterceptors(
    BackblazeUploadInterceptor({
      fieldName: 'file',
      maxFileSize: 5 * 1024 * 1024, // 5MB
      allowedMimeTypes: [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp'
      ],
      folder: 'images'
    })
  )
  async uploadImage(@UploadedFile() file: MulterFile) {
    if (!file) {
      throw new BadRequestException('No se subió ningún archivo');
    }

    try {
      const result = await this.backblazeService.uploadFile(file, 'images');
      return {
        success: true,
        ...result,
        message: 'Imagen subida exitosamente'
      };
    } catch (error) {
      throw new BadRequestException(`Error al subir imagen: ${error.message}`);
    }
  }

  @Post('pdf')
  @UseInterceptors(
    BackblazeUploadInterceptor({
      fieldName: 'file',
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedMimeTypes: ['application/pdf'],
      folder: 'pdfs'
    })
  )
  async uploadPdf(@UploadedFile() file: MulterFile) {
    if (!file) {
      throw new BadRequestException('No se subió ningún archivo');
    }

    try {
      const result = await this.backblazeService.uploadFile(file, 'pdfs');
      return {
        success: true,
        ...result,
        message: 'PDF subido exitosamente'
      };
    } catch (error) {
      throw new BadRequestException(`Error al subir PDF: ${error.message}`);
    }
  }

  @Post('document')
  @UseInterceptors(
    BackblazeUploadInterceptor({
      fieldName: 'file',
      maxFileSize: 15 * 1024 * 1024, // 15MB
      allowedMimeTypes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ],
      folder: 'documents'
    })
  )
  async uploadDocument(@UploadedFile() file: MulterFile) {
    if (!file) {
      throw new BadRequestException('No se subió ningún archivo');
    }

    try {
      const result = await this.backblazeService.uploadFile(file, 'documents');
      return {
        success: true,
        ...result,
        message: 'Documento subido exitosamente'
      };
    } catch (error) {
      throw new BadRequestException(`Error al subir documento: ${error.message}`);
    }
  }

  @Post('profile-image')
  @UseInterceptors(
    BackblazeUploadInterceptor({
      fieldName: 'file',
      maxFileSize: 3 * 1024 * 1024, // 3MB
      allowedMimeTypes: [
        'image/jpeg',
        'image/jpg',
        'image/png'
      ],
      folder: 'profile-images'
    })
  )
  async uploadProfileImage(@UploadedFile() file: MulterFile) {
    if (!file) {
      throw new BadRequestException('No se subió ningún archivo');
    }

    try {
      const result = await this.backblazeService.uploadFile(file, 'profile-images');
      return {
        success: true,
        ...result,
        message: 'Imagen de perfil subida exitosamente'
      };
    } catch (error) {
      throw new BadRequestException(`Error al subir imagen de perfil: ${error.message}`);
    }
  }

  @Delete(':key')
  async deleteFile(@Param('key') key: string) {
    try {
      await this.backblazeService.deleteFile(key);
      return {
        success: true,
        message: 'Archivo eliminado exitosamente'
      };
    } catch (error) {
      throw new BadRequestException(`Error al eliminar archivo: ${error.message}`);
    }
  }

  @Post('signed-url')
  async generateSignedUrl(@Param('key') key: string) {
    try {
      const signedUrl = await this.backblazeService.generateSignedUrl(key);
      return {
        success: true,
        signedUrl,
        expiresIn: 3600 // 1 hora
      };
    } catch (error) {
      throw new BadRequestException(`Error al generar URL firmada: ${error.message}`);
    }
  }
} 