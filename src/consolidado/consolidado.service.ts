import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { Reserva } from '../common/entities/reserva.entity';
import { Box } from '../common/entities/box.entity';
import { Sede } from '../common/entities/sede.entity';
import { User } from '../common/entities/user.entity';
import { Suscripcion } from '../common/entities/suscripcion.entity';
import { Plan } from '../common/entities/plan.entity';
import { PackHora } from '../packs/entities/pack-hora.entity';
import { PackAsignacion, EstadoPackAsignacion } from '../packs/entities/pack-asignacion.entity';
import { PackPagoMensual, EstadoPagoPackMensual } from '../packs/entities/pack-pago-mensual.entity';
import { ConsolidadoMensualDto, DetalleReservaDto, DetalleSuscripcionDto, DetalleSedeDto } from './dto/consolidado-mensual.dto';

@Injectable()
export class ConsolidadoService {
  constructor(
    @InjectRepository(Reserva)
    private reservaRepository: Repository<Reserva>,
    @InjectRepository(Box)
    private boxRepository: Repository<Box>,
    @InjectRepository(Sede)
    private sedeRepository: Repository<Sede>,
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

  private convertirSedeADto(sede: any): DetalleSedeDto {
    return {
      id: sede.id,
      nombre: sede.nombre,
      description: sede.description,
      direccion: sede.direccion,
      ciudad: sede.ciudad,
      telefono: sede.telefono,
      email: sede.email,
      imageUrl: sede.imageUrl,
      thumbnailUrl: sede.thumbnailUrl,
      features: sede.features,
      coordenadas: sede.coordenadas,
      horarioAtencion: sede.horarioAtencion,
      serviciosDisponibles: sede.serviciosDisponibles,
      estado: sede.estado
    };
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
      reservasConfirmadas: number;
      reservasCanceladas: number;
      reservas: Reserva[];
      estadoPago: string;
      montoPagado: number;
      montoReembolsado: number;
      estadoAsignacion: string;
      precioPorReserva: number;
      nombreBox: string;
      detallesAsignacion: {
        dias: number[];
        horarios: {
          diaSemana: number;
          horaInicio: string;
          horaFin: string;
          nombreBox: string;
        }[];
      };
      // Información completa del pago mensual
      pagoMensual: {
        id: string;
        mes: number;
        año: number;
        monto: number;
        montoPagado: number;
        montoReembolsado: number;
        estado: string;
        fechaPago: Date | null;
        fechaVencimiento: Date | null;
        observaciones: string | null;
        metodoPago: string | null;
        referenciaPago: string | null;
        createdAt: Date;
        updatedAt: Date;
      } | null;
    }

    // Obtener asignaciones de packs del psicólogo (activas y canceladas)
    const asignaciones = await this.packAsignacionRepository.find({
      where: {
        usuarioId: psicologoId,
        estado: In([EstadoPackAsignacion.ACTIVA, EstadoPackAsignacion.CANCELADA])
      },
      relations: ['pack', 'horarios', 'horarios.box']
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
          const precioPackOriginal = this.parsePrecio(asignacion.pack.precio);
          const reservasConfirmadas = reservasPack.filter(r => r.estado === 'confirmada').length;
          const reservasCanceladas = reservasPack.filter(r => r.estado === 'cancelada').length;
          const totalReservas = reservasPack.length;

          // Calcular precio proporcional
          let precioProporcional = 0;
          let precioTotalReal = precioPackOriginal; // Precio real después de cancelaciones
          let precioPorReserva = 0;
          
          if (totalReservas > 0) {
            // Precio por reserva = precio del pack / total de reservas del mes
            precioPorReserva = precioPackOriginal / totalReservas;
            
            // Calcular precio proporcional basado solo en reservas confirmadas
            precioProporcional = precioPorReserva * reservasConfirmadas;
            
            // El precio total real es el precio proporcional (ya considera cancelaciones)
            precioTotalReal = precioProporcional;
          }

          // Obtener información del box y detalles de la asignación
          const nombreBox = asignacion.horarios && asignacion.horarios.length > 0 
            ? asignacion.horarios[0].box?.nombre || 'Box no encontrado'
            : 'Sin box asignado';

          // Construir detalles de la asignación
          const detallesAsignacion = {
            dias: [...new Set(asignacion.horarios?.map(h => h.diaSemana) || [])],
            horarios: asignacion.horarios?.map(h => ({
              diaSemana: h.diaSemana,
              horaInicio: h.horaInicio,
              horaFin: h.horaFin,
              nombreBox: h.box?.nombre || 'Box no encontrado'
            })) || []
          };

          // Incluir pack con información de pago (si existe) o valores por defecto
          packsDelMes.push({
            packId: asignacion.pack.id,
            packNombre: asignacion.pack.nombre,
            asignacionId: asignacion.id,
            precioTotal: precioTotalReal, // Precio real después de cancelaciones
            precioProporcional,
            totalReservas,
            reservasConfirmadas,
            reservasCanceladas,
            reservas: reservasPack,
            estadoPago: pagoMensual ? pagoMensual.estado : 'pendiente_pago',
            montoPagado: pagoMensual ? this.parsePrecio(pagoMensual.montoPagado) : 0,
            montoReembolsado: pagoMensual ? this.parsePrecio(pagoMensual.montoReembolsado) : 0,
            estadoAsignacion: asignacion.estado,
            precioPorReserva,
            nombreBox,
            detallesAsignacion,
            // Información completa del pago mensual
            pagoMensual: pagoMensual ? {
              id: pagoMensual.id,
              mes: pagoMensual.mes,
              año: pagoMensual.año,
              monto: this.parsePrecio(pagoMensual.monto),
              montoPagado: this.parsePrecio(pagoMensual.montoPagado),
              montoReembolsado: this.parsePrecio(pagoMensual.montoReembolsado),
              estado: pagoMensual.estado,
              fechaPago: pagoMensual.fechaPago,
              fechaVencimiento: pagoMensual.fechaVencimiento,
              observaciones: pagoMensual.observaciones,
              metodoPago: pagoMensual.metodoPago,
              referenciaPago: pagoMensual.referenciaPago,
              createdAt: pagoMensual.createdAt,
              updatedAt: pagoMensual.updatedAt
            } : null
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

    // Obtener información de los boxes con sus sedes
    const boxIds = [...new Set(reservas.map(r => r.boxId))];
    const boxes = await this.boxRepository.find({
      where: { id: In(boxIds) },
      relations: ['sede']
    });
    const boxMap = new Map(boxes.map(box => [box.id, box]));
    
    // Crear mapa de sedes para acceso rápido
    const sedesMap = new Map();
    boxes.forEach(box => {
      if (box.sede && !sedesMap.has(box.sede.id)) {
        sedesMap.set(box.sede.id, box.sede);
      }
    });

    // Procesar reservas individuales para crear el detalle
    const detalleReservas: DetalleReservaDto[] = reservasIndividuales.map(reserva => {
      const box = boxMap.get(reserva.boxId);
      
      // Debug: Log de la fecha original
      console.log(`🔍 Debug fecha reserva ${reserva.id}:`, {
        fechaOriginal: reserva.fecha,
        tipo: typeof reserva.fecha,
        fechaComoDate: new Date(reserva.fecha),
        fechaISO: new Date(reserva.fecha).toISOString(),
        fechaLocal: new Date(reserva.fecha).toLocaleDateString('en-CA'),
        fechaManual: `${new Date(reserva.fecha).getFullYear()}-${String(new Date(reserva.fecha).getMonth() + 1).padStart(2, '0')}-${String(new Date(reserva.fecha).getDate()).padStart(2, '0')}`
      });
      
      // Manejar fecha - método específico para PostgreSQL date
      let fechaReserva: string;
      
      // Para PostgreSQL date, usar UTC para evitar problemas de zona horaria
      if (reserva.fecha instanceof Date) {
        // Usar UTC para evitar problemas de zona horaria con PostgreSQL date
        fechaReserva = `${reserva.fecha.getUTCFullYear()}-${String(reserva.fecha.getUTCMonth() + 1).padStart(2, '0')}-${String(reserva.fecha.getUTCDate()).padStart(2, '0')}`;
      } else {
        // Si es string, crear Date y usar UTC
        const fechaDate = new Date(reserva.fecha);
        fechaReserva = `${fechaDate.getUTCFullYear()}-${String(fechaDate.getUTCMonth() + 1).padStart(2, '0')}-${String(fechaDate.getUTCDate()).padStart(2, '0')}`;
      }
      
      // Manejar createdAt que puede ser string o Date
      const fechaCreacion = reserva.createdAt instanceof Date
        ? reserva.createdAt.toISOString()
        : new Date(reserva.createdAt).toISOString();
      
      return {
        id: reserva.id,
        boxId: reserva.boxId,
        nombreBox: box?.nombre || 'Box no encontrado',
        sede: box?.sede ? this.convertirSedeADto(box.sede) : {
          id: '',
          nombre: 'Sede no encontrada',
          description: '',
          direccion: '',
          ciudad: '',
          estado: 'INACTIVA'
        },
        fecha: fechaReserva,
        horaInicio: reserva.horaInicio,
        horaFin: reserva.horaFin,
        precio: this.parsePrecio(reserva.precio), // Convertir a número
        estado: reserva.estado,
        estadoPago: reserva.estadoPago,
        createdAt: fechaCreacion
      };
    });

    // Calcular totales incluyendo packs (SOLO ACTIVOS Y VÁLIDOS)
    
    // Reservas individuales válidas (solo confirmadas/completadas)
    const reservasIndividualesValidas = reservasIndividuales.filter(r => 
      r.estado === 'confirmada' || r.estado === 'completada'
    );
    const totalReservasIndividuales = reservasIndividualesValidas.length;
    const totalMontoIndividuales = reservasIndividualesValidas.reduce((sum, r) => {
      return sum + this.parsePrecio(r.precio);
    }, 0);

    // Calcular totales de packs (SOLO ACTIVOS)
    const packsActivos = packsDelMes.filter(pack => pack.estadoAsignacion === 'ACTIVA');
    const totalMontoPacks = packsActivos.reduce((sum, pack) => {
      return sum + pack.precioProporcional;
    }, 0);

    // Reservas de packs válidas (solo de packs activos y solo confirmadas/completadas)
    const reservasDePacksValidas = reservasDePacks.filter(r => {
      const packAsociado = packsActivos.find(p => p.asignacionId === r.packAsignacionId);
      return packAsociado && (r.estado === 'confirmada' || r.estado === 'completada');
    });

    const totalReservas = totalReservasIndividuales + reservasDePacksValidas.length;
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

    // Calcular estadísticas (SOLO RESERVAS VÁLIDAS)
    const promedioPorReserva = totalReservas > 0 ? totalMonto / totalReservas : 0;
    
    // Combinar reservas válidas para estadísticas
    const reservasValidasParaEstadisticas = [...reservasIndividualesValidas, ...reservasDePacksValidas];
    
    // Calcular reservas por semana (solo válidas)
    const reservasPorSemana = this.calcularReservasPorSemana(reservasValidasParaEstadisticas, fechaInicio);
    
    // Calcular días con reservas (solo válidas) - usar UTC para PostgreSQL date
    const diasConReservas = new Set(reservasValidasParaEstadisticas.map(r => {
      let fechaReserva: string;
      if (r.fecha instanceof Date) {
        // Usar UTC para evitar problemas de zona horaria con PostgreSQL date
        fechaReserva = `${r.fecha.getUTCFullYear()}-${String(r.fecha.getUTCMonth() + 1).padStart(2, '0')}-${String(r.fecha.getUTCDate()).padStart(2, '0')}`;
      } else {
        // Si es string, crear Date y usar UTC
        const fechaDate = new Date(r.fecha);
        fechaReserva = `${fechaDate.getUTCFullYear()}-${String(fechaDate.getUTCMonth() + 1).padStart(2, '0')}-${String(fechaDate.getUTCDate()).padStart(2, '0')}`;
      }
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
        reservasConfirmadas: pack.reservasConfirmadas,
        reservasCanceladas: pack.reservasCanceladas,
        precioPorReserva: Math.round(pack.precioPorReserva * 100) / 100,
        estadoPago: pack.estadoPago,
        montoPagado: Math.round(pack.montoPagado * 100) / 100,
        montoReembolsado: Math.round(pack.montoReembolsado * 100) / 100,
        estadoAsignacion: pack.estadoAsignacion,
        nombreBox: pack.nombreBox,
        detallesAsignacion: pack.detallesAsignacion,
        pagoMensual: pack.pagoMensual
      })),
      resumenPacks: {
        totalPacks: packsActivos.length,
        totalMontoPacks: Math.round(totalMontoPacks * 100) / 100,
        totalMontoIndividuales: Math.round(totalMontoIndividuales * 100) / 100
      }
    };
  }

  async getUsuariosParaConsolidado(): Promise<any[]> {
    // Definir interfaz para el usuario con actividad
    interface UsuarioConActividad {
      id: string;
      nombre: string;
      email: string;
      tieneReservas: boolean;
      tienePacks: boolean;
    }

    // Obtener todos los psicólogos que tienen actividad (reservas o packs)
    const psicologos = await this.userRepository.find({
      where: { role: 'PSICOLOGO' },
      select: ['id', 'nombre', 'apellido', 'email'],
      order: { nombre: 'ASC' }
    });

    // Para cada psicólogo, verificar si tiene actividad
    const psicologosConActividad: UsuarioConActividad[] = [];
    
    for (const psicologo of psicologos) {
      // Verificar si tiene reservas
      const tieneReservas = await this.reservaRepository.findOne({
        where: { psicologoId: psicologo.id }
      });

      // Verificar si tiene packs asignados
      const tienePacks = await this.packAsignacionRepository.findOne({
        where: { usuarioId: psicologo.id }
      });

      // Solo incluir si tiene actividad
      if (tieneReservas || tienePacks) {
        psicologosConActividad.push({
          id: psicologo.id,
          nombre: `${psicologo.nombre} ${psicologo.apellido}`,
          email: psicologo.email,
          tieneReservas: !!tieneReservas,
          tienePacks: !!tienePacks
        });
      }
    }

    return psicologosConActividad;
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
