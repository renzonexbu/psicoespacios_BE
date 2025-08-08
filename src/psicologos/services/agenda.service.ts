import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Disponibilidad } from '../entities/disponibilidad.entity';
import { Box } from '../../common/entities/box.entity';
import { Reserva, EstadoReserva } from '../../common/entities/reserva.entity';
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

          // Solo generar slots para la modalidad especificada o todas si no se especifica
          const modalidadSlot = query.modalidad || (disponibilidadDia.sede_id === 'online' ? 'online' : 'presencial');
          
          if (!query.modalidad || query.modalidad === modalidadSlot) {
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

    for (const slot of slotsActualizados) {
      // Convertir string de fecha a Date usando la función local
      const fechaDate = this.crearFechaLocal(slot.fecha);
      
      // Verificar si hay reservas existentes para este slot del psicólogo
      const reservasExistentes = await this.reservaRepository.find({
        where: {
          psicologoId,
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
      );

      if (hayConflicto) {
        slot.disponible = false;
        console.log(`❌ Slot no disponible: ${slot.fecha} ${slot.horaInicio}-${slot.horaFin} (conflicto con reserva existente)`);
      }
    }

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
} 