import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { Reserva } from '../common/entities/reserva.entity';
import { Box } from '../common/entities/box.entity';
import { User } from '../common/entities/user.entity';
import { Suscripcion } from '../common/entities/suscripcion.entity';
import { Plan } from '../common/entities/plan.entity';
import { PackHora } from '../packs/entities/pack-hora.entity';
import { PackAsignacion, EstadoPackAsignacion } from '../packs/entities/pack-asignacion.entity';
import { PackPagoMensual, EstadoPagoPackMensual } from '../packs/entities/pack-pago-mensual.entity';
import { ConsolidadoMensualDto, DetalleReservaDto, DetalleSuscripcionDto } from './dto/consolidado-mensual.dto';

@Injectable()
export class ConsolidadoService {
  constructor(
    @InjectRepository(Reserva)
    private reservaRepository: Repository<Reserva>,
    @InjectRepository(Box)
    private boxRepository: Repository<Box>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Suscripcion)
    private suscripcionRepository: Repository<Suscripcion>,
    @InjectRepository(Plan)
    private planRepository: Repository<Plan>,
    @InjectRepository(PackHora)
    private packRepository: Repository<PackHora>,
    @InjectRepository(PackAsignacion)
    private packAsignacionRepository: Repository<PackAsignacion>,
    @InjectRepository(PackPagoMensual)
    private packPagoMensualRepository: Repository<PackPagoMensual>,
  ) {}

  private parsePrecio(precio: any): number {
    if (typeof precio === 'string') {
      return parseFloat(precio) || 0;
    }
    return precio || 0;
  }

  private async obtenerPacksDelMes(psicologoId: string, fechaInicio: Date, fechaFin: Date): Promise<any[]> {
    // Definir interfaz para el pack del mes
    interface PackDelMes {
      packId: string;
      packNombre: string;
      asignacionId: string;
      precioTotal: number;
      precioProporcional: number;
      totalReservas: number;
      reservasCompletadas: number;
      reservasCanceladas: number;
      reservasPendientes: number;
      reservas: Reserva[];
      estadoPago: string;
      montoPagado: number;
      montoReembolsado: number;
      estadoAsignacion: string;
    }

    // Obtener asignaciones de packs del psicólogo (activas y canceladas)
    const asignaciones = await this.packAsignacionRepository.find({
      where: {
        usuarioId: psicologoId,
        estado: In([EstadoPackAsignacion.ACTIVA, EstadoPackAsignacion.CANCELADA])
      },
      relations: ['pack']
    });

    const packsDelMes: PackDelMes[] = [];
    const mesNumero = fechaInicio.getMonth() + 1;
    const año = fechaInicio.getFullYear();

    for (const asignacion of asignaciones) {
      // Verificar si la asignación está activa durante el mes consultado
      const fechaAsignacion = new Date(asignacion.createdAt);
      
      // Si la asignación fue creada antes o durante el mes consultado
      if (fechaAsignacion <= fechaFin) {
        // Obtener reservas del pack para este mes
        const reservasPack = await this.reservaRepository.find({
          where: {
            psicologoId,
            packAsignacionId: asignacion.id,
            fecha: Between(fechaInicio, fechaFin)
          }
        });

        if (reservasPack.length > 0) {
          // Obtener el pago mensual para este mes específico
          const pagoMensual = await this.packPagoMensualRepository.findOne({
            where: {
              asignacionId: asignacion.id,
              mes: mesNumero,
              año: año
            }
          });

          // Calcular precio proporcional del pack
          const precioPack = this.parsePrecio(asignacion.pack.precio);
          const reservasCompletadas = reservasPack.filter(r => r.estado === 'completada').length;
          const reservasCanceladas = reservasPack.filter(r => r.estado === 'cancelada').length;
          const totalReservas = reservasPack.length;

          // Calcular precio proporcional
          let precioProporcional = 0;
          if (totalReservas > 0) {
            // Precio por reserva = precio del pack / total de reservas del mes
            const precioPorReserva = precioPack / totalReservas;
            precioProporcional = precioPorReserva * reservasCompletadas;
          }

          // Incluir pack con información de pago (si existe) o valores por defecto
          packsDelMes.push({
            packId: asignacion.pack.id,
            packNombre: asignacion.pack.nombre,
            asignacionId: asignacion.id,
            precioTotal: precioPack,
            precioProporcional,
            totalReservas,
            reservasCompletadas,
            reservasCanceladas,
            reservasPendientes: reservasPack.filter(r => r.estado === 'pendiente').length,
            reservas: reservasPack,
            estadoPago: pagoMensual ? pagoMensual.estado : 'pendiente_pago',
            montoPagado: pagoMensual ? this.parsePrecio(pagoMensual.montoPagado) : 0,
            montoReembolsado: pagoMensual ? this.parsePrecio(pagoMensual.montoReembolsado) : 0,
            estadoAsignacion: asignacion.estado
          });
        }
      }
    }

    return packsDelMes;
  }

  private async obtenerInformacionSuscripcion(psicologoId: string): Promise<DetalleSuscripcionDto | null> {
    try {
      const suscripcion = await this.suscripcionRepository.findOne({
        where: { usuarioId: psicologoId },
        relations: ['plan'],
        order: { fechaCreacion: 'DESC' }
      });

      if (!suscripcion) {
        return null;
      }

      // Manejar fechas que pueden ser string o Date
      const fechaInicio = suscripcion.fechaInicio instanceof Date 
        ? suscripcion.fechaInicio.toISOString()
        : new Date(suscripcion.fechaInicio).toISOString();
      
      const fechaFin = suscripcion.fechaFin instanceof Date 
        ? suscripcion.fechaFin.toISOString()
        : new Date(suscripcion.fechaFin).toISOString();

      const fechaProximaRenovacion = suscripcion.fechaProximaRenovacion 
        ? (suscripcion.fechaProximaRenovacion instanceof Date 
            ? suscripcion.fechaProximaRenovacion.toISOString()
            : new Date(suscripcion.fechaProximaRenovacion).toISOString())
        : undefined;

      return {
        id: suscripcion.id,
        estado: suscripcion.estado,
        fechaInicio,
        fechaFin,
        precioTotal: this.parsePrecio(suscripcion.precioTotal),
        horasConsumidas: suscripcion.horasConsumidas || 0,
        horasDisponibles: suscripcion.horasDisponibles || 0,
        renovacionAutomatica: suscripcion.renovacionAutomatica || false,
        fechaProximaRenovacion,
        plan: {
          id: suscripcion.plan?.id || '',
          nombre: suscripcion.plan?.nombre || 'Plan no encontrado',
          descripcion: suscripcion.plan?.descripcion || '',
          precio: this.parsePrecio(suscripcion.plan?.precio),
          horasIncluidas: suscripcion.plan?.horasIncluidas || 0,
          beneficios: suscripcion.plan?.beneficios || []
        }
      };
    } catch (error) {
      console.error('Error obteniendo información de suscripción:', error);
      return null;
    }
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

    // Obtener información de suscripción del psicólogo
    const suscripcion = await this.obtenerInformacionSuscripcion(psicologoId);

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

    // Obtener información de packs del mes
    const packsDelMes = await this.obtenerPacksDelMes(psicologoId, fechaInicio, fechaFin);

    // Separar reservas de packs de reservas individuales
    const reservasIndividuales = reservas.filter(r => !r.packAsignacionId);
    const reservasDePacks = reservas.filter(r => r.packAsignacionId);

    // Obtener información de los boxes
    const boxIds = [...new Set(reservas.map(r => r.boxId))];
    const boxes = await this.boxRepository.find({
      where: { id: In(boxIds) }
    });
    const boxMap = new Map(boxes.map(box => [box.id, box]));

    // Procesar reservas individuales para crear el detalle
    const detalleReservas: DetalleReservaDto[] = reservasIndividuales.map(reserva => {
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
        estadoPago: reserva.estadoPago,
        createdAt: fechaCreacion
      };
    });

    // Calcular totales incluyendo packs
    const totalReservasIndividuales = reservasIndividuales.length;
    const totalMontoIndividuales = reservasIndividuales.reduce((sum, r) => {
      return sum + this.parsePrecio(r.precio);
    }, 0);

    // Calcular totales de packs
    const totalMontoPacks = packsDelMes.reduce((sum, pack) => {
      return sum + pack.precioProporcional;
    }, 0);

    const totalReservas = totalReservasIndividuales + reservasDePacks.length;
    const totalMonto = totalMontoIndividuales + totalMontoPacks;

    // Debug: verificar precios
    console.log('Debug consolidado:', {
      totalReservas,
      totalMonto,
      totalMontoIndividuales,
      totalMontoPacks,
      packsDelMes: packsDelMes.length,
      precios: reservasIndividuales.map(r => ({ id: r.id, precio: r.precio, estado: r.estado }))
    });

    // Calcular resumen por estado (incluyendo packs)
    const reservasCompletadasIndividuales = reservasIndividuales.filter(r => r.estado === 'completada').length;
    const reservasCanceladasIndividuales = reservasIndividuales.filter(r => r.estado === 'cancelada').length;
    const reservasPendientesIndividuales = reservasIndividuales.filter(r => r.estado === 'pendiente').length;

    const montoCompletadasIndividuales = reservasIndividuales
      .filter(r => r.estado === 'completada')
      .reduce((sum, r) => sum + this.parsePrecio(r.precio), 0);
    const montoCanceladasIndividuales = reservasIndividuales
      .filter(r => r.estado === 'cancelada')
      .reduce((sum, r) => sum + this.parsePrecio(r.precio), 0);
    const montoPendientesIndividuales = reservasIndividuales
      .filter(r => r.estado === 'pendiente')
      .reduce((sum, r) => sum + this.parsePrecio(r.precio), 0);

    // Calcular montos de packs
    const montoCompletadasPacks = packsDelMes.reduce((sum, pack) => sum + pack.precioProporcional, 0);
    const montoCanceladasPacks = packsDelMes.reduce((sum, pack) => {
      const precioPorReserva = pack.precioTotal / pack.totalReservas;
      return sum + (precioPorReserva * pack.reservasCanceladas);
    }, 0);

    const resumen = {
      reservasCompletadas: reservasCompletadasIndividuales + reservasDePacks.filter(r => r.estado === 'completada').length,
      reservasCanceladas: reservasCanceladasIndividuales + reservasDePacks.filter(r => r.estado === 'cancelada').length,
      reservasPendientes: reservasPendientesIndividuales + reservasDePacks.filter(r => r.estado === 'pendiente').length,
      montoCompletadas: montoCompletadasIndividuales + montoCompletadasPacks,
      montoCanceladas: montoCanceladasIndividuales + montoCanceladasPacks,
      montoPendientes: montoPendientesIndividuales
    };

    // Calcular resumen por estado de pago (solo reservas individuales, los packs se pagan por separado)
    const resumenPago = {
      reservasPagadas: reservasIndividuales.filter(r => r.estadoPago === 'pagado').length,
      reservasPendientesPago: reservasIndividuales.filter(r => r.estadoPago === 'pendiente_pago').length,
      montoPagadas: reservasIndividuales
        .filter(r => r.estadoPago === 'pagado')
        .reduce((sum, r) => sum + this.parsePrecio(r.precio), 0),
      montoPendientesPago: reservasIndividuales
        .filter(r => r.estadoPago === 'pendiente_pago')
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
      suscripcion,
      resumen,
      resumenPago,
      estadisticas,
      packsDelMes: packsDelMes.map(pack => ({
        packId: pack.packId,
        packNombre: pack.packNombre,
        asignacionId: pack.asignacionId,
        precioTotal: pack.precioTotal,
        precioProporcional: Math.round(pack.precioProporcional * 100) / 100,
        totalReservas: pack.totalReservas,
        reservasCompletadas: pack.reservasCompletadas,
        reservasCanceladas: pack.reservasCanceladas,
        reservasPendientes: pack.reservasPendientes,
        precioPorReserva: pack.totalReservas > 0 ? Math.round((pack.precioTotal / pack.totalReservas) * 100) / 100 : 0,
        estadoPago: pack.estadoPago,
        montoPagado: Math.round(pack.montoPagado * 100) / 100,
        montoReembolsado: Math.round(pack.montoReembolsado * 100) / 100,
        estadoAsignacion: pack.estadoAsignacion
      })),
      resumenPacks: {
        totalPacks: packsDelMes.length,
        totalMontoPacks: Math.round(totalMontoPacks * 100) / 100,
        totalMontoIndividuales: Math.round(totalMontoIndividuales * 100) / 100
      }
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
