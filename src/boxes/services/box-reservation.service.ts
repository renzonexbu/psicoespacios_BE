import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reserva, EstadoReserva, EstadoPagoReserva } from '../../common/entities/reserva.entity';
import { Box } from '../../common/entities/box.entity';
import { User } from '../../common/entities/user.entity';
import { CreateBoxReservationDto, UpdateBoxReservationDto, UpdateBoxReservationPaymentDto, BoxReservationResponseDto } from '../dto/box-reservation.dto';

@Injectable()
export class BoxReservationService {
  constructor(
    @InjectRepository(Reserva)
    private reservaRepository: Repository<Reserva>,
    @InjectRepository(Box)
    private boxRepository: Repository<Box>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  private validateTimeFormat(time: string): boolean {
    const timeRegex = /^([01]?[0-9]|2[0-3]):00$/;
    return timeRegex.test(time);
  }

  private validateTimeRange(horaInicio: string, horaFin: string): boolean {
    const startHour = parseInt(horaInicio.split(':')[0]);
    const endHour = parseInt(horaFin.split(':')[0]);
    return endHour > startHour;
  }

  private async checkBoxAvailability(boxId: string, fecha: string, horaInicio: string, horaFin: string, excludeReservationId?: string): Promise<boolean> {
    const [year, month, day] = fecha.split('-').map(Number);
    const fechaReserva = new Date(year, month - 1, day); // month - 1 porque los meses van de 0-11
    
    const existingReservations = await this.reservaRepository.find({
      where: {
        boxId,
        fecha: fechaReserva,
        estado: EstadoReserva.CONFIRMADA
      }
    });

    // Filtrar la reserva actual si estamos actualizando
    const conflictingReservations = existingReservations.filter(reservation => {
      if (excludeReservationId && reservation.id === excludeReservationId) {
        return false;
      }

      const reservationStart = parseInt(reservation.horaInicio.split(':')[0]);
      const reservationEnd = parseInt(reservation.horaFin.split(':')[0]);
      const newStart = parseInt(horaInicio.split(':')[0]);
      const newEnd = parseInt(horaFin.split(':')[0]);

      // Verificar si hay solapamiento
      return (newStart < reservationEnd && newEnd > reservationStart);
    });

    return conflictingReservations.length === 0;
  }

  async createReservation(dto: CreateBoxReservationDto): Promise<BoxReservationResponseDto> {
    // Validar formato de horas
    if (!this.validateTimeFormat(dto.horaInicio) || !this.validateTimeFormat(dto.horaFin)) {
      throw new BadRequestException('Formato de hora inválido. Debe ser "HH:00"');
    }

    // Validar rango de horas
    if (!this.validateTimeRange(dto.horaInicio, dto.horaFin)) {
      throw new BadRequestException('La hora de fin debe ser posterior a la hora de inicio');
    }

    // Validar que el box existe
    const box = await this.boxRepository.findOne({ where: { id: dto.boxId } });
    if (!box) {
      throw new NotFoundException('Box no encontrado');
    }

    // Validar que el psicólogo existe
    const psicologo = await this.userRepository.findOne({ where: { id: dto.psicologoId } });
    if (!psicologo) {
      throw new NotFoundException('Psicólogo no encontrado');
    }

    // Verificar disponibilidad del box
    const isAvailable = await this.checkBoxAvailability(dto.boxId, dto.fecha, dto.horaInicio, dto.horaFin);
    if (!isAvailable) {
      throw new ConflictException('El box no está disponible en el horario solicitado');
    }

    // Crear la reserva con fecha correcta
    const [year, month, day] = dto.fecha.split('-').map(Number);
    const fechaReserva = new Date(year, month - 1, day); // month - 1 porque los meses van de 0-11
    
    const reserva = this.reservaRepository.create({
      boxId: dto.boxId,
      psicologoId: dto.psicologoId,
      fecha: fechaReserva,
      horaInicio: dto.horaInicio,
      horaFin: dto.horaFin,
      precio: dto.precio,
      estado: EstadoReserva.CONFIRMADA
    });

    const savedReserva = await this.reservaRepository.save(reserva);
    return this.mapToResponseDto(savedReserva);
  }

  async updateReservationStatus(id: string, dto: UpdateBoxReservationDto): Promise<BoxReservationResponseDto> {
    const reserva = await this.reservaRepository.findOne({ where: { id } });
    if (!reserva) {
      throw new NotFoundException('Reserva no encontrada');
    }

    reserva.estado = dto.estado;
    const updatedReserva = await this.reservaRepository.save(reserva);
    return this.mapToResponseDto(updatedReserva);
  }

  async updateReservationPaymentStatus(id: string, dto: UpdateBoxReservationPaymentDto): Promise<BoxReservationResponseDto> {
    const reserva = await this.reservaRepository.findOne({ where: { id } });
    if (!reserva) {
      throw new NotFoundException('Reserva no encontrada');
    }

    reserva.estadoPago = dto.estadoPago;
    const updatedReserva = await this.reservaRepository.save(reserva);
    return this.mapToResponseDto(updatedReserva);
  }

  async getReservation(id: string): Promise<BoxReservationResponseDto> {
    const reserva = await this.reservaRepository.findOne({ where: { id } });
    if (!reserva) {
      throw new NotFoundException('Reserva no encontrada');
    }

    return this.mapToResponseDto(reserva);
  }

  async getReservationsByPsicologo(psicologoId: string): Promise<BoxReservationResponseDto[]> {
    const reservas = await this.reservaRepository.find({
      where: { psicologoId },
      order: { fecha: 'ASC', horaInicio: 'ASC' }
    });

    return reservas.map(reserva => this.mapToResponseDto(reserva));
  }

  async getReservationsByBox(boxId: string): Promise<BoxReservationResponseDto[]> {
    const reservas = await this.reservaRepository.find({
      where: { boxId },
      order: { fecha: 'ASC', horaInicio: 'ASC' }
    });

    return reservas.map(reserva => this.mapToResponseDto(reserva));
  }

  async cancelReservation(id: string): Promise<BoxReservationResponseDto> {
    const reserva = await this.reservaRepository.findOne({ where: { id } });
    if (!reserva) {
      throw new NotFoundException('Reserva no encontrada');
    }

    if (reserva.estado === EstadoReserva.CANCELADA) {
      throw new BadRequestException('La reserva ya está cancelada');
    }

    if (reserva.estado === EstadoReserva.COMPLETADA) {
      throw new BadRequestException('No se puede cancelar una reserva completada');
    }

    reserva.estado = EstadoReserva.CANCELADA;
    const updatedReserva = await this.reservaRepository.save(reserva);
    return this.mapToResponseDto(updatedReserva);
  }

  private mapToResponseDto(reserva: Reserva): BoxReservationResponseDto {
    return {
      id: reserva.id,
      boxId: reserva.boxId,
      psicologoId: reserva.psicologoId,
      fecha: reserva.fecha,
      horaInicio: reserva.horaInicio,
      horaFin: reserva.horaFin,
      estado: reserva.estado,
      estadoPago: reserva.estadoPago,
      precio: reserva.precio,
      createdAt: reserva.createdAt,
      updatedAt: reserva.updatedAt
    };
  }

  async getBoxAvailability(boxId: string, mes: number, anio: number): Promise<any[]> {
    // Validar que el box existe
    const box = await this.boxRepository.findOne({ where: { id: boxId } });
    if (!box) {
      throw new NotFoundException('Box no encontrado');
    }

    // Obtener cantidad de días del mes
    const diasEnMes = new Date(anio, mes, 0).getDate();
    const resultado: any[] = [];

    for (let dia = 1; dia <= diasEnMes; dia++) {
      const fecha = new Date(anio, mes - 1, dia);
      const fechaString = fecha.toISOString().split('T')[0]; // Formato YYYY-MM-DD

      // Buscar reservas para este día
      const reservas = await this.reservaRepository.find({
        where: {
          boxId,
          fecha: fecha,
          estado: EstadoReserva.CONFIRMADA
        },
        order: { horaInicio: 'ASC' }
      });

      // Mapear las reservas del día
      const reservasDelDia = reservas.map(reserva => ({
        id: reserva.id,
        psicologoId: reserva.psicologoId,
        horaInicio: reserva.horaInicio,
        horaFin: reserva.horaFin,
        estado: reserva.estado,
        precio: reserva.precio
      }));

      resultado.push({
        fecha: fechaString,
        dia: dia,
        diaSemana: fecha.toLocaleDateString('es-ES', { weekday: 'long' }),
        reservas: reservasDelDia,
        totalReservas: reservasDelDia.length,
        disponible: reservasDelDia.length === 0 // Disponible si no hay reservas confirmadas
      });
    }

    return resultado;
  }

  async getBoxAvailabilityByDate(boxId: string, fecha: string): Promise<any> {
    // Validar que el box existe
    const box = await this.boxRepository.findOne({ where: { id: boxId } });
    if (!box) {
      throw new NotFoundException('Box no encontrado');
    }

    // Validar formato de fecha y crear objeto Date correctamente
    const [year, month, day] = fecha.split('-').map(Number);
    const fechaObj = new Date(year, month - 1, day); // month - 1 porque los meses van de 0-11
    if (isNaN(fechaObj.getTime())) {
      throw new BadRequestException('Formato de fecha inválido. Use YYYY-MM-DD');
    }

    // Buscar reservas para esta fecha usando query builder con DATE()
    const reservas = await this.reservaRepository
      .createQueryBuilder('reserva')
      .where('reserva.boxId = :boxId', { boxId })
      .andWhere('DATE(reserva.fecha) = :fecha', { fecha })
      .orderBy('reserva.horaInicio', 'ASC')
      .getMany();

    // Generar horarios disponibles (de 8:00 a 20:00)
    const horariosDisponibles: string[] = [];
    const horariosOcupados = reservas
      .filter(r => r.estado !== EstadoReserva.CANCELADA) // Considerar todas las reservas excepto canceladas
      .map(r => ({ inicio: r.horaInicio, fin: r.horaFin }));

    for (let hora = 8; hora < 20; hora++) {
      const horario = `${hora.toString().padStart(2, '0')}:00-${(hora + 1).toString().padStart(2, '0')}:00`;
      
      // Verificar si el horario está ocupado
      const estaOcupado = horariosOcupados.some(ocupado => {
        const inicioOcupado = parseInt(ocupado.inicio.split(':')[0]);
        const finOcupado = parseInt(ocupado.fin.split(':')[0]);
        return hora >= inicioOcupado && hora < finOcupado;
      });

      if (!estaOcupado) {
        horariosDisponibles.push(horario);
      }
    }

    return {
      boxId,
      fecha,
      diaSemana: fechaObj.toLocaleDateString('es-ES', { weekday: 'long' }),
      diaSemanaCorto: fechaObj.toLocaleDateString('es-ES', { weekday: 'short' }),
      diaNumero: fechaObj.getDay(), // 0 = domingo, 1 = lunes, etc.
      reservas: reservas.map(reserva => ({
        id: reserva.id,
        psicologoId: reserva.psicologoId,
        horaInicio: reserva.horaInicio,
        horaFin: reserva.horaFin,
        estado: reserva.estado,
        precio: reserva.precio
      })),
      horariosDisponibles,
      totalReservas: reservas.length,
      reservasConfirmadas: reservas.filter(r => r.estado === EstadoReserva.CONFIRMADA).length,
      disponible: reservas.filter(r => r.estado === EstadoReserva.CONFIRMADA).length === 0
    };
  }

  // Método de debug simple
  async debugBoxReservations(boxId: string, fecha: string): Promise<any> {
    // Validar que el box existe
    const box = await this.boxRepository.findOne({ where: { id: boxId } });
    if (!box) {
      throw new NotFoundException('Box no encontrado');
    }

    // Validar formato de fecha y crear objeto Date correctamente
    const [year, month, day] = fecha.split('-').map(Number);
    const fechaObj = new Date(year, month - 1, day); // month - 1 porque los meses van de 0-11
    if (isNaN(fechaObj.getTime())) {
      throw new BadRequestException('Formato de fecha inválido. Use YYYY-MM-DD');
    }

    // 1. Buscar TODAS las reservas del box (sin filtro de fecha)
    const todasLasReservas = await this.reservaRepository.find({
      where: { boxId },
      order: { fecha: 'ASC', horaInicio: 'ASC' }
    });

    // 2. Buscar reservas para la fecha específica con query builder
    const reservasQueryBuilder = await this.reservaRepository
      .createQueryBuilder('reserva')
      .where('reserva.boxId = :boxId', { boxId })
      .andWhere('DATE(reserva.fecha) = :fecha', { fecha })
      .orderBy('reserva.horaInicio', 'ASC')
      .getMany();

    // 3. Buscar reservas para la fecha específica con find normal
    const reservasFind = await this.reservaRepository.find({
      where: {
        boxId,
        fecha: fechaObj
      },
      order: { horaInicio: 'ASC' }
    });

    return {
      boxId,
      fechaSolicitada: fecha,
      fechaObj: fechaObj.toISOString(),
      
      // Resultados de diferentes consultas
      todasLasReservas: todasLasReservas.length,
      reservasQueryBuilder: reservasQueryBuilder.length,
      reservasFind: reservasFind.length,
      
      // Detalles de las consultas
      reservasQueryBuilderDetalle: reservasQueryBuilder.map(r => ({
        id: r.id,
        estado: r.estado,
        horaInicio: r.horaInicio,
        horaFin: r.horaFin,
        fecha: r.fecha
      })),
      
      reservasFindDetalle: reservasFind.map(r => ({
        id: r.id,
        estado: r.estado,
        horaInicio: r.horaInicio,
        horaFin: r.horaFin,
        fecha: r.fecha
      })),
      
      // Análisis de todas las reservas del box
      todasLasReservasDetalle: todasLasReservas.map(r => ({
        id: r.id,
        estado: r.estado,
        fecha: r.fecha,
        fechaISO: new Date(r.fecha).toISOString().split('T')[0],
        horaInicio: r.horaInicio,
        horaFin: r.horaFin
      }))
    };
  }
} 