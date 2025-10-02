import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, DataSource, Repository } from 'typeorm';
import { PackHora } from './entities/pack-hora.entity';
import { PackAsignacion, EstadoPackAsignacion } from './entities/pack-asignacion.entity';
import { PackAsignacionHorario } from './entities/pack-asignacion-horario.entity';
import { PackPagoMensual, EstadoPagoPackMensual } from './entities/pack-pago-mensual.entity';
import { Box } from '../common/entities/box.entity';
import { User } from '../common/entities/user.entity';
import { Reserva, EstadoPagoReserva, EstadoReserva } from '../common/entities/reserva.entity';
import { AsignarPackDto, CrearPackDto, CancelarPackDto } from './dto/packs.dto';

@Injectable()
export class PacksService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(PackHora) private packRepo: Repository<PackHora>,
    @InjectRepository(PackAsignacion) private asignacionRepo: Repository<PackAsignacion>,
    @InjectRepository(PackAsignacionHorario) private horarioRepo: Repository<PackAsignacionHorario>,
    @InjectRepository(PackPagoMensual) private pagoMensualRepo: Repository<PackPagoMensual>,
    @InjectRepository(Reserva) private reservaRepo: Repository<Reserva>,
    @InjectRepository(Box) private boxRepo: Repository<Box>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  async crearPack(dto: CrearPackDto) {
    const pack = this.packRepo.create({
      nombre: dto.nombre,
      horas: dto.horas,
      precio: dto.precio,
      activo: true,
    });
    return this.packRepo.save(pack);
  }

  async getPack(id: string) {
    const pack = await this.packRepo.findOne({ where: { id } });
    if (!pack) throw new NotFoundException('Pack no encontrado');
    return pack;
  }

  async listarPacks(params?: { activo?: boolean }) {
    if (typeof params?.activo === 'boolean') {
      return this.packRepo.find({ where: { activo: params.activo }, order: { createdAt: 'DESC' } });
    }
    return this.packRepo.find({ order: { createdAt: 'DESC' } });
  }

  async softDeletePack(id: string) {
    const pack = await this.packRepo.findOne({ where: { id } });
    if (!pack) throw new NotFoundException('Pack no encontrado');
    if (!pack.activo) return pack; // ya está desactivado
    pack.activo = false;
    return this.packRepo.save(pack);
  }

  async asignarPack(dto: AsignarPackDto) {
    const pack = await this.packRepo.findOne({ where: { id: dto.packId, activo: true } });
    if (!pack) throw new NotFoundException('Pack no encontrado o inactivo');

    const user = await this.userRepo.findOne({ where: { id: dto.usuarioId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    if (!dto.horarios?.length) throw new BadRequestException('Debe indicar al menos un horario');

    // Validar boxes existen
    const boxIds = Array.from(new Set(dto.horarios.map(h => h.boxId)));
    const boxes = await this.boxRepo.findByIds(boxIds);
    if (boxes.length !== boxIds.length) throw new BadRequestException('Algún box indicado no existe');

    // Verificar conflictos antes de proceder
    const conflictos = await this.verificarConflictosReservas(dto.horarios, dto.fechaLimite);
    if (conflictos.length > 0) {
      const mensajeDetallado = this.generarMensajeConflictos(conflictos);
      throw new BadRequestException({
        message: mensajeDetallado,
        conflictos: conflictos,
        totalConflictos: conflictos.length
      });
    }

    return this.dataSource.transaction(async (manager) => {
      const asignacion = manager.create(PackAsignacion, {
        packId: pack.id,
        usuarioId: user.id,
        estado: EstadoPackAsignacion.ACTIVA,
        recurrente: dto.recurrente !== false,
      });
      const savedAsignacion = await manager.save(asignacion);

      const horarios = dto.horarios.map(h => manager.create(PackAsignacionHorario, {
        asignacionId: savedAsignacion.id,
        diaSemana: h.diaSemana,
        horaInicio: h.horaInicio,
        horaFin: h.horaFin,
        boxId: h.boxId,
      }));
      await manager.save(horarios);

      // Generar reservas hasta la fecha límite especificada o por defecto 3 meses
      const resultadoReservas = await this.generarReservasRecurrencia(manager, savedAsignacion.id, user.id, dto.fechaLimite);

      // Generar pagos mensuales para el período
      await this.generarPagosMensuales(manager, savedAsignacion.id, user.id, pack.precio, dto.fechaLimite);

      return { 
        asignacionId: savedAsignacion.id,
        reservasGeneradas: resultadoReservas.reservasGeneradas,
        fechaInicio: resultadoReservas.fechaInicio,
        fechaFin: resultadoReservas.fechaFin,
        fechaLimiteUsada: resultadoReservas.fechaLimiteUsada,
        conflictosVerificados: true,
        mensaje: 'Pack asignado exitosamente sin conflictos'
      };
    });
  }

  async cancelarAsignacion({ asignacionId }: { asignacionId: string }) {
    return this.dataSource.transaction(async (manager) => {
      const asignacion = await manager.findOne(PackAsignacion, { where: { id: asignacionId } });
      if (!asignacion) throw new NotFoundException('Asignación no encontrada');

      asignacion.estado = EstadoPackAsignacion.CANCELADA;
      await manager.save(asignacion);

      // Cancelar reservas futuras asociadas
      const hoy = new Date();
      await manager.update(Reserva, { packAsignacionId: asignacionId, fecha: Between(hoy, new Date(2999,11,31)) }, { estado: EstadoReserva.CANCELADA });

      return { ok: true };
    });
  }

  async cancelarPack(dto: CancelarPackDto) {
    return this.dataSource.transaction(async (manager) => {
      const asignacion = await manager.findOne(PackAsignacion, { 
        where: { id: dto.asignacionId },
        relations: ['usuario']
      });
      if (!asignacion) throw new NotFoundException('Asignación de pack no encontrada');

      // Verificar que la asignación esté activa
      if (asignacion.estado === EstadoPackAsignacion.CANCELADA) {
        throw new BadRequestException('El pack ya está cancelado');
      }

      // Marcar la asignación como cancelada
      asignacion.estado = EstadoPackAsignacion.CANCELADA;
      await manager.save(asignacion);

      // Calcular la fecha de cancelación efectiva
      const hoy = new Date();
      let fechaCancelacionEfectiva: Date;

      // Si se cancela hasta el día 15, el pack es válido para todo el mes
      if (hoy.getDate() <= 15) {
        // Si es antes del día 15, cancelar desde el próximo mes
        fechaCancelacionEfectiva = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1);
      } else {
        // Si es después del día 15, cancelar desde el mes siguiente
        fechaCancelacionEfectiva = new Date(hoy.getFullYear(), hoy.getMonth() + 2, 1);
      }

      // Cancelar todas las reservas futuras relacionadas al pack y usuario
      const reservasCanceladas = await manager.update(
        Reserva, 
        { 
          packAsignacionId: dto.asignacionId,
          psicologoId: asignacion.usuarioId,
          fecha: Between(fechaCancelacionEfectiva, new Date(2999, 11, 31))
        }, 
        { 
          estado: EstadoReserva.CANCELADA 
        }
      );

      return { 
        ok: true,
        mensaje: `Pack cancelado exitosamente. Las reservas a partir del ${fechaCancelacionEfectiva.toLocaleDateString()} han sido canceladas.`,
        fechaCancelacionEfectiva,
        reservasCanceladas: reservasCanceladas.affected || 0
      };
    });
  }

  async getPacksByUsuario(usuarioId: string) {
    // Verificar que el usuario existe
    const usuario = await this.userRepo.findOne({ where: { id: usuarioId } });
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Obtener todas las asignaciones del usuario con sus relaciones
    const asignaciones = await this.asignacionRepo.find({
      where: { usuarioId },
      relations: ['pack', 'horarios', 'horarios.box', 'horarios.box.sede'],
      order: { createdAt: 'DESC' }
    });

    // Mapear las asignaciones a un formato más útil
    const packsDelUsuario = asignaciones.map(asignacion => ({
      asignacionId: asignacion.id,
      estado: asignacion.estado,
      recurrente: asignacion.recurrente,
      fechaAsignacion: asignacion.createdAt,
      pack: {
        id: asignacion.pack.id,
        nombre: asignacion.pack.nombre,
        horas: asignacion.pack.horas,
        precio: asignacion.pack.precio,
        activo: asignacion.pack.activo
      },
      horarios: asignacion.horarios.map(horario => ({
        id: horario.id,
        diaSemana: horario.diaSemana,
        diaSemanaNombre: this.getDiaSemanaNombre(horario.diaSemana),
        horaInicio: horario.horaInicio,
        horaFin: horario.horaFin,
        box: {
          id: horario.box.id,
          nombre: horario.box.nombre,
          sede: {
            id: horario.box.sede.id,
            nombre: horario.box.sede.nombre,
            direccion: horario.box.sede.direccion,
            ciudad: horario.box.sede.ciudad
          }
        }
      })),
      estadisticas: {
        totalHorarios: asignacion.horarios.length,
        diasSemana: [...new Set(asignacion.horarios.map(h => h.diaSemana))],
        boxesUtilizados: [...new Set(asignacion.horarios.map(h => h.boxId))]
      }
    }));

    return {
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email
      },
      packs: packsDelUsuario,
      resumen: {
        totalPacks: packsDelUsuario.length,
        packsActivos: packsDelUsuario.filter(p => p.estado === EstadoPackAsignacion.ACTIVA).length,
        packsCancelados: packsDelUsuario.filter(p => p.estado === EstadoPackAsignacion.CANCELADA).length,
        totalHorarios: packsDelUsuario.reduce((sum, p) => sum + p.estadisticas.totalHorarios, 0)
      }
    };
  }

  private getDiaSemanaNombre(diaSemana: number): string {
    const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    return dias[diaSemana - 1] || 'Desconocido';
  }

  private async verificarConflictosReservas(horarios: any[], fechaLimite?: string): Promise<any[]> {
    const conflictos: any[] = [];
    const start = new Date();
    let end: Date;

    // Calcular fecha fin igual que en generarReservasRecurrencia
    if (fechaLimite) {
      end = new Date(fechaLimite);
      if (end < start) return conflictos; // Si es fecha pasada, no hay conflictos futuros
    } else {
      end = new Date();
      end.setDate(end.getDate() + 84); // 3 meses
    }

    // Para cada horario, verificar conflictos en todas las fechas futuras
    for (const horario of horarios) {
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dow = ((d.getDay() + 6) % 7) + 1; // JS: 0=Dom, convertimos a 1=Lun..7=Dom
        
        if (horario.diaSemana !== dow) continue;

        const fecha = new Date(d);
        
        // Buscar reservas existentes que puedan conflictuar
        const reservasExistentes = await this.reservaRepo.find({
          where: {
            boxId: horario.boxId,
            fecha: fecha,
            estado: EstadoReserva.CONFIRMADA, // Solo reservas confirmadas pueden conflictuar
          },
          relations: ['box', 'psicologo']
        });

        // Verificar si hay solapamiento de horarios
        for (const reservaExistente of reservasExistentes) {
          if (this.haySolapamientoHorarios(
            horario.horaInicio, 
            horario.horaFin, 
            reservaExistente.horaInicio, 
            reservaExistente.horaFin
          )) {
            conflictos.push({
              fecha: fecha.toISOString().split('T')[0],
              diaSemana: this.getDiaSemanaNombre(horario.diaSemana),
              boxId: horario.boxId,
              boxNombre: reservaExistente.box?.nombre || `Box ${reservaExistente.boxId}`,
              horarioSolicitado: `${horario.horaInicio} - ${horario.horaFin}`,
              horarioExistente: `${reservaExistente.horaInicio} - ${reservaExistente.horaFin}`,
              psicologoExistente: {
                id: reservaExistente.psicologoId,
                nombre: reservaExistente.psicologo?.nombre || 'Desconocido',
                email: reservaExistente.psicologo?.email || 'N/A'
              },
              reservaExistenteId: reservaExistente.id
            });
          }
        }
      }
    }

    return conflictos;
  }

  private haySolapamientoHorarios(inicio1: string, fin1: string, inicio2: string, fin2: string): boolean {
    // Convertir horarios a minutos para facilitar comparación
    const minutos1Inicio = this.horarioAMinutos(inicio1);
    const minutos1Fin = this.horarioAMinutos(fin1);
    const minutos2Inicio = this.horarioAMinutos(inicio2);
    const minutos2Fin = this.horarioAMinutos(fin2);

    // Verificar solapamiento: si un horario empieza antes de que termine el otro
    return (minutos1Inicio < minutos2Fin && minutos1Fin > minutos2Inicio);
  }

  private horarioAMinutos(horario: string): number {
    const [horas, minutos] = horario.split(':').map(Number);
    return horas * 60 + minutos;
  }

  private generarMensajeConflictos(conflictos: any[]): string {
    if (conflictos.length === 0) return '';

    let mensaje = `Existen ${conflictos.length} conflicto${conflictos.length > 1 ? 's' : ''} de reservas:\n\n`;
    
    // Definir tipo para el grupo de conflictos
    interface GrupoConflictos {
      diaSemana: string;
      boxNombre: string;
      horariosSolicitados: Set<string>;
      horariosExistentes: Set<string>;
      psicologos: Set<string>;
      fechas: Set<string>;
    }
    
    // Agrupar conflictos por día de la semana y box para mejor legibilidad
    const conflictosAgrupados: { [key: string]: GrupoConflictos } = {};
    
    conflictos.forEach(conflicto => {
      const clave = `${conflicto.diaSemana}-${conflicto.boxId}`;
      if (!conflictosAgrupados[clave]) {
        conflictosAgrupados[clave] = {
          diaSemana: conflicto.diaSemana,
          boxNombre: conflicto.boxNombre,
          horariosSolicitados: new Set(),
          horariosExistentes: new Set(),
          psicologos: new Set(),
          fechas: new Set()
        };
      }
      
      conflictosAgrupados[clave].horariosSolicitados.add(conflicto.horarioSolicitado);
      conflictosAgrupados[clave].horariosExistentes.add(conflicto.horarioExistente);
      conflictosAgrupados[clave].psicologos.add(conflicto.psicologoExistente.nombre);
      conflictosAgrupados[clave].fechas.add(conflicto.fecha);
    });

    // Generar mensaje agrupado
    Object.values(conflictosAgrupados).forEach((grupo: GrupoConflictos, index: number) => {
      mensaje += `${index + 1}. ${grupo.diaSemana} en Box "${grupo.boxNombre}":\n`;
      
      // Mostrar horarios solicitados
      const horariosSolicitados = Array.from(grupo.horariosSolicitados).sort();
      mensaje += `   Horarios solicitados: ${horariosSolicitados.join(', ')}\n`;
      
      // Mostrar horarios existentes
      const horariosExistentes = Array.from(grupo.horariosExistentes).sort();
      mensaje += `   Horarios ocupados: ${horariosExistentes.join(', ')}\n`;
      
      // Mostrar psicólogos involucrados
      const psicologos = Array.from(grupo.psicologos);
      mensaje += `   Psicólogos: ${psicologos.join(', ')}\n`;
      
      // Mostrar rango de fechas afectadas
      const fechas = Array.from(grupo.fechas).sort();
      if (fechas.length === 1) {
        mensaje += `   Fecha: ${fechas[0]}\n`;
      } else {
        mensaje += `   Fechas: ${fechas[0]} a ${fechas[fechas.length - 1]} (${fechas.length} fechas)\n`;
      }
      
      mensaje += '\n';
    });

    mensaje += 'Por favor, ajuste los horarios solicitados para evitar estos conflictos.';
    
    return mensaje;
  }

  private async generarReservasRecurrencia(manager: any, asignacionId: string, usuarioId: string, fechaLimite?: string) {
    const asignacion = await manager.findOne(PackAsignacion, { where: { id: asignacionId }, relations: ['horarios'] });
    if (!asignacion) throw new NotFoundException('Asignación no encontrada');

    const start = new Date();
    let end: Date;

    // Si se especifica una fecha límite, usarla; sino usar 3 meses por defecto
    if (fechaLimite) {
      end = new Date(fechaLimite);
      
      // Validar que la fecha límite no sea en el pasado
      if (end < start) {
        throw new BadRequestException('La fecha límite no puede ser anterior a la fecha actual');
      }
      
      // Validar que la fecha límite no sea muy lejana (máximo 1 año)
      const maxDate = new Date();
      maxDate.setFullYear(maxDate.getFullYear() + 1);
      if (end > maxDate) {
        throw new BadRequestException('La fecha límite no puede ser mayor a 1 año desde hoy');
      }
    } else {
      // Por defecto: 3 meses (12 semanas)
      end = new Date();
      end.setDate(end.getDate() + 84);
    }

    const reservas: Reserva[] = [];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dow = ((d.getDay() + 6) % 7) + 1; // JS: 0=Dom, convertimos a 1=Lun..7=Dom
      for (const h of asignacion.horarios) {
        if (h.diaSemana !== dow) continue;
        const fecha = new Date(d);
        const reserva = manager.create(Reserva, {
          boxId: h.boxId,
          psicologoId: usuarioId,
          fecha,
          horaInicio: h.horaInicio,
          horaFin: h.horaFin,
          estado: EstadoReserva.CONFIRMADA,
          estadoPago: EstadoPagoReserva.PENDIENTE_PAGO,
          precio: 0, // puede calcularse por box si hay tarifario
          packAsignacionId: asignacionId,
        });
        reservas.push(reserva);
      }
    }

    if (reservas.length) {
      await manager.save(reservas);
    }

    return {
      reservasGeneradas: reservas.length,
      fechaInicio: start,
      fechaFin: end,
      fechaLimiteUsada: fechaLimite || '3 meses por defecto'
    };
  }

  private async generarPagosMensuales(manager: any, asignacionId: string, usuarioId: string, precioPack: number, fechaLimite?: string): Promise<void> {
    const start = new Date();
    let end: Date;

    // Calcular fecha fin igual que en generarReservasRecurrencia
    if (fechaLimite) {
      end = new Date(fechaLimite);
      if (end < start) return; // Si es fecha pasada, no generar pagos
    } else {
      end = new Date();
      end.setDate(end.getDate() + 84); // 3 meses
    }

    const pagosMensuales: PackPagoMensual[] = [];
    const fechaActual = new Date(start);

    // Generar pagos para cada mes en el rango
    while (fechaActual <= end) {
      const mes = fechaActual.getMonth() + 1; // 1-12
      const año = fechaActual.getFullYear();
      
      // Calcular fecha de vencimiento (último día del mes)
      const fechaVencimiento = new Date(año, mes, 0); // Último día del mes

      const pagoMensual = manager.create(PackPagoMensual, {
        asignacionId,
        usuarioId,
        mes,
        año,
        monto: precioPack,
        montoPagado: 0,
        montoReembolsado: 0,
        estado: EstadoPagoPackMensual.PENDIENTE_PAGO,
        fechaPago: null,
        fechaVencimiento,
        observaciones: null,
        metodoPago: null,
        referenciaPago: null
      });

      pagosMensuales.push(pagoMensual);

      // Avanzar al siguiente mes
      fechaActual.setMonth(fechaActual.getMonth() + 1);
    }

    if (pagosMensuales.length > 0) {
      await manager.save(pagosMensuales);
    }
  }

  async marcarPagoMensual(pagoId: string, datosPago: {
    montoPagado: number;
    metodoPago?: string;
    referenciaPago?: string;
    observaciones?: string;
  }): Promise<any> {
    return this.dataSource.transaction(async (manager) => {
      const pago = await manager.findOne(PackPagoMensual, { 
        where: { id: pagoId },
        relations: ['asignacion', 'asignacion.pack']
      });

      if (!pago) {
        throw new NotFoundException('Pago mensual no encontrado');
      }

      if (pago.estado !== EstadoPagoPackMensual.PENDIENTE_PAGO) {
        throw new BadRequestException('El pago ya fue procesado');
      }

      // Actualizar pago
      pago.montoPagado = datosPago.montoPagado;
      pago.estado = EstadoPagoPackMensual.PAGADO;
      pago.fechaPago = new Date();
      pago.metodoPago = datosPago.metodoPago || null;
      pago.referenciaPago = datosPago.referenciaPago || null;
      pago.observaciones = datosPago.observaciones || null;

      const pagoActualizado = await manager.save(pago);

      // 🎯 NUEVA FUNCIONALIDAD: Actualizar automáticamente las reservas del pack
      const fechaInicio = new Date(pago.año, pago.mes - 1, 1); // Mes en 0-indexed
      const fechaFin = new Date(pago.año, pago.mes, 0, 23, 59, 59); // Último día del mes

      // Buscar todas las reservas del pack para ese mes
      const reservasDelPack = await manager.find(Reserva, {
        where: {
          packAsignacionId: pago.asignacionId,
          fecha: Between(fechaInicio, fechaFin)
        }
      });

      // Actualizar estado de pago de todas las reservas del pack
      let reservasActualizadas = 0;
      if (reservasDelPack.length > 0) {
        await manager.update(Reserva, 
          { 
            packAsignacionId: pago.asignacionId,
            fecha: Between(fechaInicio, fechaFin)
          },
          { 
            estadoPago: EstadoPagoReserva.PAGADO,
            updatedAt: new Date()
          }
        );
        reservasActualizadas = reservasDelPack.length;
      }

      return {
        message: 'Pago mensual marcado como pagado correctamente',
        pago: pagoActualizado,
        asignacion: {
          id: pago.asignacion.id,
          estado: pago.asignacion.estado,
        pack: {
          id: pago.asignacion.pack?.id,
          nombre: pago.asignacion.pack?.nombre,
          precio: pago.asignacion.pack?.precio
        }
        },
        reservasAfectadas: {
          total: reservasActualizadas,
          mes: `${pago.año}-${pago.mes.toString().padStart(2, '0')}`,
          estado: 'Todas las reservas del pack de este mes ahora se consideran pagadas'
        }
      };
    });
  }

  async reembolsarPagoMensual(pagoId: string, montoReembolsado: number, observaciones?: string): Promise<PackPagoMensual> {
    return this.dataSource.transaction(async (manager) => {
      const pago = await manager.findOne(PackPagoMensual, { 
        where: { id: pagoId },
        relations: ['asignacion', 'asignacion.pack']
      });

      if (!pago) {
        throw new NotFoundException('Pago mensual no encontrado');
      }

      if (pago.estado !== EstadoPagoPackMensual.PAGADO) {
        throw new BadRequestException('Solo se pueden reembolsar pagos que estén marcados como pagados');
      }

      if (montoReembolsado > pago.montoPagado) {
        throw new BadRequestException('El monto a reembolsar no puede ser mayor al monto pagado');
      }

      // Actualizar pago
      pago.montoReembolsado = montoReembolsado;
      pago.estado = EstadoPagoPackMensual.REEMBOLSADO;
      pago.observaciones = observaciones || pago.observaciones;

      return await manager.save(pago);
    });
  }

  async getPagosMensualesPorAsignacion(asignacionId: string): Promise<PackPagoMensual[]> {
    return this.pagoMensualRepo.find({
      where: { asignacionId },
      order: { año: 'ASC', mes: 'ASC' }
    });
  }

  async getPagosMensualesPorUsuario(usuarioId: string, mes?: string): Promise<PackPagoMensual[]> {
    const whereCondition: any = { usuarioId };
    
    if (mes) {
      const [año, mesNumero] = mes.split('-').map(Number);
      whereCondition.año = año;
      whereCondition.mes = mesNumero;
    }

    return this.pagoMensualRepo.find({
      where: whereCondition,
      relations: ['asignacion', 'asignacion.pack'],
      order: { año: 'DESC', mes: 'DESC' }
    });
  }

  async getPagosPendientes(): Promise<PackPagoMensual[]> {
    const hoy = new Date();
    return this.pagoMensualRepo.find({
      where: {
        estado: EstadoPagoPackMensual.PENDIENTE_PAGO,
        fechaVencimiento: Between(new Date(2020, 0, 1), hoy) // Pagos vencidos hasta hoy
      },
      relations: ['asignacion', 'asignacion.pack', 'usuario'],
      order: { fechaVencimiento: 'ASC' }
    });
  }
}


