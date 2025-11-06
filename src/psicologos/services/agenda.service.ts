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

    if (disponibilidad.length === 0) {
      throw new BadRequestException('El psicólogo no tiene disponibilidad configurada');
    }

    // 3. Obtener boxes disponibles según la sede solicitada (opcional)
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
    const psicologo = await this.psicologoRepository.findOne({
      where: { id: query.psicologoId },
      relations: ['usuario']
    });

    if (!psicologo) {
      throw new NotFoundException('Psicólogo no encontrado');
    }

    const disponibilidad = await this.disponibilidadRepository.find({
      where: { 
        psicologo: { id: psicologo.usuario.id },
        active: true 
      }
    });

    if (disponibilidad.length === 0) {
      throw new BadRequestException('El psicólogo no tiene disponibilidad configurada');
    }

    const slots = await this.generatePsicologoSlots(
      query,
      disponibilidad,
      psicologo
    );

    // Usar el verificador común de reservas
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
    const [year, month, day] = fechaString.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  private async generatePsicologoSlots(
    query: PsicologoDisponibilidadDto,
    disponibilidad: Disponibilidad[],
    psicologo: Psicologo
  ): Promise<DisponibilidadSlotDto[]> {
    const slots: DisponibilidadSlotDto[] = [];
    const fechaInicio = this.crearFechaLocal(query.fechaInicio);
    const fechaFin = this.crearFechaLocal(query.fechaFin);
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    for (let fecha = new Date(fechaInicio); fecha <= fechaFin; fecha = new Date(fecha.getTime() + 24 * 60 * 60 * 1000)) {
      const diaSemana = diasSemana[fecha.getDay()];
      const fechaString = fecha.toISOString().split('T')[0];

      const disponibilidadDia = disponibilidad.find(d => 
        this.normalizarDia(d.day) === diaSemana || d.day === diaSemana
      );
      if (!disponibilidadDia || !disponibilidadDia.hours) continue;

      const hoursValue: any = disponibilidadDia.hours as any;
      if (Array.isArray(hoursValue)) {
        for (const hora of hoursValue) {
          const horaFin = this.calcularHoraFin(hora);
          const modalidadSlot = disponibilidadDia.sede_id === 'online' ? 'online' : 'presencial';
          if (!query.modalidad || query.modalidad === modalidadSlot) {
            slots.push({ fecha: fechaString, horaInicio: hora, horaFin, disponible: true, modalidad: modalidadSlot, sedeId: disponibilidadDia.sede_id });
          }
        }
      } else if (typeof hoursValue === 'object') {
        const online: string[] = Array.isArray(hoursValue.online) ? hoursValue.online : [];
        const presenciales: Array<{ sedeId: string; horas: string[] }> = Array.isArray(hoursValue.presenciales) ? hoursValue.presenciales : [];

        if (!query.modalidad || query.modalidad === 'online') {
          for (const hora of online) {
            const horaFin = this.calcularHoraFin(hora);
            slots.push({ fecha: fechaString, horaInicio: hora, horaFin, disponible: true, modalidad: 'online' });
          }
        }
        if (!query.modalidad || query.modalidad === 'presencial') {
          for (const blk of presenciales) {
            for (const hora of blk.horas) {
              const horaFin = this.calcularHoraFin(hora);
              slots.push({ fecha: fechaString, horaInicio: hora, horaFin, disponible: true, modalidad: 'presencial', sedeId: blk.sedeId });
            }
          }
        }
      }
    }

    return slots;
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
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    const boxesPorSede = new Map<string, Box[]>();
    if (boxes && boxes.length > 0) {
      for (const box of boxes) {
        const sid = box.sede?.id;
        if (sid) {
          boxesPorSede.set(sid, [...(boxesPorSede.get(sid) || []), box]);
        }
      }
    }

    for (let fecha = new Date(fechaInicio); fecha <= fechaFin; fecha = new Date(fecha.getTime() + 24 * 60 * 60 * 1000)) {
      const diaSemana = diasSemana[fecha.getDay()];
      const fechaString = fecha.toISOString().split('T')[0];

      const disponibilidadDia = disponibilidad.find(d => 
        this.normalizarDia(d.day) === diaSemana || d.day === diaSemana
      );
      if (!disponibilidadDia || !disponibilidadDia.hours) continue;

      const hoursValue: any = disponibilidadDia.hours as any;
      if (Array.isArray(hoursValue)) {
        for (const hora of hoursValue) {
          const horaFin = this.calcularHoraFin(hora);
          if (query.modalidad === 'online' || (!query.modalidad && disponibilidadDia.sede_id === 'online')) {
            if (disponibilidadDia.sede_id === 'online') {
              slots.push({ fecha: fechaString, horaInicio: hora, horaFin, disponible: true, modalidad: 'online', sedeId: 'online' });
            }
          }
          if (query.modalidad === 'presencial' || (!query.modalidad && disponibilidadDia.sede_id && disponibilidadDia.sede_id !== 'online')) {
            if (!boxes || boxes.length === 0) {
              if (disponibilidadDia.sede_id) {
                const sede = await this.sedeRepository.findOne({ where: { id: disponibilidadDia.sede_id } });
                if (sede && this.esHorarioValidoParaSede(hora, horaFin, sede, diaSemana)) {
                  const boxesSede = await this.boxRepository.find({ where: { sede: { id: disponibilidadDia.sede_id }, estado: 'DISPONIBLE' }, relations: ['sede'] });
                  for (const box of boxesSede) {
                    slots.push({ fecha: fechaString, horaInicio: hora, horaFin, disponible: true, modalidad: 'presencial', boxId: box.id, boxNumero: box.numero, sedeId: box.sede?.id, sedeNombre: box.sede?.nombre });
                  }
                }
              }
            } else {
              for (const box of boxes) {
                if (box.sede && this.esHorarioValidoParaSede(hora, horaFin, box.sede, diaSemana)) {
                  slots.push({ fecha: fechaString, horaInicio: hora, horaFin, disponible: true, modalidad: 'presencial', boxId: box.id, boxNumero: box.numero, sedeId: box.sede.id, sedeNombre: box.sede.nombre });
                }
              }
            }
          }
        }
      } else if (typeof hoursValue === 'object') {
        const online: string[] = Array.isArray(hoursValue.online) ? hoursValue.online : [];
        const presenciales: Array<{ sedeId: string; horas: string[] }> = Array.isArray(hoursValue.presenciales) ? hoursValue.presenciales : [];

        if (!query.modalidad || query.modalidad === 'online') {
          for (const hora of online) {
            const horaFin = this.calcularHoraFin(hora);
            slots.push({ fecha: fechaString, horaInicio: hora, horaFin, disponible: true, modalidad: 'online', sedeId: 'online' });
          }
        }

        if (!query.modalidad || query.modalidad === 'presencial') {
          for (const blk of presenciales) {
            for (const hora of blk.horas) {
              const horaFin = this.calcularHoraFin(hora);
              let boxesDeSede = boxesPorSede.get(blk.sedeId) || [];
              if ((!boxesDeSede || boxesDeSede.length === 0)) {
                boxesDeSede = await this.boxRepository.find({ where: { sede: { id: blk.sedeId }, estado: 'DISPONIBLE' }, relations: ['sede'] });
              }
              for (const box of boxesDeSede) {
                if (box.sede && this.esHorarioValidoParaSede(hora, horaFin, box.sede, diaSemana)) {
                  slots.push({ fecha: fechaString, horaInicio: hora, horaFin, disponible: true, modalidad: 'presencial', boxId: box.id, boxNumero: box.numero, sedeId: box.sede.id, sedeNombre: box.sede.nombre });
                }
              }
            }
          }
        }
      }
    }

    return slots;
  }

  private async checkReservasExistentes(
    slots: DisponibilidadSlotDto[],
    psicologoId: string
  ): Promise<DisponibilidadSlotDto[]> {
    const slotsActualizados = [...slots];

    for (const slot of slotsActualizados) {
      const fechaDate = this.crearFechaLocal(slot.fecha);
      const reservasExistentes = await this.reservaRepository.find({
        where: {
          psicologoId,
          fecha: fechaDate,
          estado: EstadoReserva.CONFIRMADA
        }
      });

      if (slot.boxId) {
        const reservasBox = await this.reservaRepository.find({
          where: {
            boxId: slot.boxId,
            fecha: fechaDate,
            estado: EstadoReserva.CONFIRMADA
          }
        });

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
    if (!sede.horarioAtencion || !sede.horarioAtencion.diasHabiles) {
      return true;
    }
    const diaHorario = sede.horarioAtencion.diasHabiles.find(dia => this.normalizarDia(dia.dia) === this.normalizarDia(diaSemana));
    if (!diaHorario || diaHorario.cerrado) {
      return false;
    }
    const horaInicioMinutos = this.convertirHoraAMinutos(horaInicio);
    const horaFinMinutos = this.convertirHoraAMinutos(horaFin);
    const sedeInicioMinutos = this.convertirHoraAMinutos(diaHorario.inicio);
    const sedeFinMinutos = this.convertirHoraAMinutos(diaHorario.fin);
    return horaInicioMinutos >= sedeInicioMinutos && horaFinMinutos <= sedeFinMinutos;
  }

  private convertirHoraAMinutos(hora: string): number {
    const [horas, minutos] = hora.split(':').map(Number);
    return horas * 60 + minutos;
  }

  async getBoxDisponible(query: any): Promise<any> {
    const { sedeId, fecha, horaInicio, horaFin } = query;
    if (!sedeId || sedeId === 'online') {
      return null;
    }
    const boxes = await this.boxRepository.find({ where: { sede: { id: sedeId }, estado: 'DISPONIBLE' } });
    if (boxes.length === 0) {
      return null;
    }
    const fechaDate = this.crearFechaLocal(fecha);
    for (const box of boxes) {
      const reservasExistentes = await this.reservaRepository.find({ where: { boxId: box.id, fecha: fechaDate, estado: EstadoReserva.CONFIRMADA } });
      const reservasSesiones = await this.reservaPsicologoRepository.find({ where: { boxId: box.id, fecha: fechaDate, estado: EstadoReservaPsicologo.CONFIRMADA } });
      const hayConflicto = reservasExistentes.some(reserva => this.hayConflictoHorarios(reserva.horaInicio, reserva.horaFin, horaInicio, horaFin)) || reservasSesiones.some(reserva => this.hayConflictoHorarios(reserva.horaInicio, reserva.horaFin, horaInicio, horaFin));
      if (!hayConflicto) {
        return { id: box.id, numero: box.numero, sedeId: box.sede?.id, sedeNombre: box.sede?.nombre };
      }
    }
    return null;
  }

  async getBoxById(id: string): Promise<any> {
    const box = await this.boxRepository.findOne({ where: { id }, relations: ['sede'] });
    if (!box) {
      throw new NotFoundException('Box no encontrado');
    }
    return { id: box.id, numero: box.numero, estado: box.estado, sedeId: box.sede?.id, sedeNombre: box.sede?.nombre };
  }
} 