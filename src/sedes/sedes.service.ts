import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sede } from '../common/entities/sede.entity';
import { Box } from '../common/entities/box.entity';
import { ReservaPsicologo, EstadoReservaPsicologo } from '../common/entities/reserva-psicologo.entity';
import { CreateSedeDto, UpdateSedeDto, SedePublicDto } from './dto/sede.dto';
import { Reserva, EstadoReserva } from '../common/entities/reserva.entity';

@Injectable()
export class SedesService {
  constructor(
    @InjectRepository(Sede)
    private sedesRepository: Repository<Sede>,
    @InjectRepository(Box)
    private boxesRepository: Repository<Box>,
    @InjectRepository(ReservaPsicologo)
    private reservaPsicologoRepository: Repository<ReservaPsicologo>,
    @InjectRepository(Reserva)
    private reservaRepository: Repository<Reserva>,
  ) {}

  private normalizarDia(dia: string): string {
    const normalizaciones: Record<string, string> = {
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
    return normalizaciones[dia?.toLowerCase?.()] || dia;
  }

  private convertirHoraAMinutos(hora: string): number {
    const [hh, mm] = hora.split(':').map(Number);
    return (hh || 0) * 60 + (mm || 0);
  }

  private esHorarioValidoParaSede(
    horaInicio: string,
    horaFin: string,
    sede: Sede,
    diaSemana: string,
  ): boolean {
    if (!sede?.horarioAtencion?.diasHabiles?.length) {
      return true; // sin restricción definida
    }
    const diaHorario = sede.horarioAtencion.diasHabiles.find(d => this.normalizarDia(d.dia) === this.normalizarDia(diaSemana));
    if (!diaHorario || diaHorario.cerrado) {
      return false;
    }
    const ini = this.convertirHoraAMinutos(horaInicio);
    const fin = this.convertirHoraAMinutos(horaFin);
    const sedeIni = this.convertirHoraAMinutos(diaHorario.inicio);
    const sedeFin = this.convertirHoraAMinutos(diaHorario.fin);
    return ini >= sedeIni && fin <= sedeFin;
  }

  async findAll(): Promise<Sede[]> {
    return this.sedesRepository.find({
      where: { estado: 'ACTIVA' },
      relations: ['boxes'],
      order: { nombre: 'ASC' },
    });
  }

  async findAllPublic(): Promise<SedePublicDto[]> {
    const sedes = await this.sedesRepository.find({
      where: { estado: 'ACTIVA' },
      order: { nombre: 'ASC' },
    });

    // Retornar solo información pública sin datos sensibles
    return sedes.map(sede => ({
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
      estado: sede.estado,
    }));
  }

  async findOnePublic(id: string): Promise<SedePublicDto> {
    const sede = await this.sedesRepository.findOne({
      where: { id, estado: 'ACTIVA' },
    });

    if (!sede) {
      throw new NotFoundException('Sede no encontrada');
    }

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
      estado: sede.estado,
    };
  }

  async findOne(id: string): Promise<Sede> {
    const sede = await this.sedesRepository.findOne({
      where: { id },
      relations: ['boxes'],
    });

    if (!sede) {
      throw new NotFoundException('Sede no encontrada');
    }

    return sede;
  }

  async create(createSedeDto: CreateSedeDto): Promise<Sede> {
    // Crear la sede con todos los campos del DTO
    const sede = this.sedesRepository.create({
      nombre: createSedeDto.nombre,
      description: createSedeDto.description,
      direccion: createSedeDto.direccion,
      ciudad: createSedeDto.ciudad,
      telefono: createSedeDto.telefono,
      email: createSedeDto.email,
      imageUrl: createSedeDto.imageUrl,
      thumbnailUrl: createSedeDto.thumbnailUrl,
      features: createSedeDto.features,
      coordenadas: createSedeDto.coordenadas,
      horarioAtencion: createSedeDto.horarioAtencion,
      serviciosDisponibles: createSedeDto.serviciosDisponibles,
    });
    
    return await this.sedesRepository.save(sede);
  }

