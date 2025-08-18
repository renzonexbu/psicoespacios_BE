import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
  PsicologoDisponibilidadResponseDto,
  BoxDisponibleDto,
  BoxDisponibleResponseDto,
  BoxInfoResponseDto
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

    // 3. Generar slots solo del psicólogo (sin boxes)
    const slots = await this.generatePsicologoSlots(
      query,
      disponibilidad,
      psicologo
    );

    // 4. Verificar reservas existentes del psicólogo
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
    // Crear fecha en UTC para evitar problemas de zona horaria
    const [year, month, day] = fechaString.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day)); // month - 1 porque los meses van de 0-11
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

          // Solo generar slots para la modalidad especificada
          // Si se especifica modalidad=presencial, solo incluir sedes que NO sean online
          // Si se especifica modalidad=online, solo incluir sedes que SÍ sean online
          if (query.modalidad === 'presencial' && disponibilidadDia.sede_id === 'online') {
            continue; // Saltar slots online cuando se solicita presencial
          }
          
          if (query.modalidad === 'online' && disponibilidadDia.sede_id !== 'online') {
            continue; // Saltar slots presenciales cuando se solicita online
          }
          
                     // Si no se especifica modalidad, incluir todos los slots
           const modalidadSlot = disponibilidadDia.sede_id === 'online' ? 'online' : 'presencial';
           
           // Para slots presenciales, incluir información de la sede
           if (modalidadSlot === 'presencial' && disponibilidadDia.sede_id && disponibilidadDia.sede_id !== 'online') {
             slots.push({
               fecha: fechaString,
               horaInicio,
               horaFin,
               disponible: true,
               modalidad: modalidadSlot,
               sedeId: disponibilidadDia.sede_id
             });
           } else {
             slots.push({
               fecha: fechaString,
               horaInicio,
               horaFin,
               disponible: true,
               modalidad: modalidadSlot
             });
           }
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

      // También verificar reservas pendientes de boxes
      const reservasBoxesPendientes = await this.reservaRepository.find({
        where: {
          psicologoId,
          fecha: fechaDate,
          estado: EstadoReserva.PENDIENTE
        }
      });

      // Combinar ambas listas de reservas de boxes
      const todasLasReservasBoxes = [...reservasBoxes, ...reservasBoxesPendientes];
      console.log(`📦 Reservas de boxes encontradas: ${todasLasReservasBoxes.length}`);

      // 2. Verificar reservas de sesiones existentes para este slot del psicólogo
      const reservasSesiones = await this.reservaPsicologoRepository.find({
        where: {
          psicologo: { id: psicologoId },
          fecha: fechaDate,
          estado: EstadoReservaPsicologo.CONFIRMADA
        },
        relations: ['psicologo']
      });

      // También verificar reservas pendientes (que ya están agendadas)
      const reservasPendientes = await this.reservaPsicologoRepository.find({
        where: {
          psicologo: { id: psicologoId },
          fecha: fechaDate,
          estado: EstadoReservaPsicologo.PENDIENTE
        },
        relations: ['psicologo']
      });

      // Combinar ambas listas de reservas
      const todasLasReservasSesiones = [...reservasSesiones, ...reservasPendientes];
      console.log(`💼 Reservas de sesiones encontradas: ${todasLasReservasSesiones.length}`);
      
      if (todasLasReservasSesiones.length > 0) {
        console.log(`📝 Detalles de reservas de sesiones:`);
        todasLasReservasSesiones.forEach((reserva, index) => {
          console.log(`   ${index + 1}. Fecha: ${reserva.fecha}, Hora: ${reserva.horaInicio}-${reserva.horaFin}, Estado: ${reserva.estado}`);
        });
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
              modalidad: 'online'
            });
          }

          // Para modalidad presencial
          if (query.modalidad === 'presencial' || (!query.modalidad && disponibilidadDia.sede_id !== 'online')) {
            if (boxes.length > 0) {
              // Crear un slot por cada box disponible
              for (const box of boxes) {
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

      // También verificar reservas pendientes
      const reservasPendientes = await this.reservaRepository.find({
        where: {
          psicologoId,
          fecha: fechaDate,
          estado: EstadoReserva.PENDIENTE
        }
      });

      // Combinar ambas listas
      const todasLasReservas = [...reservasExistentes, ...reservasPendientes];

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
        const hayConflicto = todasLasReservas.some(reserva => 
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
        const hayConflicto = todasLasReservas.some(reserva => 
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

  // Método para obtener box disponible en un horario específico (presencial)
  async getBoxDisponible(query: BoxDisponibleDto): Promise<BoxDisponibleResponseDto> {
    // 1. Verificar que el psicólogo existe
    const psicologo = await this.psicologoRepository.findOne({
      where: { id: query.psicologoId },
      relations: ['usuario']
    });

    if (!psicologo) {
      throw new NotFoundException('Psicólogo no encontrado');
    }

    // 2. Verificar que la sede existe
    const sede = await this.sedeRepository.findOne({
      where: { id: query.sedeId }
    });

    if (!sede) {
      throw new NotFoundException('Sede no encontrada');
    }

    // 3. Verificar que el psicólogo tiene disponibilidad en esa fecha y hora
    const disponibilidad = await this.disponibilidadRepository.findOne({
      where: { 
        psicologo: { id: psicologo.usuario.id },
        active: true,
        sede_id: query.sedeId
      }
    });

    if (!disponibilidad) {
      throw new BadRequestException('El psicólogo no tiene disponibilidad configurada para esta sede');
    }

    // 4. Verificar que la fecha corresponde al día de la semana configurado
    const fechaDate = this.crearFechaLocal(query.fecha);
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const diaSemana = diasSemana[fechaDate.getDay()];
    
    if (this.normalizarDia(disponibilidad.day) !== diaSemana && disponibilidad.day !== diaSemana) {
      throw new BadRequestException('El psicólogo no tiene disponibilidad en este día de la semana');
    }

    // 5. Verificar que la hora está en el rango configurado
    if (!disponibilidad.hours.includes(query.horaInicio)) {
      throw new BadRequestException('El psicólogo no tiene disponibilidad en este horario');
    }

    // 6. Obtener boxes disponibles en la sede
    const boxes = await this.boxRepository.find({
      where: { 
        sede: { id: query.sedeId },
        estado: 'DISPONIBLE'
      },
      relations: ['sede']
    });

    if (boxes.length === 0) {
      throw new BadRequestException('No hay boxes disponibles en esta sede');
    }

    // 7. Verificar que no hay reservas existentes en ese horario
    const horaFin = this.calcularHoraFin(query.horaInicio);
    
         // Verificar reservas del psicólogo
     const reservasPsicologo = await this.reservaRepository.find({
       where: {
         psicologoId: query.psicologoId,
         fecha: fechaDate,
         estado: EstadoReserva.CONFIRMADA
       }
     });

     // También verificar reservas pendientes
     const reservasPsicologoPendientes = await this.reservaRepository.find({
       where: {
         psicologoId: query.psicologoId,
         fecha: fechaDate,
         estado: EstadoReserva.PENDIENTE
       }
     });

     // Combinar ambas listas
     const todasLasReservasPsicologo = [...reservasPsicologo, ...reservasPsicologoPendientes];

         // Verificar si hay conflicto de horarios con reservas existentes
     const hayConflictoPsicologo = todasLasReservasPsicologo.some(reserva => 
       this.hayConflictoHorarios(
         reserva.horaInicio, 
         reserva.horaFin, 
         query.horaInicio, 
         horaFin
       )
     );

    if (hayConflictoPsicologo) {
      throw new BadRequestException('El psicólogo ya tiene una reserva en este horario');
    }

    // 8. Buscar un box que no tenga reservas en ese horario
    let boxDisponible: Box | null = null;
    
    for (const box of boxes) {
             const reservasBox = await this.reservaRepository.find({
         where: {
           boxId: box.id,
           fecha: fechaDate,
           estado: EstadoReserva.CONFIRMADA
         }
       });

       // También verificar reservas pendientes del box
       const reservasBoxPendientes = await this.reservaRepository.find({
         where: {
           boxId: box.id,
           fecha: fechaDate,
           estado: EstadoReserva.PENDIENTE
         }
       });

       // Combinar ambas listas
       const todasLasReservasBox = [...reservasBox, ...reservasBoxPendientes];

             const hayConflictoBox = todasLasReservasBox.some(reserva => 
         this.hayConflictoHorarios(
           reserva.horaInicio, 
           reserva.horaFin, 
           query.horaInicio, 
           horaFin
         )
       );

      if (!hayConflictoBox) {
        boxDisponible = box;
        break;
      }
    }

    if (!boxDisponible) {
      throw new BadRequestException('No hay boxes disponibles en este horario');
    }

         // 9. Retornar información del box disponible
     return {
       boxId: boxDisponible.id,
       boxNumero: boxDisponible.numero,
       sedeId: sede.id,
       sedeNombre: sede.nombre,
       sedeDireccion: sede.direccion,
       psicologoId: query.psicologoId,
       psicologoNombre: `${psicologo.usuario.nombre} ${psicologo.usuario.apellido}`,
       fecha: query.fecha,
       horaInicio: query.horaInicio,
       horaFin: horaFin,
       disponible: true
     };
   }

   // Método para obtener datos de un box específico
   async getBoxById(boxId: string): Promise<BoxInfoResponseDto> {
     // 1. Verificar que el box existe
     const box = await this.boxRepository.findOne({
       where: { id: boxId },
       relations: ['sede']
     });

     if (!box) {
       throw new NotFoundException('Box no encontrado');
     }

     // 2. Obtener información de la sede
     const sede = box.sede;
     if (!sede) {
       throw new NotFoundException('Sede no encontrada para este box');
     }

     // 3. Retornar información completa del box
     return {
       id: box.id,
       numero: box.numero,
       estado: box.estado,
       urlImage: box.urlImage,
       sedeId: sede.id,
       sedeNombre: sede.nombre,
       sedeDireccion: sede.direccion,
       sedeTelefono: sede.telefono,
       sedeEmail: sede.email,
       createdAt: box.createdAt,
       updatedAt: box.updatedAt
     };
   }
} 