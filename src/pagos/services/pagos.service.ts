import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pago, TipoPago, EstadoPago, MetodoPago, DatosTransaccion } from '../../common/entities/pago.entity';
import { User } from '../../common/entities/user.entity';
import { Suscripcion } from '../../common/entities/suscripcion.entity';
import { SolicitudDerivacion } from '../../common/entities/solicitud-derivacion.entity';
import { CreatePagoDto, UpdatePagoDto } from '../dto/pago.dto';

@Injectable()
export class PagosService {
  constructor(
    @InjectRepository(Pago)
    private pagoRepository: Repository<Pago>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Suscripcion)
    private suscripcionRepository: Repository<Suscripcion>,
    @InjectRepository(SolicitudDerivacion)
    private solicitudDerivacionRepository: Repository<SolicitudDerivacion>,
  ) {}

  async createPagoSuscripcion(createPagoDto: CreatePagoDto, userId: string) {
    const usuario = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const suscripcion = await this.suscripcionRepository.findOne({
      where: { id: createPagoDto.suscripcionId },
    });

    if (!suscripcion) {
      throw new NotFoundException('Suscripción no encontrada');
    }

    const metodoPago = Object.values(MetodoPago).find(
      m => m === createPagoDto.datosTransaccion.metodoPago
    );

    if (!metodoPago) {
      throw new BadRequestException('Método de pago no válido');
    }

    const pago = new Pago();
    pago.usuario = usuario;
    pago.suscripcion = suscripcion;
    pago.tipo = TipoPago.SUSCRIPCION;
    pago.monto = createPagoDto.monto;
    pago.datosTransaccion = {
      metodoPago,
      referencia: createPagoDto.datosTransaccion.referencia,
      datosTarjeta: createPagoDto.datosTransaccion.datosTarjeta,
      datosTransferencia: createPagoDto.datosTransaccion.datosTransferencia,
      fechaTransaccion: new Date()
    } as DatosTransaccion;
    pago.estado = EstadoPago.PENDIENTE;

    return await this.pagoRepository.save(pago);
  }

  async createPagoDerivacion(createPagoDto: CreatePagoDto, userId: string) {
    const usuario = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const solicitudDerivacion = await this.solicitudDerivacionRepository.findOne({
      where: { id: createPagoDto.solicitudDerivacionId },
    });

    if (!solicitudDerivacion) {
      throw new NotFoundException('Solicitud de derivación no encontrada');
    }

    const metodoPago = Object.values(MetodoPago).find(
      m => m === createPagoDto.datosTransaccion.metodoPago
    );

    if (!metodoPago) {
      throw new BadRequestException('Método de pago no válido');
    }

    const pago = new Pago();
    pago.usuario = usuario;
    pago.solicitudDerivacion = solicitudDerivacion;
    pago.tipo = TipoPago.DERIVACION;
    pago.monto = createPagoDto.monto;
    pago.datosTransaccion = {
      metodoPago,
      referencia: createPagoDto.datosTransaccion.referencia,
      datosTarjeta: createPagoDto.datosTransaccion.datosTarjeta,
      datosTransferencia: createPagoDto.datosTransaccion.datosTransferencia,
      fechaTransaccion: new Date()
    } as DatosTransaccion;
    pago.estado = EstadoPago.PENDIENTE;

    return await this.pagoRepository.save(pago);
  }

  async update(id: string, updatePagoDto: UpdatePagoDto) {
    const pago = await this.pagoRepository.findOne({
      where: { id },
    });

    if (!pago) {
      throw new NotFoundException('Pago no encontrado');
    }

    if (updatePagoDto.estado) {
      const estadoPago = updatePagoDto.estado as EstadoPago;
      if (!Object.values(EstadoPago).includes(estadoPago)) {
        throw new BadRequestException('Estado de pago inválido');
      }
      pago.estado = estadoPago;
    }

    return await this.pagoRepository.save(pago);
  }

  async reembolsar(id: string, motivo: string) {
    const pago = await this.pagoRepository.findOne({
      where: { id },
    });

    if (!pago) {
      throw new NotFoundException('Pago no encontrado');
    }

    if (pago.estado !== EstadoPago.COMPLETADO) {
      throw new BadRequestException('Solo se pueden reembolsar pagos completados');
    }

    pago.estado = EstadoPago.REEMBOLSADO;
    pago.notasReembolso = motivo;
    pago.fechaReembolso = new Date();

    return await this.pagoRepository.save(pago);
  }

  async findAll(userId: string) {
    return this.pagoRepository.find({
      where: { usuario: { id: userId } },
      relations: ['usuario', 'suscripcion', 'solicitudDerivacion'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string) {
    const pago = await this.pagoRepository.findOne({
      where: { 
        id,
        usuario: { id: userId }
      },
      relations: ['usuario', 'suscripcion', 'solicitudDerivacion'],
    });

    if (!pago) {
      throw new NotFoundException('Pago no encontrado');
    }

    return pago;
  }
}