  async update(id: string, updateSedeDto: UpdateSedeDto): Promise<Sede> {
    const sede = await this.findOne(id);
    
    Object.assign(sede, updateSedeDto);
    return await this.sedesRepository.save(sede);
  }

  async remove(id: string): Promise<void> {
    const sede = await this.findOne(id);
    sede.estado = 'INACTIVA';
    await this.sedesRepository.save(sede);
  }

  async findBoxesBySede(sedeId: string): Promise<Box[]> {
    const sede = await this.sedesRepository.findOne({
      where: { id: sedeId },
      relations: ['boxes'],
    });

    if (!sede) {
      throw new NotFoundException('Sede no encontrada');
    }

    return sede.boxes;
  }

  async checkBoxAvailability(
    sedeId: string,
    fecha: Date,
    horaInicio: string,
    horaFin: string,
    asignarBox: boolean = false,
  ) {
    // Validar que la sede existe
    const sede = await this.sedesRepository.findOne({
      where: { id: sedeId },
    });

    if (!sede) {
      throw new NotFoundException('Sede no encontrada');
    }

    // Validar formato de hora (HH:MM o HH:MM:SS)
    const horaRegex = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/;
    if (!horaRegex.test(horaInicio)) {
      throw new BadRequestException(`Formato de hora inicio inválido: ${horaInicio}. Use formato HH:MM o HH:MM:SS`);
    }

    if (!horaRegex.test(horaFin)) {
      throw new BadRequestException(`Formato de hora fin inválido: ${horaFin}. Use formato HH:MM o HH:MM:SS`);
    }

    // Formatear la fecha de manera segura
    let fechaStr: string;
    try {
      // Primer intento con toISOString
      fechaStr = fecha.toISOString().split('T')[0];
    } catch (error) {
      try {
        // Si falla, intentar con el método manual
        const year = fecha.getFullYear();
        const month = String(fecha.getMonth() + 1).padStart(2, '0');
        const day = String(fecha.getDate()).padStart(2, '0');
        fechaStr = `${year}-${month}-${day}`;
        
        // Validar que la fecha resultante es correcta
        if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaStr)) {
          throw new Error('Formato de fecha inválido');
        }
      } catch (e) {
        throw new BadRequestException('No se pudo procesar la fecha proporcionada');
      }
    }
    
    // Verificar que horaFin es posterior a horaInicio
    if (horaFin <= horaInicio) {
      throw new BadRequestException('La hora de fin debe ser posterior a la hora de inicio');
    }
    
    // Validar horario de atención de la sede para el día solicitado
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const diaSemana = diasSemana[fecha.getDay()];
    const dentroDeHorario = this.esHorarioValidoParaSede(horaInicio, horaFin, sede, diaSemana);
    if (!dentroDeHorario) {
      return {
        fecha: fechaStr,
        horaInicio,
        horaFin,
        boxesDisponibles: [],
        total: 0,
        boxAsignado: null,
        asignacionAutomatica: asignarBox,
        motivo: 'Fuera del horario de atención de la sede'
      };
    }

    try {
      // Primero obtener todos los boxes de la sede
      const boxes = await this.boxesRepository
        .createQueryBuilder('box')
        .where('box.sedeId = :sedeId', { sedeId })
        .andWhere('box.estado = :estado', { estado: 'DISPONIBLE' })
        .orderBy('box.nombre', 'ASC')
        .getMany();

      // Filtrar boxes que no tienen conflictos de horario
      const boxesDisponibles: Box[] = [];
      
      for (const box of boxes) {
        // Verificar reservas de sesiones (reservas_sesiones)
        const conflictosSesiones = await this.reservaPsicologoRepository
          .createQueryBuilder('reserva')
          .where('reserva.boxId = :boxId', { boxId: box.id })
          .andWhere('reserva.fecha = :fecha', { fecha: fechaStr })
          .andWhere('reserva.estado IN (:...estadosSesion)', { 
            estadosSesion: [
              EstadoReservaPsicologo.CONFIRMADA,
              EstadoReservaPsicologo.PENDIENTE
            ]
          })
          .andWhere(
            '(reserva.horaInicio < :horaFin AND reserva.horaFin > :horaInicio)',
            { horaInicio, horaFin }
          )
          .getCount();

        // Verificar reservas de boxes (tabla reservas)
        const conflictosBoxes = await this.reservaRepository
          .createQueryBuilder('res')
          .where('res.boxId = :boxId', { boxId: box.id })
          .andWhere('res.fecha = :fecha', { fecha: fechaStr })
          .andWhere('res.estado IN (:...estados)', { 
            estados: [EstadoReserva.CONFIRMADA, EstadoReserva.PENDIENTE]
          })
          .andWhere(
            '(res.horaInicio < :horaFin AND res.horaFin > :horaInicio)',
            { horaInicio, horaFin }
          )
          .getCount();

        if (conflictosSesiones === 0 && conflictosBoxes === 0) {
          boxesDisponibles.push(box);
        }
      }

      // Si se solicita asignar automáticamente y hay boxes disponibles
      let boxAsignado: any = null;
      if (asignarBox && boxesDisponibles.length > 0) {
        // Seleccionar el primer box disponible (lógica simple)
        // En el futuro se podría implementar lógica más sofisticada
        boxAsignado = boxesDisponibles[0];
        
        // Marcar el box como temporalmente reservado (opcional)
        // Esto evitaría que otros usuarios lo reserven simultáneamente
        // await this.boxesRepository.update(boxAsignado.id, { estado: 'TEMPORALMENTE_RESERVADO' });
      }

      return {
        fecha: fechaStr,
        horaInicio,
        horaFin,
        boxesDisponibles: boxesDisponibles,
        total: boxesDisponibles.length,
        boxAsignado: boxAsignado,
        asignacionAutomatica: asignarBox
      };
    } catch (error) {
      throw new BadRequestException('Error al buscar disponibilidad: ' + error.message);
    }
  }

  /**
   * Asignar automáticamente un box disponible para una fecha y hora específica
   */
  async asignarBoxAutomaticamente(
    sedeId: string,
    fecha: Date,
    horaInicio: string,
    horaFin: string,
  ) {
    try {
      // Primero verificar disponibilidad
      const disponibilidad = await this.checkBoxAvailability(
        sedeId,
        fecha,
        horaInicio,
        horaFin,
        false // Solo verificar, no asignar
      );

      if (disponibilidad.total === 0) {
        return {
          success: false,
          disponible: false,
          message: disponibilidad.motivo || 'No hay boxes disponibles para la fecha y hora especificadas',
          fecha: disponibilidad.fecha,
          horaInicio,
          horaFin,
          box: null,
        };
      }

      // Seleccionar el box más apropiado (lógica simple por ahora)
      const boxAsignado = disponibilidad.boxesDisponibles[0];

      // Aquí se podría implementar lógica más sofisticada para seleccionar el box:
      // - Priorizar boxes más grandes si hay opciones
      // - Considerar preferencias del psicólogo
      // - Balancear carga entre boxes
      // - Considerar accesibilidad

      // Obtener información completa de la sede
      const sedeInfo = await this.sedesRepository.findOne({ 
        where: { id: sedeId },
        select: ['id', 'nombre', 'direccion', 'ciudad', 'telefono', 'email']
      });

      return {
        success: true,
        message: 'Box asignado automáticamente',
        box: {
          id: boxAsignado.id,
          nombre: boxAsignado.nombre,
          capacidad: boxAsignado.capacidad,
          sedeId: sedeId, // Usar el sedeId del parámetro
          estado: boxAsignado.estado
        },
        fecha: disponibilidad.fecha,
        horaInicio,
        horaFin,
        sede: {
          id: sedeInfo?.id || sedeId,
          nombre: sedeInfo?.nombre || 'Sede no encontrada',
          direccion: sedeInfo?.direccion || 'Dirección no disponible',
          ciudad: sedeInfo?.ciudad || 'Ciudad no disponible',
          telefono: sedeInfo?.telefono,
          email: sedeInfo?.email
        }
      };

    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Error al asignar box automáticamente: ' + error.message);
    }
  }
}