import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { Reserva } from '../common/entities/reserva.entity';
import { Box } from '../common/entities/box.entity';
import { User } from '../common/entities/user.entity';
import { ConsolidadoMensualDto, DetalleReservaDto } from './dto/consolidado-mensual.dto';

@Injectable()
export class ConsolidadoService {
  constructor(
    @InjectRepository(Reserva)
    private reservaRepository: Repository<Reserva>,
    @InjectRepository(Box)
    private boxRepository: Repository<Box>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  private parsePrecio(precio: any): number {
    if (typeof precio === 'string') {
      return parseFloat(precio) || 0;
    }
    return precio || 0;
  }

  async getConsolidadoMensual(
    psicologoId: string, 
    mes: string
  ): Promise<ConsolidadoMensualDto> {
    // Validar formato del mes
    const mesRegex = /^\d{4}-\d{2}$/;
    if (!mesRegex.test(mes)) {
      throw new BadRequestException('El mes debe tener el formato YYYY-MM (ej: 2024-01)');
    }

    // Parsear año y mes
    const [año, mesNumero] = mes.split('-').map(Number);
    
    // Validar rango de mes
    if (mesNumero < 1 || mesNumero > 12) {
      throw new BadRequestException('El mes debe estar entre 01 y 12');
    }

    // Calcular fechas de inicio y fin del mes
    const fechaInicio = new Date(año, mesNumero - 1, 1);
    const fechaFin = new Date(año, mesNumero, 0, 23, 59, 59);

    // Verificar que el psicólogo existe
    const psicologo = await this.userRepository.findOne({
      where: { id: psicologoId, role: 'PSICOLOGO' }
    });

    if (!psicologo) {
      throw new NotFoundException('Psicólogo no encontrado');
    }

    // Obtener todas las reservas del psicólogo en el mes
    const reservas = await this.reservaRepository.find({
      where: {
        psicologoId,
        fecha: Between(fechaInicio, fechaFin)
      },
      order: {
        fecha: 'ASC',
        horaInicio: 'ASC'
      }
    });

    // Obtener información de los boxes
    const boxIds = [...new Set(reservas.map(r => r.boxId))];
    const boxes = await this.boxRepository.find({
      where: { id: In(boxIds) }
    });
    const boxMap = new Map(boxes.map(box => [box.id, box]));

    // Procesar reservas para crear el detalle
    const detalleReservas: DetalleReservaDto[] = reservas.map(reserva => {
      const box = boxMap.get(reserva.boxId);
      
      // Manejar fecha que puede ser string o Date
      const fechaReserva = reserva.fecha instanceof Date 
        ? reserva.fecha.toISOString().split('T')[0]
        : new Date(reserva.fecha).toISOString().split('T')[0];
      
      // Manejar createdAt que puede ser string o Date
      const fechaCreacion = reserva.createdAt instanceof Date
        ? reserva.createdAt.toISOString()
        : new Date(reserva.createdAt).toISOString();
      
      return {
        id: reserva.id,
        boxId: reserva.boxId,
        nombreBox: box?.nombre || 'Box no encontrado',
        fecha: fechaReserva,
        horaInicio: reserva.horaInicio,
        horaFin: reserva.horaFin,
        precio: this.parsePrecio(reserva.precio), // Convertir a número
        estado: reserva.estado,
        createdAt: fechaCreacion
      };
    });

    // Calcular totales
    const totalReservas = reservas.length;
    const totalMonto = reservas.reduce((sum, r) => {
      return sum + this.parsePrecio(r.precio);
    }, 0);

    // Debug: verificar precios
    console.log('Debug consolidado:', {
      totalReservas,
      totalMonto,
      precios: reservas.map(r => ({ id: r.id, precio: r.precio, estado: r.estado }))
    });

    // Calcular resumen por estado
    const resumen = {
      reservasCompletadas: reservas.filter(r => r.estado === 'completada').length,
      reservasCanceladas: reservas.filter(r => r.estado === 'cancelada').length,
      reservasPendientes: reservas.filter(r => r.estado === 'pendiente').length,
      montoCompletadas: reservas
        .filter(r => r.estado === 'completada')
        .reduce((sum, r) => sum + this.parsePrecio(r.precio), 0),
      montoCanceladas: reservas
        .filter(r => r.estado === 'cancelada')
        .reduce((sum, r) => sum + this.parsePrecio(r.precio), 0),
      montoPendientes: reservas
        .filter(r => r.estado === 'pendiente')
        .reduce((sum, r) => sum + this.parsePrecio(r.precio), 0)
    };

    // Calcular estadísticas
    const promedioPorReserva = totalReservas > 0 ? totalMonto / totalReservas : 0;
    
    // Calcular reservas por semana
    const reservasPorSemana = this.calcularReservasPorSemana(reservas, fechaInicio);
    
    // Calcular días con reservas
    const diasConReservas = new Set(reservas.map(r => {
      const fechaReserva = r.fecha instanceof Date 
        ? r.fecha.toISOString().split('T')[0]
        : new Date(r.fecha).toISOString().split('T')[0];
      return fechaReserva;
    })).size;

    const estadisticas = {
      promedioPorReserva: Math.round(promedioPorReserva * 100) / 100,
      reservasPorSemana,
      diasConReservas
    };

    return {
      psicologoId,
      nombrePsicologo: `${psicologo.nombre} ${psicologo.apellido}`,
      emailPsicologo: psicologo.email,
      mes,
      año,
      mesNumero,
      totalReservas,
      totalMonto: Math.round(totalMonto * 100) / 100,
      detalleReservas,
      resumen,
      estadisticas
    };
  }

  private calcularReservasPorSemana(reservas: Reserva[], fechaInicio: Date): number[] {
    const semanas: number[] = [];
    const fechaActual = new Date(fechaInicio);
    
    // Obtener el primer lunes del mes
    const primerLunes = new Date(fechaActual);
    const diaSemana = fechaActual.getDay();
    const diasHastaLunes = diaSemana === 0 ? 6 : diaSemana - 1;
    primerLunes.setDate(fechaActual.getDate() - diasHastaLunes);
    
    // Calcular 5 semanas (máximo)
    for (let i = 0; i < 5; i++) {
      const inicioSemana = new Date(primerLunes);
      inicioSemana.setDate(primerLunes.getDate() + (i * 7));
      
      const finSemana = new Date(inicioSemana);
      finSemana.setDate(inicioSemana.getDate() + 6);
      
      const reservasEnSemana = reservas.filter(r => {
        const fechaReserva = r.fecha instanceof Date ? r.fecha : new Date(r.fecha);
        return fechaReserva >= inicioSemana && fechaReserva <= finSemana;
      }).length;
      
      semanas.push(reservasEnSemana);
    }
    
    return semanas;
  }
}
