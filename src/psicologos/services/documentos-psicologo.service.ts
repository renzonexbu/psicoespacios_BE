import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentoPsicologo, Psicologo, TipoDocumento } from '../../common/entities';
import { CreateDocumentoPsicologoDto, UpdateDocumentoPsicologoDto, DocumentoPsicologoResponseDto } from '../dto/documento-psicologo.dto';
import { UploadDocumentoDto } from '../dto/upload-documento.dto';
import { BackblazeService } from '../../uploads/services/backblaze.service';

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

@Injectable()
export class DocumentosPsicologoService {
  constructor(
    @InjectRepository(DocumentoPsicologo)
    private documentoPsicologoRepository: Repository<DocumentoPsicologo>,
    @InjectRepository(Psicologo)
    private psicologoRepository: Repository<Psicologo>,
    private backblazeService: BackblazeService,
  ) {}

  async createDocumento(
    userId: string,
    createDto: CreateDocumentoPsicologoDto,
  ): Promise<DocumentoPsicologoResponseDto> {
    // Buscar el usuario para verificar que existe y es psicólogo
    const user = await this.psicologoRepository.manager.getRepository('users').findOne({
      where: { id: userId, role: 'PSICOLOGO' }
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado o no es psicólogo');
    }

    // Buscar el registro de psicólogo correspondiente
    const psicologo = await this.psicologoRepository.findOne({
      where: { usuario: { id: userId } }
    });

    if (!psicologo) {
      throw new NotFoundException('Registro de psicólogo no encontrado');
    }

    // Crear el documento
    const documento = this.documentoPsicologoRepository.create({
      tipo: createDto.tipo,
      nombre: createDto.nombre,
      urlDocumento: createDto.urlDocumento,
      psicologo: { id: psicologo.id } as any,
    });

    const savedDocumento = await this.documentoPsicologoRepository.save(documento);
    return this.mapToResponseDto(savedDocumento);
  }

  async uploadDocumento(
    userId: string,
    uploadDto: UploadDocumentoDto,
    file?: MulterFile,
  ): Promise<DocumentoPsicologoResponseDto> {
    console.log('🔍 Debug - uploadDocumento llamado con:', {
      userId,
      uploadDto,
      fileInfo: file ? {
        fieldname: file.fieldname,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      } : 'No file'
    });

    console.log('🔍 Debug - Validando DTO:', {
      tipo: uploadDto.tipo,
      nombre: uploadDto.nombre,
      urlDocumento: uploadDto.urlDocumento,
      tipoType: typeof uploadDto.tipo,
      nombreType: typeof uploadDto.nombre,
      urlType: typeof uploadDto.urlDocumento
    });

    // Validar que el DTO tenga los campos requeridos
    if (!uploadDto.tipo || !uploadDto.nombre || !uploadDto.urlDocumento) {
      console.log('❌ DTO inválido:', uploadDto);
      throw new BadRequestException('Los campos tipo, nombre y urlDocumento son requeridos');
    }

    // Buscar el usuario para verificar que existe y es psicólogo
    const user = await this.psicologoRepository.manager.getRepository('users').findOne({
      where: { id: userId, role: 'PSICOLOGO' }
    });

    if (!user) {
      console.log('❌ Usuario no encontrado o no es psicólogo:', userId);
      throw new NotFoundException('Usuario no encontrado o no es psicólogo');
    }

    // Buscar el registro de psicólogo correspondiente
    const psicologo = await this.psicologoRepository.findOne({
      where: { usuario: { id: userId } }
    });

    if (!psicologo) {
      console.log('❌ Registro de psicólogo no encontrado para usuario:', userId);
      throw new NotFoundException('Registro de psicólogo no encontrado');
    }

    console.log('✅ Psicólogo encontrado:', psicologo.id);

    try {
      console.log('🚀 Creando documento con URL del frontend...');
      
      // Crear el documento con la URL que envía el frontend
      const documento = this.documentoPsicologoRepository.create({
        tipo: uploadDto.tipo,
        nombre: uploadDto.nombre,
        psicologo: { id: psicologo.id } as any,
        urlDocumento: uploadDto.urlDocumento, // La URL viene del frontend
      });

      console.log('🔍 Documento a crear:', documento);

      const savedDocumento = await this.documentoPsicologoRepository.save(documento);
      console.log('✅ Documento guardado en BD:', savedDocumento.id);
      
      return this.mapToResponseDto(savedDocumento);

    } catch (error) {
      console.error('❌ Error en uploadDocumento:', error);
      console.error('❌ Stack trace:', error.stack);
      throw new BadRequestException(`Error al crear el documento: ${error.message}`);
    }
  }

  async updateDocumento(
    id: string,
    updateDto: UpdateDocumentoPsicologoDto,
  ): Promise<DocumentoPsicologoResponseDto> {
    const documento = await this.documentoPsicologoRepository.findOne({
      where: { id },
    });

    if (!documento) {
      throw new NotFoundException('Documento no encontrado');
    }

    await this.documentoPsicologoRepository.update(id, updateDto);

    const updatedDocumento = await this.documentoPsicologoRepository.findOne({
      where: { id },
    });

    if (!updatedDocumento) {
      throw new NotFoundException('Documento no encontrado después de la actualización');
    }

    return this.mapToResponseDto(updatedDocumento);
  }

  async updateDocumentoUrl(
    id: string,
    urlDocumento: string,
  ): Promise<DocumentoPsicologoResponseDto> {
    const documento = await this.documentoPsicologoRepository.findOne({
      where: { id },
    });

    if (!documento) {
      throw new NotFoundException('Documento no encontrado');
    }

    await this.documentoPsicologoRepository.update(id, { urlDocumento });

    const updatedDocumento = await this.documentoPsicologoRepository.findOne({
      where: { id },
    });

    if (!updatedDocumento) {
      throw new NotFoundException('Documento no encontrado después de la actualización');
    }

    return this.mapToResponseDto(updatedDocumento);
  }

  async deleteDocumento(id: string): Promise<void> {
    const documento = await this.documentoPsicologoRepository.findOne({
      where: { id },
    });

    if (!documento) {
      throw new NotFoundException('Documento no encontrado');
    }

    // Eliminar archivo de Backblaze si existe
    if (documento.urlDocumento) {
      try {
        const key = this.extractKeyFromUrl(documento.urlDocumento);
        if (key) {
          await this.backblazeService.deleteFile(key);
        }
      } catch (error) {
        // Log del error pero no fallar la eliminación del documento
        console.error(`Error eliminando archivo de Backblaze: ${error.message}`);
      }
    }

    await this.documentoPsicologoRepository.remove(documento);
  }

  async findAllByPsicologo(
    userId: string,
  ): Promise<DocumentoPsicologoResponseDto[]> {
    // Buscar el registro de psicólogo correspondiente al usuario
    const psicologo = await this.psicologoRepository.findOne({
      where: { usuario: { id: userId } }
    });

    if (!psicologo) {
      throw new NotFoundException('Registro de psicólogo no encontrado');
    }

    const documentos = await this.documentoPsicologoRepository.find({
      where: { psicologo: { id: psicologo.id } },
      order: { createdAt: 'DESC' },
    });

    return documentos.map(doc => this.mapToResponseDto(doc));
  }

  async findById(id: string): Promise<DocumentoPsicologoResponseDto> {
    const documento = await this.documentoPsicologoRepository.findOne({
      where: { id },
      relations: ['psicologo'],
    });

    if (!documento) {
      throw new NotFoundException('Documento no encontrado');
    }

    return this.mapToResponseDto(documento);
  }

  private mapToResponseDto(documento: DocumentoPsicologo): DocumentoPsicologoResponseDto {
    return {
      id: documento.id,
      tipo: documento.tipo,
      nombre: documento.nombre,
      urlDocumento: documento.urlDocumento,
      createdAt: documento.createdAt,
      updatedAt: documento.updatedAt,
      psicologo: documento.psicologo ? {
        id: documento.psicologo.id
      } : undefined,
    };
  }

  private extractKeyFromUrl(url: string): string | null {
    try {
      // Extraer la clave del archivo desde la URL de Backblaze
      const urlParts = url.split('/');
      const bucketIndex = urlParts.findIndex(part => part.includes('backblazeb2.com'));
      if (bucketIndex !== -1 && bucketIndex + 2 < urlParts.length) {
        return urlParts.slice(bucketIndex + 2).join('/');
      }
      return null;
    } catch (error) {
      return null;
    }
  }
} 