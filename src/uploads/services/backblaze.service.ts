import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';

// Definir el tipo para archivos de Multer
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
  destination?: string;
  filename?: string;
  path?: string;
}

export interface UploadResult {
  url: string;
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  bucket: string;
  key: string;
}

export interface FileMetadata {
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  bucket: string;
  key: string;
  url: string;
}

@Injectable()
export class BackblazeService {
  private readonly logger = new Logger(BackblazeService.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly region: string;
  private readonly endpoint: string;

  constructor(private readonly configService: ConfigService) {
    // Configuración de Backblaze B2
    this.bucketName = this.configService.get<string>('BACKBLAZE_BUCKET_NAME', 'psicoespacios-uploads');
    this.region = this.configService.get<string>('BACKBLAZE_REGION', 'us-west-002');
    this.endpoint = this.configService.get<string>('BACKBLAZE_ENDPOINT', 'https://s3.us-west-002.backblazeb2.com');

    // Obtener credenciales
    const accessKeyId = this.configService.get<string>('BACKBLAZE_ACCESS_KEY_ID') || 
                       this.configService.get<string>('BACKBLAZE_ACCOUNT_ID');
    const secretAccessKey = this.configService.get<string>('BACKBLAZE_SECRET_ACCESS_KEY') || 
                           this.configService.get<string>('BACKBLAZE_APPLICATION_KEY');

    if (!accessKeyId || !secretAccessKey) {
      this.logger.warn('Credenciales de Backblaze B2 no configuradas');
      this.logger.warn('Variables requeridas: BACKBLAZE_ACCESS_KEY_ID y BACKBLAZE_SECRET_ACCESS_KEY');
      this.logger.warn('O alternativas: BACKBLAZE_ACCOUNT_ID y BACKBLAZE_APPLICATION_KEY');
    }

    // Crear cliente S3 para Backblaze B2
    this.s3Client = new S3Client({
      region: this.region,
      endpoint: this.endpoint,
      credentials: {
        accessKeyId: accessKeyId || '',
        secretAccessKey: secretAccessKey || '',
      },
      forcePathStyle: true, // Necesario para Backblaze B2
    });

    this.logger.log(`Backblaze B2 configurado - Bucket: ${this.bucketName}, Endpoint: ${this.endpoint}`);
    this.logger.log(`Credenciales configuradas - AccessKey: ${accessKeyId ? '✅ Configurada' : '❌ No configurada'}, SecretKey: ${secretAccessKey ? '✅ Configurada' : '❌ No configurada'}`);
  }

  /**
   * Subir archivo a Backblaze B2
   */
  async uploadFile(
    file: MulterFile,
    folder: string = 'general'
  ): Promise<UploadResult> {
    try {
      // Validar archivo
      if (!file) {
        throw new BadRequestException('No se proporcionó ningún archivo');
      }

      // Generar nombre único para el archivo
      const fileExtension = extname(file.originalname);
      const uniqueFilename = `${uuidv4()}${fileExtension}`;
      const key = `${folder}/${uniqueFilename}`;

      this.logger.log(`Subiendo archivo: ${file.originalname} -> ${key}`);
      this.logger.log(`Configuración actual - Bucket: ${this.bucketName}, Region: ${this.region}, Endpoint: ${this.endpoint}`);

      // Crear comando para subir archivo
      const uploadCommand = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ContentLength: file.size,
        Metadata: {
          originalname: file.originalname,
          uploadedAt: new Date().toISOString(),
        },
      });

      this.logger.log(`Comando de upload creado, enviando a Backblaze...`);
      
      // Subir archivo
      await this.s3Client.send(uploadCommand);

      // Generar URL pública
      const url = this.generatePublicUrl(key);

      const result: UploadResult = {
        url,
        filename: uniqueFilename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        bucket: this.bucketName,
        key,
      };

      this.logger.log(`Archivo subido exitosamente: ${url}`);
      return result;

    } catch (error) {
      this.logger.error(`Error subiendo archivo: ${error.message}`);
      throw new BadRequestException(`Error al subir archivo: ${error.message}`);
    }
  }

  /**
   * Eliminar archivo de Backblaze B2
   */
  async deleteFile(key: string): Promise<void> {
    try {
      this.logger.log(`Eliminando archivo: ${key}`);

      const deleteCommand = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(deleteCommand);
      this.logger.log(`Archivo eliminado exitosamente: ${key}`);

    } catch (error) {
      this.logger.error(`Error eliminando archivo: ${error.message}`);
      throw new BadRequestException(`Error al eliminar archivo: ${error.message}`);
    }
  }

  /**
   * Generar URL firmada temporal para acceso privado
   */
  async generateSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const signedUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn,
      });

      return signedUrl;
    } catch (error) {
      this.logger.error(`Error generando URL firmada: ${error.message}`);
      throw new BadRequestException(`Error al generar URL firmada: ${error.message}`);
    }
  }

  /**
   * Generar URL pública para archivos públicos
   */
  private generatePublicUrl(key: string): string {
    return `${this.endpoint}/${this.bucketName}/${key}`;
  }

  /**
   * Validar tipo de archivo
   */
  validateFileType(file: MulterFile, allowedTypes: string[]): boolean {
    return allowedTypes.includes(file.mimetype);
  }

  /**
   * Validar tamaño de archivo
   */
  validateFileSize(file: MulterFile, maxSize: number): boolean {
    return file.size <= maxSize;
  }

  /**
   * Obtener metadatos de un archivo
   */
  async getFileMetadata(key: string): Promise<FileMetadata | null> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.s3Client.send(command);
      
      if (!response.Metadata) {
        return null;
      }

      return {
        filename: key.split('/').pop() || '',
        originalname: response.Metadata.originalname || '',
        mimetype: response.ContentType || '',
        size: response.ContentLength || 0,
        bucket: this.bucketName,
        key,
        url: this.generatePublicUrl(key),
      };
    } catch (error) {
      this.logger.error(`Error obteniendo metadatos: ${error.message}`);
      return null;
    }
  }

  /**
   * Listar archivos en un folder
   */
  async listFiles(folder: string = '', maxKeys: number = 100): Promise<string[]> {
    try {
      const { ListObjectsV2Command } = await import('@aws-sdk/client-s3');
      
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: folder,
        MaxKeys: maxKeys,
      });

      const response = await this.s3Client.send(command);
      
      return response.Contents?.map(obj => obj.Key || '') || [];
    } catch (error) {
      this.logger.error(`Error listando archivos: ${error.message}`);
      return [];
    }
  }
} 