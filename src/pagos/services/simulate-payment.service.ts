import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../common/entities/user.entity';
import { Pago, TipoPago, EstadoPago, MetodoPago } from '../../common/entities/pago.entity';
import { Reserva, EstadoReserva } from '../../common/entities/reserva.entity';
import { Psicologo } from '../../common/entities/psicologo.entity';
import { Box } from '../../common/entities/box.entity';
import { SimulatePaymentDto } from '../dto/simulate-payment.dto';

@Injectable()
export class SimulatePaymentService {
  private readonly logger = new Logger(SimulatePaymentService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Pago)
    private readonly pagoRepository: Repository<Pago>,
    @InjectRepository(Reserva)
    private readonly reservaRepository: Repository<Reserva>,
    @InjectRepository(Psicologo)
    private readonly psicologoRepository: Repository<Psicologo>,
    @InjectRepository(Box)
    private readonly boxRepository: Repository<Box>,
  ) {}

  async simulatePayment(simulateDto: SimulatePaymentDto) {
    this.logger.log(`Simulando pago para usuario: ${simulateDto.userId}`);

    try {
      // 1. Verificar que el usuario existe
      const user = await this.userRepository.findOne({ where: { id: simulateDto.userId } });
      if (!user) {
        throw new BadRequestException('Usuario no encontrado');
      }

      // 2. Verificar psicólogo si se proporciona
      let psicologo: Psicologo | null = null;
      let psicologoUser: User | null = null;
      if (simulateDto.psicologoId) {
        psicologo = await this.psicologoRepository.findOne({ 
          where: { id: simulateDto.psicologoId },
          relations: ['usuario']
        });
        if (!psicologo) {
          throw new BadRequestException('Psicólogo no encontrado');
        }
        psicologoUser = psicologo.usuario;
      }

      // 3. Crear pago simulado
      const pago = new Pago();
      pago.usuario = user;
      pago.tipo = simulateDto.tipo;
      pago.monto = simulateDto.amount;
      
      // Determinar estado basado en simulateStatus
      const status = simulateDto.simulateStatus || 'success';
      switch (status) {
        case 'success':
          pago.estado = EstadoPago.COMPLETADO;
          pago.fechaCompletado = new Date();
          break;
        case 'failed':
          pago.estado = EstadoPago.FALLIDO;
          break;
        case 'pending':
          pago.estado = EstadoPago.PENDIENTE;
          break;
        case 'cancelled':
          pago.estado = EstadoPago.FALLIDO;
          break;
        default:
          pago.estado = EstadoPago.COMPLETADO;
          pago.fechaCompletado = new Date();
      }

      pago.datosTransaccion = {
        metodoPago: MetodoPago.TARJETA,
        referencia: `SIM-${Date.now()}`,
        fechaTransaccion: new Date()
      };

      pago.metadatos = {
        simulated: true,
        originalOrderId: simulateDto.orderId,
        subject: simulateDto.subject,
        simulateStatus: status,
        timestamp: new Date().toISOString()
      };

      // Guardar pago
      const savedPago = await this.pagoRepository.save(pago);
      this.logger.log(`Pago simulado creado con ID: ${savedPago.id}`);

      // 4. Crear reserva si el pago fue exitoso y se proporcionan datos de reserva
      let reserva: Reserva | null = null;
      if (status === 'success' && psicologoUser && simulateDto.fechaReserva && simulateDto.horaReserva) {
        reserva = await this.createReserva(simulateDto, psicologoUser, savedPago);
      }

      // 5. Preparar respuesta
      const response = {
        success: true,
        pago: {
          id: savedPago.id,
          estado: savedPago.estado,
          monto: savedPago.monto,
          tipo: savedPago.tipo,
          fechaCreacion: savedPago.createdAt,
          fechaCompletado: savedPago.fechaCompletado,
          datosTransaccion: savedPago.datosTransaccion,
          metadatos: savedPago.metadatos
        },
        usuario: {
          id: user.id,
          email: user.email,
          nombre: `${user.nombre} ${user.apellido}`
        },
        reserva: reserva ? {
          id: reserva.id,
          fecha: reserva.fecha,
          horaInicio: reserva.horaInicio,
          horaFin: reserva.horaFin,
          estado: reserva.estado,
          precio: reserva.precio
        } : null,
        mensaje: this.getStatusMessage(status)
      };

      this.logger.log(`Simulación completada exitosamente. Estado: ${status}`);
      return response;

    } catch (error) {
      this.logger.error(`Error en simulación de pago: ${error.message}`);
      throw error;
    }
  }

  private async createReserva(simulateDto: SimulatePaymentDto, psicologoUser: User, pago: Pago) {
    try {
      // Validar que tenemos los datos necesarios
      if (!simulateDto.fechaReserva || !simulateDto.horaReserva) {
        this.logger.warn('Datos de reserva incompletos, no se creará reserva');
        return null;
      }

      // Crear fecha y hora de la reserva
      const fechaReserva = new Date(simulateDto.fechaReserva);
      const [hora, minuto] = simulateDto.horaReserva.split(':').map(Number);
      fechaReserva.setHours(hora, minuto, 0, 0);

      // Calcular hora de fin (1 hora después)
      const horaFin = new Date(fechaReserva);
      horaFin.setHours(horaFin.getHours() + 1);

      // Buscar un box disponible para la reserva
      const availableBox = await this.boxRepository.findOne({
        where: { estado: 'DISPONIBLE' },
        order: { createdAt: 'ASC' }
      });

      if (!availableBox) {
        this.logger.warn('No hay boxes disponibles, no se creará reserva');
        return null;
      }

      const reserva = new Reserva();
      reserva.boxId = availableBox.id;
      reserva.psicologoId = psicologoUser.id;
      reserva.fecha = fechaReserva;
      reserva.horaInicio = simulateDto.horaReserva;
      reserva.horaFin = horaFin.toTimeString().slice(0, 5);
      reserva.estado = EstadoReserva.CONFIRMADA;
      reserva.precio = simulateDto.amount;

      const savedReserva = await this.reservaRepository.save(reserva);
      this.logger.log(`Reserva creada automáticamente con ID: ${savedReserva.id}`);

      return savedReserva;

    } catch (error) {
      this.logger.error(`Error creando reserva automática: ${error.message}`);
      // No lanzar error para no fallar toda la simulación
      return null;
    }
  }

  private getStatusMessage(status: string): string {
    switch (status) {
      case 'success':
        return 'Pago simulado exitosamente. Reserva creada automáticamente.';
      case 'failed':
        return 'Pago simulado falló. No se creó reserva.';
      case 'pending':
        return 'Pago simulado en estado pendiente.';
      case 'cancelled':
        return 'Pago simulado cancelado.';
      default:
        return 'Simulación completada.';
    }
  }

  // Método para obtener estadísticas de simulaciones
  async getSimulationStats() {
    const totalSimulaciones = await this.pagoRepository.count({
      where: { metadatos: { simulated: true } }
    });

    const simulacionesExitosas = await this.pagoRepository.count({
      where: { 
        metadatos: { simulated: true },
        estado: EstadoPago.COMPLETADO
      }
    });

    const simulacionesFallidas = await this.pagoRepository.count({
      where: { 
        metadatos: { simulated: true },
        estado: EstadoPago.FALLIDO
      }
    });

    return {
      totalSimulaciones,
      simulacionesExitosas,
      simulacionesFallidas,
      tasaExito: totalSimulaciones > 0 ? (simulacionesExitosas / totalSimulaciones * 100).toFixed(2) + '%' : '0%'
    };
  }
} 