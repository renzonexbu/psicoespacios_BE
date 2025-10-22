import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { Disponibilidad } from '../entities/disponibilidad.entity';
import { Box } from '../../common/entities/box.entity';
import { Reserva, EstadoReserva } from '../../common/entities/reserva.entity';
import { ReservaPsicologo, EstadoReservaPsicologo } from '../../common/entities/reserva-psicologo.entity';
import { Psicologo } from '../../common/entities/psicologo.entity';
import { Sede } from '../../common/entities/sede.entity';
import { User } from '../../common/entities/user.entity';
import { 
  AgendaDisponibilidadDto, 
  AgendaResponseDto, 
  DisponibilidadSlotDto,
  PsicologoDisponibilidadDto,
  PsicologoDisponibilidadResponseDto
} from '../dto/agenda-disponibilidad.dto';

@Injectable()
export class AgendaService {
  constructor(
    @InjectRepository(Disponibilidad)
    private disponibilidadRepository: Repository<Disponibilidad>,
    @InjectRepository(Box)
    private boxRepository: Repository<Box>,
    @InjectRepository(Reserva)
    private reservaRepository: Repository<Reserva>,
    @InjectRepository(ReservaPsicologo)
    private reservaPsicologoRepository: Repository<ReservaPsicologo>,
    @InjectRepository(Psicologo)
    private psicologoRepository: Repository<Psicologo>,
    @InjectRepository(Sede)
    private sedeRepository: Repository<Sede>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // Método existente para agenda completa (con boxes)
  async getAgendaDisponibilidad(query: AgendaDisponibilidadDto): Promise<AgendaResponseDto> {
    // 1. Verificar que el psicólogo existe
    const psicologo = await this.psicologoRepository.findOne({
      where: { id: query.psicologoId },
      relations: ['usuario']
    });

    if (!psicologo) {
      throw new NotFoundException('Psicólogo no encontrado');
    }

    // 2. Obtener la disponibilidad del psicólogo
    const disponibilidad = await this.disponibilidadRepository.find({
      where: { 
        psicologo: { id: psicologo.usuario.id },
        active: true 
      }
    });

    console.log('Disponibilidad encontrada:', disponibilidad.map(d => ({ day: d.day, hours: d.hours, sede_id: d.sede_id })));

    if (disponibilidad.length === 0) {
      throw new BadRequestException('El psicólogo no tiene disponibilidad configurada');
    }

    // 3. Obtener boxes disponibles según la sede
    let boxes: Box[] = [];
    if (query.sedeId && query.sedeId !== 'online') {
      boxes = await this.boxRepository.find({
        where: { 
          sede: { id: query.sedeId },
          estado: 'DISPONIBLE'
        },
        relations: ['sede']
      });
    }

    // 4. Generar slots de disponibilidad
    const slots = await this.generateDisponibilidadSlots(
      query,
      disponibilidad,
      boxes,
      psicologo
    );

    // 5. Verificar reservas existentes
    const slotsConReservas = await this.checkReservasExistentes(slots, query.psicologoId);

    return {
      psicologoId: query.psicologoId,
      psicologoNombre: `${psicologo.usuario.nombre} ${psicologo.usuario.apellido}`,
      fechaInicio: query.fechaInicio,
      fechaFin: query.fechaFin,
      slots: slotsConReservas,
      totalSlots: slotsConReservas.length,
      slotsDisponibles: slotsConReservas.filter(slot => slot.disponible).length
    };
  }

  // Nuevo método para disponibilidad del psicólogo (sin boxes)
  async getPsicologoDisponibilidad(query: PsicologoDisponibilidadDto): Promise<PsicologoDisponibilidadResponseDto> {
    // 1. Verificar que el psicólogo existe
    const psicologo = await this.psicologoRepository.findOne({
      where: { id: query.psicologoId },
      relations: ['usuario']
    });

    if (!psicologo) {
      throw new NotFoundException('Psicólogo no encontrado');
    }

    // 2. Obtener la disponibilidad del psicólogo
    const disponibilidad = await this.disponibilidadRepository.find({
      where: { 
        psicologo: { id: psicologo.usuario.id },
        active: true 
      }
    });

    console.log('Disponibilidad psicólogo encontrada:', disponibilidad.map(d => ({ day: d.day, hours: d.hours, sede_id: d.sede_id })));

    if (disponibilidad.length === 0) {
      throw new BadRequestException('El psicólogo no tiene disponibilidad configurada');
    }

    // 3. Filtrar disponibilidad por modalidad si se especifica
    let disponibilidadFiltrada = disponibilidad;
    if (query.modalidad) {
      if (query.modalidad === 'online') {
        // Para online, solo incluir disponibilidad donde sede_id sea 'online'
        disponibilidadFiltrada = disponibilidad.filter(d => d.sede_id === 'online');
        console.log(`Filtrado para modalidad ONLINE: ${disponibilidadFiltrada.length} días disponibles`);
      } else if (query.modalidad === 'presencial') {
        // Para presencial, solo incluir disponibilidad donde sede_id sea un UUID (no 'online')
        disponibilidadFiltrada = disponibilidad.filter(d => d.sede_id && d.sede_id !== 'online');
        console.log(`Filtrado para modalidad PRESENCIAL: ${disponibilidadFiltrada.length} días disponibles`);
      }
    }

    // 4. Generar slots solo del psicólogo (sin boxes)
    const slots = await this.generatePsicologoSlots(
      query,
      disponibilidadFiltrada,
      psicologo
    );

    // 5. Verificar reservas existentes del psicólogo
    const slotsConReservas = await this.checkReservasPsicologo(slots, query.psicologoId);

    return {
      psicologoId: query.psicologoId,
      psicologoNombre: `${psicologo.usuario.nombre} ${psicologo.usuario.apellido}`,
      fechaInicio: query.fechaInicio,
      fechaFin: query.fechaFin,
      slots: slotsConReservas,
      totalSlots: slotsConReservas.length,
      slotsDisponibles: slotsConReservas.filter(slot => slot.disponible).length
    };
  }

  private normalizarDia(dia: string): string {
    const normalizaciones = {
      'lunes': 'Lunes',
      'martes': 'Martes', 
      'miércoles': 'Miércoles',
      'miercoles': 'Miércoles',
      'jueves': 'Jueves',
      'viernes': 'Viernes',
      'sábado': 'Sábado',
      'sabado': 'Sábado',
      'domingo': 'Domingo',
      'LUNES': 'Lunes',
      'MARTES': 'Martes',
      'MIÉRCOLES': 'Miércoles',
      'MIERCOLES': 'Miércoles',
      'JUEVES': 'Jueves',
      'VIERNES': 'Viernes',
      'SÁBADO': 'Sábado',
      'SABADO': 'Sábado',
      'DOMINGO': 'Domingo'
    };
    
    return normalizaciones[dia.toLowerCase()] || dia;
  }

  private crearFechaLocal(fechaString: string): Date {
    // Crear fecha en zona horaria local para evitar desplazamientos
    const [year, month, day] = fechaString.split('-').map(Number);
    return new Date(year, month - 1, day); // month - 1 porque los meses van de 0-11
  }

  // Método para generar slots solo del psicólogo (sin boxes)
  private async generatePsicologoSlots(
    query: PsicologoDisponibilidadDto,
    disponibilidad: Disponibilidad[],
    psicologo: Psicologo
  ): Promise<DisponibilidadSlotDto[]> {
    const slots: DisponibilidadSlotDto[] = [];
    const fechaInicio = this.crearFechaLocal(query.fechaInicio);
    const fechaFin = this.crearFechaLocal(query.fechaFin);

    // Mapeo correcto de días de la semana (getDay() devuelve 0=Domingo, 1=Lunes, etc.)
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    console.log('Días disponibles en la base de datos:', disponibilidad.map(d => d.day));
    console.log('Rango de fechas:', query.fechaInicio, 'a', query.fechaFin);

    // Obtener información de sedes para validación de horarios
    const sedesMap = new Map<string, Sede>();
    const sedeIds = [...new Set(disponibilidad.map(d => d.sede_id).filter(id => id && id !== 'online'))];
    
    if (sedeIds.length > 0) {
      const sedes = await this.sedeRepository.find({
        where: { id: In(sedeIds) }
      });
      sedes.forEach(sede => sedesMap.set(sede.id, sede));
      console.log(`📋 Sedes cargadas para validación: ${sedes.map(s => s.nombre).join(', ')}`);
    }

    // Corregir el bucle para evitar mutación del objeto Date
    for (let fecha = new Date(fechaInicio); fecha <= fechaFin; fecha = new Date(fecha.getTime() + 24 * 60 * 60 * 1000)) {
      const diaSemana = diasSemana[fecha.getDay()];
      const fechaString = fecha.toISOString().split('T')[0];
      console.log(`Fecha: ${fechaString}, Día: ${diaSemana}, getDay(): ${fecha.getDay()}`);
      
      // Buscar disponibilidad con normalización
      const disponibilidadDia = disponibilidad.find(d => 
        this.normalizarDia(d.day) === diaSemana || d.day === diaSemana
      );
      
      if (disponibilidadDia) {
        console.log(`✅ Encontrada disponibilidad para ${diaSemana}:`, disponibilidadDia.hours);
      } else {
        console.log(`❌ No hay disponibilidad para ${diaSemana}`);
      }

      if (disponibilidadDia && disponibilidadDia.hours) {
        for (const hora of disponibilidadDia.hours) {
          const horaInicio = hora;
          const horaFin = this.calcularHoraFin(hora);

          // Determinar modalidad basada en sede_id
          const modalidadSlot = disponibilidadDia.sede_id === 'online' ? 'online' : 'presencial';
          
          // Para modalidad presencial, validar horarios de sede
          if (modalidadSlot === 'presencial' && disponibilidadDia.sede_id && disponibilidadDia.sede_id !== 'online') {
            const sede = sedesMap.get(disponibilidadDia.sede_id);
            if (sede) {
              const esHorarioValido = this.esHorarioValidoParaSede(horaInicio, horaFin, sede, diaSemana);
              if (!esHorarioValido) {
                console.log(`⏰ Slot ${horaInicio}-${horaFin} filtrado: fuera del horario de atención de ${sede.nombre}`);
                continue; // Saltar este slot
              }
            } else {
              console.log(`⚠️ Sede ${disponibilidadDia.sede_id} no encontrada para validación de horarios`);
            }
          }
          
          slots.push({
            fecha: fechaString,
            horaInicio,
            horaFin,
            disponible: true,
            modalidad: modalidadSlot,
            sedeId: disponibilidadDia.sede_id
          });
        }
      }
    }

    console.log('Total de slots del psicólogo generados:', slots.length);
    return slots;
  }

  // Método para verificar reservas solo del psicólogo
  private async checkReservasPsicologo(
    slots: DisponibilidadSlotDto[],
    psicologoId: string
  ): Promise<DisponibilidadSlotDto[]> {
    const slotsActualizados = [...slots];
    console.log(`🔍 Verificando reservas para psicólogo: ${psicologoId}`);
    console.log(`📅 Total de slots a verificar: ${slotsActualizados.length}`);

    for (const slot of slotsActualizados) {
      // Convertir string de fecha a Date usando la función local
      const fechaDate = this.crearFechaLocal(slot.fecha);
      console.log(`\n📋 Verificando slot: ${slot.fecha} ${slot.horaInicio}-${slot.horaFin}`);
      console.log(`📅 Fecha convertida: ${fechaDate.toISOString()}`);
      
      // 1. Verificar reservas de boxes existentes para este slot del psicólogo
      const reservasBoxes = await this.reservaRepository.find({
        where: {
          psicologoId,
          fecha: fechaDate,
          estado: EstadoReserva.CONFIRMADA
        }
      });

      // También verificar reservas confirmadas de boxes
      const reservasBoxesConfirmadas = await this.reservaRepository.find({
        where: {
          psicologoId,
          fecha: fechaDate,
          estado: EstadoReserva.CONFIRMADA
        }
      });

      // Combinar ambas listas de reservas de boxes
      const todasLasReservasBoxes = [...reservasBoxes, ...reservasBoxesConfirmadas];
      console.log(`📦 Reservas de boxes encontradas: ${todasLasReservasBoxes.length}`);

      // 2. Verificar reservas de sesiones existentes para este slot del psicólogo
      console.log(`🔍 Buscando reservas de sesiones para fecha: ${fechaDate.toISOString()}, psicólogo: ${psicologoId}`);
      
      // Usar query builder para más control y debugging
      const reservasSesionesQuery = this.reservaPsicologoRepository
        .createQueryBuilder('reserva')
        .where('reserva.psicologo_id = :psicologoId', { psicologoId })
        .andWhere('reserva.fecha = :fecha', { fecha: fechaDate })
        .andWhere('reserva.estado = :estado', { estado: 'confirmada' });

      console.log(`🔍 Query SQL generada: ${reservasSesionesQuery.getSql()}`);
      console.log(`🔍 Parámetros: ${JSON.stringify(reservasSesionesQuery.getParameters())}`);

      const reservasSesiones = await reservasSesionesQuery.getMany();

      // También verificar reservas pendientes (que ya están agendadas)
      const reservasPendientesQuery = this.reservaPsicologoRepository
        .createQueryBuilder('reserva')
        .where('reserva.psicologo_id = :psicologoId', { psicologoId })
        .andWhere('reserva.fecha = :fecha', { fecha: fechaDate })
        .andWhere('reserva.estado = :estado', { estado: 'pendiente' });

      const reservasPendientes = await reservasPendientesQuery.getMany();
      
      // Debug: Mostrar query SQL generado
      console.log(`🔍 Query SQL para reservas confirmadas: ${reservasSesionesQuery.getSql()}`);
      console.log(`🔍 Query SQL para reservas pendientes: ${reservasPendientesQuery.getSql()}`);

      // Combinar ambas listas de reservas
      const todasLasReservasSesiones = [...reservasSesiones, ...reservasPendientes];
      console.log(`💼 Reservas de sesiones encontradas: ${todasLasReservasSesiones.length}`);
      
      if (todasLasReservasSesiones.length > 0) {
        console.log(`📝 Detalles de reservas de sesiones:`);
        todasLasReservasSesiones.forEach((reserva, index) => {
          // Manejar tanto Date como string
          const fechaReserva = reserva.fecha instanceof Date ? reserva.fecha : new Date(reserva.fecha);
          console.log(`   ${index + 1}. Fecha: ${reserva.fecha} (tipo: ${typeof reserva.fecha}), Hora: ${reserva.horaInicio}-${reserva.horaFin}, Estado: ${reserva.estado}`);
          console.log(`      📅 Fecha ISO: ${fechaReserva.toISOString()}, Fecha local: ${fechaReserva.toLocaleDateString()}`);
        });
      } else {
        console.log(`📝 No se encontraron reservas para esta fecha`);
      }

      // Marcar como no disponible si hay conflicto de horarios con reservas de boxes
      const hayConflictoBoxes = todasLasReservasBoxes.some(reserva => {
        const hayConflicto = this.hayConflictoHorarios(
          reserva.horaInicio, 
          reserva.horaFin, 
          slot.horaInicio, 
          slot.horaFin
        );
        if (hayConflicto) {
          console.log(`   🔴 Conflicto con reserva de box: ${reserva.horaInicio}-${reserva.horaFin} vs ${slot.horaInicio}-${slot.horaFin}`);
        }
        return hayConflicto;
      });

      // Marcar como no disponible si hay conflicto de horarios con reservas de sesiones
      const hayConflictoSesiones = todasLasReservasSesiones.some(reserva => {
        const hayConflicto = this.hayConflictoHorarios(
          reserva.horaInicio, 
          reserva.horaFin, 
          slot.horaInicio, 
          slot.horaFin
        );
        if (hayConflicto) {
          console.log(`   🔴 Conflicto con reserva de sesión: ${reserva.horaInicio}-${reserva.horaFin} vs ${slot.horaInicio}-${slot.horaFin}`);
        }
        return hayConflicto;
      });

      console.log(`🔍 Conflicto con boxes: ${hayConflictoBoxes}, Conflicto con sesiones: ${hayConflictoSesiones}`);

      if (hayConflictoBoxes || hayConflictoSesiones) {
        slot.disponible = false;
        const tipoConflicto = hayConflictoBoxes ? 'reserva de box' : 'reserva de sesión';
        console.log(`❌ Slot no disponible: ${slot.fecha} ${slot.horaInicio}-${slot.horaFin} (conflicto con ${tipoConflicto} existente)`);
      } else {
        console.log(`✅ Slot disponible: ${slot.fecha} ${slot.horaInicio}-${slot.horaFin}`);
      }
    }

    console.log(`\n📊 Resumen final:`);
    const slotsDisponibles = slotsActualizados.filter(slot => slot.disponible).length;
    const slotsNoDisponibles = slotsActualizados.filter(slot => !slot.disponible).length;
    console.log(`   ✅ Slots disponibles: ${slotsDisponibles}`);
    console.log(`   ❌ Slots no disponibles: ${slotsNoDisponibles}`);

    return slotsActualizados;
  }

  private async generateDisponibilidadSlots(
    query: AgendaDisponibilidadDto,
    disponibilidad: Disponibilidad[],
    boxes: Box[],
    psicologo: Psicologo
  ): Promise<DisponibilidadSlotDto[]> {
    const slots: DisponibilidadSlotDto[] = [];
    const fechaInicio = this.crearFechaLocal(query.fechaInicio);
    const fechaFin = this.crearFechaLocal(query.fechaFin);

    // Mapeo correcto de días de la semana (getDay() devuelve 0=Domingo, 1=Lunes, etc.)
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    console.log('Días disponibles en la base de datos:', disponibilidad.map(d => d.day));
    console.log('Rango de fechas:', query.fechaInicio, 'a', query.fechaFin);
    console.log('Fecha inicio (Date):', fechaInicio.toISOString());
    console.log('Fecha fin (Date):', fechaFin.toISOString());

    // Corregir el bucle para evitar mutación del objeto Date
    for (let fecha = new Date(fechaInicio); fecha <= fechaFin; fecha = new Date(fecha.getTime() + 24 * 60 * 60 * 1000)) {
      const diaSemana = diasSemana[fecha.getDay()];
      const fechaString = fecha.toISOString().split('T')[0];
      console.log(`Fecha: ${fechaString}, Día: ${diaSemana}, getDay(): ${fecha.getDay()}`);
      
      // Buscar disponibilidad con normalización
      const disponibilidadDia = disponibilidad.find(d => 
        this.normalizarDia(d.day) === diaSemana || d.day === diaSemana
      );
      
      if (disponibilidadDia) {
        console.log(`✅ Encontrada disponibilidad para ${diaSemana}:`, disponibilidadDia.hours);
      } else {
        console.log(`❌ No hay disponibilidad para ${diaSemana}`);
      }

      if (disponibilidadDia && disponibilidadDia.hours) {
        for (const hora of disponibilidadDia.hours) {
          const horaInicio = hora;
          const horaFin = this.calcularHoraFin(hora);

          // Para modalidad online
          if (query.modalidad === 'online' || disponibilidadDia.sede_id === 'online') {
            slots.push({
              fecha: fechaString,
              horaInicio,
              horaFin,
              disponible: true,
              modalidad: 'online',
              sedeId: disponibilidadDia.sede_id
            });
          }

          // Para modalidad presencial
          if (query.modalidad === 'presencial' || (!query.modalidad && disponibilidadDia.sede_id !== 'online')) {
            if (boxes.length > 0) {
              // Crear un slot por cada box disponible
              for (const box of boxes) {
                // Validar horarios de sede para cada box
                if (box.sede) {
                  const esHorarioValido = this.esHorarioValidoParaSede(horaInicio, horaFin, box.sede, diaSemana);
                  if (!esHorarioValido) {
                    console.log(`⏰ Slot ${horaInicio}-${horaFin} filtrado para box ${box.numero}: fuera del horario de atención de ${box.sede.nombre}`);
                    continue; // Saltar este slot
                  }
                }

                slots.push({
                  fecha: fechaString,
                  horaInicio,
                  horaFin,
                  disponible: true,
                  boxId: box.id,
                  boxNumero: box.numero,
                  sedeId: box.sede?.id,
                  sedeNombre: box.sede?.nombre,
                  modalidad: 'presencial'
                });
              }
            } else if (disponibilidadDia.sede_id && disponibilidadDia.sede_id !== 'online') {
              // Si no se especificó sede pero el psicólogo tiene una configurada
              const sede = await this.sedeRepository.findOne({
                where: { id: disponibilidadDia.sede_id }
              });
              
              if (sede) {
                // Validar horarios de sede antes de buscar boxes
                const esHorarioValido = this.esHorarioValidoParaSede(horaInicio, horaFin, sede, diaSemana);
                if (!esHorarioValido) {
                  console.log(`⏰ Slot ${horaInicio}-${horaFin} filtrado: fuera del horario de atención de ${sede.nombre}`);
                  continue; // Saltar este slot
                }

                const boxesSede = await this.boxRepository.find({
                  where: { 
                    sede: { id: disponibilidadDia.sede_id },
                    estado: 'DISPONIBLE'
                  }
                });

                for (const box of boxesSede) {
                  slots.push({
                    fecha: fechaString,
                    horaInicio,
                    horaFin,
                    disponible: true,
                    boxId: box.id,
                    boxNumero: box.numero,
                    sedeId: sede.id,
                    sedeNombre: sede.nombre,
                    modalidad: 'presencial'
                  });
                }
              }
            }
          }
        }
      }
    }

    console.log('Total de slots generados:', slots.length);
    return slots;
  }

  private async checkReservasExistentes(
    slots: DisponibilidadSlotDto[],
    psicologoId: string
  ): Promise<DisponibilidadSlotDto[]> {
    const slotsActualizados = [...slots];

    for (const slot of slotsActualizados) {
      // Convertir string de fecha a Date usando la función local
      const fechaDate = this.crearFechaLocal(slot.fecha);
      
      // Verificar si hay reservas existentes para este slot
      const reservasExistentes = await this.reservaRepository.find({
        where: {
          psicologoId,
          fecha: fechaDate,
          estado: EstadoReserva.CONFIRMADA
        }
      });

      // Verificar si hay reservas para el box específico
      if (slot.boxId) {
        const reservasBox = await this.reservaRepository.find({
          where: {
            boxId: slot.boxId,
            fecha: fechaDate,
            estado: EstadoReserva.CONFIRMADA
          }
        });

        // Marcar como no disponible si hay conflicto de horarios
        const hayConflicto = reservasExistentes.some(reserva => 
          this.hayConflictoHorarios(
            reserva.horaInicio, 
            reserva.horaFin, 
            slot.horaInicio, 
            slot.horaFin
          )
        ) || reservasBox.some(reserva => 
          this.hayConflictoHorarios(
            reserva.horaInicio, 
            reserva.horaFin, 
            slot.horaInicio, 
            slot.horaFin
          )
        );

        if (hayConflicto) {
          slot.disponible = false;
        }
      } else {
        // Para modalidad online, solo verificar reservas del psicólogo
        const hayConflicto = reservasExistentes.some(reserva => 
          this.hayConflictoHorarios(
            reserva.horaInicio, 
            reserva.horaFin, 
            slot.horaInicio, 
            slot.horaFin
          )
        );

        if (hayConflicto) {
          slot.disponible = false;
        }
      }
    }

    return slotsActualizados;
  }

  private hayConflictoHorarios(
    inicio1: string, 
    fin1: string, 
    inicio2: string, 
    fin2: string
  ): boolean {
    const h1 = parseInt(inicio1.split(':')[0]);
    const m1 = parseInt(inicio1.split(':')[1]);
    const h2 = parseInt(fin1.split(':')[0]);
    const m2 = parseInt(fin1.split(':')[1]);
    
    const h3 = parseInt(inicio2.split(':')[0]);
    const m3 = parseInt(inicio2.split(':')[1]);
    const h4 = parseInt(fin2.split(':')[0]);
    const m4 = parseInt(fin2.split(':')[1]);

    const tiempo1 = h1 * 60 + m1;
    const tiempo2 = h2 * 60 + m2;
    const tiempo3 = h3 * 60 + m3;
    const tiempo4 = h4 * 60 + m4;

    return !(tiempo2 <= tiempo3 || tiempo4 <= tiempo1);
  }

  private calcularHoraFin(horaInicio: string): string {
    const [hora, minuto] = horaInicio.split(':').map(Number);
    const horaFin = new Date();
    horaFin.setHours(hora + 1, minuto, 0, 0);
    return `${horaFin.getHours().toString().padStart(2, '0')}:${horaFin.getMinutes().toString().padStart(2, '0')}`;
  }

  private esHorarioValidoParaSede(
    horaInicio: string, 
    horaFin: string, 
    sede: Sede, 
    diaSemana: string
  ): boolean {
    // Si no hay horario de atención configurado, permitir cualquier horario
    if (!sede.horarioAtencion || !sede.horarioAtencion.diasHabiles) {
      console.log(`⚠️ Sede ${sede.nombre} no tiene horario de atención configurado`);
      return true;
    }

    // Buscar el día de la semana en el horario de atención
    const diaHorario = sede.horarioAtencion.diasHabiles.find(dia => 
      this.normalizarDia(dia.dia) === this.normalizarDia(diaSemana)
    );

    // Si no se encuentra el día o está cerrado, no es válido
    if (!diaHorario || diaHorario.cerrado) {
      console.log(`❌ Sede ${sede.nombre} está cerrada el ${diaSemana}`);
      return false;
    }

    // Convertir horarios a minutos para comparación
    const horaInicioMinutos = this.convertirHoraAMinutos(horaInicio);
    const horaFinMinutos = this.convertirHoraAMinutos(horaFin);
    const sedeInicioMinutos = this.convertirHoraAMinutos(diaHorario.inicio);
    const sedeFinMinutos = this.convertirHoraAMinutos(diaHorario.fin);

    // Verificar si el horario del slot está dentro del horario de atención
    const esValido = horaInicioMinutos >= sedeInicioMinutos && horaFinMinutos <= sedeFinMinutos;
    
    console.log(`🔍 Validación horario sede ${sede.nombre} (${diaSemana}):`);
    console.log(`   Slot: ${horaInicio}-${horaFin} (${horaInicioMinutos}-${horaFinMinutos} min)`);
    console.log(`   Sede: ${diaHorario.inicio}-${diaHorario.fin} (${sedeInicioMinutos}-${sedeFinMinutos} min)`);
    console.log(`   Resultado: ${esValido ? '✅ Válido' : '❌ Fuera de horario'}`);

    return esValido;
  }

  private convertirHoraAMinutos(hora: string): number {
    const [horas, minutos] = hora.split(':').map(Number);
    return horas * 60 + minutos;
  }

  // Método para obtener box disponible
  async getBoxDisponible(query: any): Promise<any> {
    // Implementación básica - puedes personalizarla según tus necesidades
    const { sedeId, fecha, horaInicio, horaFin } = query;
    
    if (!sedeId || sedeId === 'online') {
      return null;
    }

    // Buscar boxes disponibles en la sede
    const boxes = await this.boxRepository.find({
      where: { 
        sede: { id: sedeId },
        estado: 'DISPONIBLE'
      }
    });

    if (boxes.length === 0) {
      return null;
    }

    // Verificar disponibilidad para la fecha y hora específicas
    const fechaDate = this.crearFechaLocal(fecha);
    
    for (const box of boxes) {
      // Verificar si el box está libre en ese horario
      const reservasExistentes = await this.reservaRepository.find({
        where: {
          boxId: box.id,
          fecha: fechaDate,
          estado: EstadoReserva.CONFIRMADA
        }
      });

      // Verificar también reservas de sesiones
      const reservasSesiones = await this.reservaPsicologoRepository.find({
        where: {
          boxId: box.id,
          fecha: fechaDate,
          estado: EstadoReservaPsicologo.CONFIRMADA
        }
      });

      const hayConflicto = reservasExistentes.some(reserva => 
        this.hayConflictoHorarios(
          reserva.horaInicio, 
          reserva.horaFin, 
          horaInicio, 
          horaFin
        )
      ) || reservasSesiones.some(reserva => 
        this.hayConflictoHorarios(
          reserva.horaInicio, 
          reserva.horaFin, 
          horaInicio, 
          horaFin
        )
      );

      if (!hayConflicto) {
        return {
          id: box.id,
          numero: box.numero,
          sedeId: box.sede?.id,
          sedeNombre: box.sede?.nombre
        };
      }
    }

    return null;
  }

  // Método para obtener box por ID
  async getBoxById(id: string): Promise<any> {
    const box = await this.boxRepository.findOne({
      where: { id },
      relations: ['sede']
    });

    if (!box) {
      throw new NotFoundException('Box no encontrado');
    }

    return {
      id: box.id,
      numero: box.numero,
      estado: box.estado,
      sedeId: box.sede?.id,
      sedeNombre: box.sede?.nombre
    };
  }
} 