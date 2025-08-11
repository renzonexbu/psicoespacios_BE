import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { DocumentosPsicologoService } from '../services/documentos-psicologo.service';
import {
  CreateDocumentoPsicologoDto,
  UpdateDocumentoPsicologoDto,
  DocumentoPsicologoResponseDto,
} from '../dto/documento-psicologo.dto';
import { UploadDocumentoDto } from '../dto/upload-documento.dto';

@Controller('psicologos/:psicologoId/documentos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentosPsicologoController {
  constructor(
    private readonly documentosPsicologoService: DocumentosPsicologoService,
  ) {}

  @Post()
  @Roles(Role.PSICOLOGO, Role.ADMIN)
  async createDocumento(
    @Param('psicologoId') psicologoId: string,
    @Body() createDto: any, // Cambiamos a any para evitar problemas de validación
    @Request() req,
  ): Promise<DocumentoPsicologoResponseDto> {
    // Validación manual del DTO
    console.log('🔍 Debug - DTO recibido:', createDto);
    
    if (!createDto.tipo || !createDto.nombre) {
      throw new BadRequestException('Los campos tipo y nombre son requeridos');
    }
    
    // Validar que el tipo sea válido
    const tiposValidos = ['titulo', 'certificado', 'diploma', 'licencia', 'experiencia', 'otro'];
    if (!tiposValidos.includes(createDto.tipo)) {
      throw new BadRequestException(`El tipo debe ser uno de: ${tiposValidos.join(', ')}`);
    }
    
    // Verificar que el usuario solo puede crear documentos para sí mismo (a menos que sea admin)
    if (req.user.role !== Role.ADMIN && req.user.id !== psicologoId) {
      throw new ForbiddenException('No tienes permisos para crear documentos para otro psicólogo');
    }

    return this.documentosPsicologoService.createDocumento(psicologoId, createDto);
  }

  @Post('upload')
  @Roles(Role.PSICOLOGO, Role.ADMIN)
  async uploadDocumento(
    @Param('psicologoId') psicologoId: string,
    @Body() uploadDto: UploadDocumentoDto,
    @Request() req,
  ): Promise<DocumentoPsicologoResponseDto> {
    // Validación manual del DTO
    console.log('🔍 Debug - DTO recibido:', uploadDto);
    
    if (!uploadDto.tipo || !uploadDto.nombre || !uploadDto.urlDocumento) {
      throw new BadRequestException('Los campos tipo, nombre y urlDocumento son requeridos');
    }
    
    // Validar que el tipo sea válido
    const tiposValidos = ['titulo', 'certificado', 'diploma', 'licencia', 'experiencia', 'otro'];
    if (!tiposValidos.includes(uploadDto.tipo)) {
      throw new BadRequestException(`El tipo debe ser uno de: ${tiposValidos.join(', ')}`);
    }
    
    // Verificar que el usuario solo puede subir documentos para sí mismo (a menos que sea admin)
    if (req.user.role !== Role.ADMIN && req.user.id !== psicologoId) {
      throw new ForbiddenException('No tienes permisos para subir documentos para otro psicólogo');
    }

    return this.documentosPsicologoService.uploadDocumento(psicologoId, uploadDto);
  }

  @Get()
  @Roles(Role.PSICOLOGO, Role.ADMIN)
  async findAllByPsicologo(
    @Param('psicologoId') psicologoId: string,
    @Request() req,
  ): Promise<DocumentoPsicologoResponseDto[]> {
    // Verificar permisos
    if (req.user.role !== Role.ADMIN && req.user.id !== psicologoId) {
      throw new ForbiddenException('No tienes permisos para ver documentos de otro psicólogo');
    }

    return this.documentosPsicologoService.findAllByPsicologo(psicologoId);
  }

  @Get(':id')
  @Roles(Role.PSICOLOGO, Role.ADMIN)
  async findById(
    @Param('id') id: string,
    @Request() req,
  ): Promise<DocumentoPsicologoResponseDto> {
    const documento = await this.documentosPsicologoService.findById(id);
    
    // Verificar permisos - necesitamos obtener el psicólogo del documento
    const psicologoId = await this.getPsicologoIdFromDocumento(id);
    if (req.user.role !== Role.ADMIN && req.user.id !== psicologoId) {
      throw new ForbiddenException('No tienes permisos para ver este documento');
    }

    return documento;
  }

  @Put(':id')
  @Roles(Role.PSICOLOGO, Role.ADMIN)
  async updateDocumento(
    @Param('id') id: string,
    @Body() updateDto: UpdateDocumentoPsicologoDto,
    @Request() req,
  ): Promise<DocumentoPsicologoResponseDto> {
    // Verificar permisos - necesitamos obtener el psicólogo del documento
    const psicologoId = await this.getPsicologoIdFromDocumento(id);
    if (req.user.role !== Role.ADMIN && req.user.id !== psicologoId) {
      throw new ForbiddenException('No tienes permisos para actualizar este documento');
    }

    return this.documentosPsicologoService.updateDocumento(id, updateDto);
  }

  @Put(':id/url')
  @Roles(Role.PSICOLOGO, Role.ADMIN)
  async updateDocumentoUrl(
    @Param('id') id: string,
    @Body() body: { urlDocumento: string },
    @Request() req,
  ): Promise<DocumentoPsicologoResponseDto> {
    // Verificar permisos - necesitamos obtener el psicólogo del documento
    const psicologoId = await this.getPsicologoIdFromDocumento(id);
    if (req.user.role !== Role.ADMIN && req.user.id !== psicologoId) {
      throw new ForbiddenException('No tienes permisos para actualizar este documento');
    }

    if (!body.urlDocumento) {
      throw new BadRequestException('La URL del documento es requerida');
    }

    return this.documentosPsicologoService.updateDocumentoUrl(id, body.urlDocumento);
  }

  @Delete(':id')
  @Roles(Role.PSICOLOGO, Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDocumento(
    @Param('id') id: string,
    @Request() req,
  ): Promise<void> {
    // Verificar permisos - necesitamos obtener el psicólogo del documento
    const psicologoId = await this.getPsicologoIdFromDocumento(id);
    if (req.user.id !== psicologoId) {
      throw new ForbiddenException('No tienes permisos para eliminar este documento');
    }

    await this.documentosPsicologoService.deleteDocumento(id);
  }

  private async getPsicologoIdFromDocumento(documentoId: string): Promise<string> {
    try {
      const documento = await this.documentosPsicologoService.findById(documentoId);
      // Extraer el ID del psicólogo del documento
      if (documento && documento.psicologo && documento.psicologo.id) {
        // Necesitamos obtener el ID del usuario desde la tabla psicologo
        const psicologo = await this.documentosPsicologoService['psicologoRepository'].findOne({
          where: { id: documento.psicologo.id },
          relations: ['usuario']
        });
        
        if (psicologo && psicologo.usuario) {
          return psicologo.usuario.id; // Retornar el ID del usuario
        }
      }
      
      throw new BadRequestException('No se pudo obtener el ID del usuario del documento');
    } catch (error) {
      throw new BadRequestException('No se pudo obtener el ID del usuario del documento');
    }
  }
} 