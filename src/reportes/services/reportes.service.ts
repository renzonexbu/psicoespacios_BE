import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reporte, TipoReporte, FormatoReporte, EstadoReporte } from '../../common/entities/reporte.entity';
import { User } from '../../common/entities/user.entity';
import { CreateReporteDto } from '../dto/reporte.dto';

@Injectable()
export class ReportesService {
  constructor(
    @InjectRepository(Reporte)
    private reporteRepository: Repository<Reporte>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findAll(userId: string) {
    return this.reporteRepository.find({
      where: { usuario: { id: userId } },
      relations: ['usuario'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string) {
    const reporte = await this.reporteRepository.findOne({
      where: { 
        id,
        usuario: { id: userId }
      },
      relations: ['usuario'],
    });

    if (!reporte) {
      throw new NotFoundException('Reporte no encontrado');
    }

    return reporte;
  }

  async create(createReporteDto: CreateReporteDto, userId: string): Promise<Reporte> {
    const usuario = await this.userRepository.findOne({
      where: { id: userId }
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (!Object.values(TipoReporte).includes(createReporteDto.tipo)) {
      throw new BadRequestException('Tipo de reporte no válido');
    }

    // Generar el contenido del reporte
    const resultados = await this.generarContenidoReporte(
      createReporteDto.tipo,
      createReporteDto.parametros
    );

    const reporte = new Reporte();
    reporte.usuario = usuario;
    reporte.tipo = createReporteDto.tipo;
    reporte.parametros = createReporteDto.parametros;
    reporte.resultados = resultados;
    reporte.formatoExportacion = createReporteDto.formato;
    reporte.estado = EstadoReporte.PENDIENTE;
    
    return await this.reporteRepository.save(reporte);
  }

  private async generarContenidoReporte(tipo: TipoReporte, parametros: any): Promise<any> {
    switch (tipo) {
      case TipoReporte.SESIONES:
        return this.generarReporteSesiones(parametros);
      case TipoReporte.PACIENTES:
        return this.generarReportePacientes(parametros);
      case TipoReporte.PAGOS:
        return this.generarReportePagos(parametros);
      case TipoReporte.DERIVACIONES:
        return this.generarReporteDerivaciones(parametros);
      default:
        throw new BadRequestException('Tipo de reporte no implementado');
    }
  }

  private async generarReporteSesiones(parametros: any) {
    // Implementación específica para reporte de sesiones
    return {};
  }

  private async generarReportePacientes(parametros: any) {
    // Implementación específica para reporte de pacientes
    return {};
  }

  private async generarReportePagos(parametros: any) {
    // Implementación específica para reporte de pagos
    return {};
  }

  private async generarReporteDerivaciones(parametros: any) {
    // Implementación específica para reporte de derivaciones
    return {};
  }
}