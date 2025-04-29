import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SolicitudDerivacion, EstadoSolicitudDerivacion } from '../../common/entities/solicitud-derivacion.entity';
import { CreateSolicitudDerivacionDto, UpdateSolicitudDerivacionDto, PagoSesionDto } from '../dto/solicitud-derivacion.dto';
import { User } from '../../common/entities/user.entity';
import { Paciente } from '../../common/entities/paciente.entity';
import { PerfilDerivacion } from '../../common/entities/perfil-derivacion.entity';

@Injectable()
export class SolicitudesDerivacionService {
  constructor(
    @InjectRepository(SolicitudDerivacion)
    private solicitudRepository: Repository<SolicitudDerivacion>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Paciente)
    private pacienteRepository: Repository<Paciente>,
    @InjectRepository(PerfilDerivacion)
    private perfilDerivacionRepository: Repository<PerfilDerivacion>,
  ) {}

  async create(createDto: CreateSolicitudDerivacionDto, userId: string) {
    const psicologoOrigen = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!psicologoOrigen) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const paciente = await this.pacienteRepository.findOne({
      where: { id: createDto.pacienteId },
    });

    if (!paciente) {
      throw new NotFoundException('Paciente no encontrado');
    }

    const perfilDestino = await this.perfilDerivacionRepository.findOne({
      where: { id: createDto.psicologoDestinoId },
    });

    if (!perfilDestino) {
      throw new NotFoundException('Perfil de derivación no encontrado');
    }

    const solicitud = new SolicitudDerivacion();
    solicitud.psicologoOrigen = psicologoOrigen;
    solicitud.paciente = paciente;
    solicitud.psicologoDestino = perfilDestino;
    solicitud.motivoDerivacion = createDto.motivoDerivacion;
    solicitud.notasAdicionales = createDto.notasAdicionales ?? '';
    solicitud.estado = EstadoSolicitudDerivacion.PENDIENTE;

    return await this.solicitudRepository.save(solicitud);
  }

  async findOne(id: string) {
    const solicitud = await this.solicitudRepository.findOne({
      where: { id },
      relations: ['psicologoOrigen', 'psicologoDestino', 'paciente'],
    });

    if (!solicitud) {
      throw new NotFoundException('Solicitud de derivación no encontrada');
    }

    return solicitud;
  }

  async findAll(userId: string, psicologoOrigen: boolean = true) {
    return this.solicitudRepository.find({
      where: psicologoOrigen
        ? { psicologoOrigen: { id: userId } }
        : { psicologoDestino: { psicologo: { id: userId } } },
      relations: ['psicologoOrigen', 'psicologoDestino', 'paciente'],
    });
  }

  async findEnviadas(userId: string) {
    return this.findAll(userId, true);
  }

  async findRecibidas(userId: string) {
    return this.findAll(userId, false);
  }

  async aceptar(id: string, userId: string) {
    const solicitud = await this.findOne(id);

    if (solicitud.psicologoDestino.psicologo.id !== userId) {
      throw new BadRequestException('No tienes permiso para aceptar esta solicitud');
    }

    if (solicitud.estado !== EstadoSolicitudDerivacion.PENDIENTE) {
      throw new BadRequestException('La solicitud no está en estado pendiente');
    }

    solicitud.estado = EstadoSolicitudDerivacion.ACEPTADA;
    return await this.solicitudRepository.save(solicitud);
  }

  async rechazar(id: string, userId: string, motivo: string) {
    const solicitud = await this.findOne(id);

    if (solicitud.psicologoDestino.psicologo.id !== userId) {
      throw new BadRequestException('No tienes permiso para rechazar esta solicitud');
    }

    if (solicitud.estado !== EstadoSolicitudDerivacion.PENDIENTE) {
      throw new BadRequestException('La solicitud no está en estado pendiente');
    }

    solicitud.estado = EstadoSolicitudDerivacion.RECHAZADA;
    solicitud.motivoRechazo = motivo;
    return await this.solicitudRepository.save(solicitud);
  }

  async procesarPago(id: string, pagoDto: PagoSesionDto, userId: string) {
    const solicitud = await this.findOne(id);

    if (solicitud.psicologoDestino.psicologo.id !== userId) {
      throw new BadRequestException('No tienes permiso para procesar el pago de esta solicitud');
    }

    if (solicitud.estado !== EstadoSolicitudDerivacion.ACEPTADA) {
      throw new BadRequestException('La solicitud debe estar aceptada para procesar el pago');
    }

    solicitud.estado = EstadoSolicitudDerivacion.PAGADA;
    solicitud.montoPrimeraSesion = pagoDto.monto;
    solicitud.datosPago = pagoDto.datosPago;

    return await this.solicitudRepository.save(solicitud);
  }
}