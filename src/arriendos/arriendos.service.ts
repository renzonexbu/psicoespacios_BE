import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { ArriendoBox, EstadoArriendo } from '../common/entities/arriendo-box.entity';
import { Box } from '../common/entities/box.entity';
import { User } from '../common/entities/user.entity';
import { CreateArriendoBoxDto, UpdateArriendoBoxDto } from './dto/arriendo-box.dto';

@Injectable()
export class ArriendosService {
  constructor(
    @InjectRepository(ArriendoBox)
    private arriendoRepository: Repository<ArriendoBox>,
    @InjectRepository(Box)
    private boxRepository: Repository<Box>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createArriendoDto: CreateArriendoBoxDto) {
    // Verificar que el box existe
    const box = await this.boxRepository.findOne({ where: { id: createArriendoDto.boxId } });
    if (!box) {
      throw new NotFoundException(`Box con ID ${createArriendoDto.boxId} no encontrado`);
    }

    // Verificar que el psicólogo existe
    const psicologo = await this.userRepository.findOne({ 
      where: { id: createArriendoDto.psicologoId, role: 'PSICOLOGO' } 
    });
    if (!psicologo) {
      throw new NotFoundException(`Psicólogo con ID ${createArriendoDto.psicologoId} no encontrado`);
    }

    // Verificar que no hay conflictos de horarios para el box
    await this.verificarConflictosHorarios(createArriendoDto);

    const arriendo = this.arriendoRepository.create({
      ...createArriendoDto,
      fechaInicio: new Date(createArriendoDto.fechaInicio),
      fechaFin: new Date(createArriendoDto.fechaFin),
    });

    return await this.arriendoRepository.save(arriendo);
  }

  async findAll() {
    return await this.arriendoRepository.find({
      relations: ['box', 'psicologo'],
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: string) {
    const arriendo = await this.arriendoRepository.findOne({
      where: { id },
      relations: ['box', 'psicologo']
    });

    if (!arriendo) {
      throw new NotFoundException(`Arriendo con ID ${id} no encontrado`);
    }

    return arriendo;
  }

  async findByPsicologo(psicologoId: string) {
    return await this.arriendoRepository.find({
      where: { psicologoId },
      relations: ['box'],
      order: { fechaInicio: 'DESC' }
    });
  }

  async findByBox(boxId: string) {
    return await this.arriendoRepository.find({
      where: { boxId },
      relations: ['psicologo'],
      order: { fechaInicio: 'DESC' }
    });
  }

  async findActivos() {
    const hoy = new Date();
    return await this.arriendoRepository.find({
      where: {
        estado: EstadoArriendo.ACTIVO,
        fechaInicio: LessThanOrEqual(hoy),
        fechaFin: MoreThanOrEqual(hoy)
      },
      relations: ['box', 'psicologo'],
      order: { fechaInicio: 'ASC' }
    });
  }

  async findPorVencer(dias: number = 30) {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() + dias);

    return await this.arriendoRepository.find({
      where: {
        estado: EstadoArriendo.ACTIVO,
        fechaFin: Between(new Date(), fechaLimite)
      },
      relations: ['box', 'psicologo'],
      order: { fechaFin: 'ASC' }
    });
  }

  async update(id: string, updateArriendoDto: UpdateArriendoBoxDto) {
    const arriendo = await this.findOne(id);

    // Si se está actualizando fechas o horarios, verificar conflictos
    if (updateArriendoDto.fechaInicio || updateArriendoDto.fechaFin || updateArriendoDto.horarios) {
      await this.verificarConflictosHorarios(updateArriendoDto, id);
    }

    // Si se está cancelando, agregar fecha de cancelación
    if (updateArriendoDto.estado === EstadoArriendo.CANCELADO && arriendo.estado !== EstadoArriendo.CANCELADO) {
      updateArriendoDto['fechaCancelacion'] = new Date();
    }

    Object.assign(arriendo, updateArriendoDto);
    return await this.arriendoRepository.save(arriendo);
  }

  async cancelar(id: string, motivo: string) {
    const arriendo = await this.findOne(id);
    
    if (arriendo.estado === EstadoArriendo.CANCELADO) {
      throw new BadRequestException('El arriendo ya está cancelado');
    }

    arriendo.estado = EstadoArriendo.CANCELADO;
    arriendo.motivoCancelacion = motivo;
    arriendo.fechaCancelacion = new Date();

    return await this.arriendoRepository.save(arriendo);
  }

  async renovar(id: string) {
    const arriendo = await this.findOne(id);
    
    if (arriendo.estado !== EstadoArriendo.ACTIVO) {
      throw new BadRequestException('Solo se pueden renovar arriendos activos');
    }

    // Calcular nueva fecha fin basada en el tipo de arriendo
    const nuevaFechaFin = new Date(arriendo.fechaFin);
    switch (arriendo.tipoArriendo) {
      case 'MENSUAL':
        nuevaFechaFin.setMonth(nuevaFechaFin.getMonth() + 1);
        break;
      case 'TRIMESTRAL':
        nuevaFechaFin.setMonth(nuevaFechaFin.getMonth() + 3);
        break;
      case 'SEMESTRAL':
        nuevaFechaFin.setMonth(nuevaFechaFin.getMonth() + 6);
        break;
      case 'ANUAL':
        nuevaFechaFin.setFullYear(nuevaFechaFin.getFullYear() + 1);
        break;
      default:
        throw new BadRequestException('No se puede renovar automáticamente este tipo de arriendo');
    }

    arriendo.fechaFin = nuevaFechaFin;
    arriendo.fechaRenovacion = new Date();

    return await this.arriendoRepository.save(arriendo);
  }

  async verificarDisponibilidad(boxId: string, fecha: Date, horarios: any[]) {
    const arriendosActivos = await this.arriendoRepository.find({
      where: {
        boxId,
        estado: EstadoArriendo.ACTIVO,
        fechaInicio: LessThanOrEqual(fecha),
        fechaFin: MoreThanOrEqual(fecha)
      }
    });

    // Verificar conflictos de horarios
    for (const arriendo of arriendosActivos) {
      for (const horario of horarios) {
        for (const horarioExistente of arriendo.horarios) {
          if (horario.dia === horarioExistente.dia && horarioExistente.activo) {
            // Verificar si hay superposición de horarios
            if (this.horariosSeSuperponen(horario, horarioExistente)) {
              return {
                disponible: false,
                conflicto: {
                  arriendoId: arriendo.id,
                  psicologoId: arriendo.psicologoId,
                  horario: horarioExistente
                }
              };
            }
          }
        }
      }
    }

    return { disponible: true };
  }

  private async verificarConflictosHorarios(arriendoDto: any, excludeId?: string) {
    const query = this.arriendoRepository.createQueryBuilder('arriendo')
      .where('arriendo.boxId = :boxId', { boxId: arriendoDto.boxId })
      .andWhere('arriendo.estado IN (:...estados)', { 
        estados: [EstadoArriendo.ACTIVO, EstadoArriendo.PENDIENTE] 
      });

    if (excludeId) {
      query.andWhere('arriendo.id != :excludeId', { excludeId });
    }

    const arriendosExistentes = await query.getMany();

    for (const arriendoExistente of arriendosExistentes) {
      // Verificar si hay superposición de fechas
      const fechaInicio = arriendoDto.fechaInicio ? new Date(arriendoDto.fechaInicio) : arriendoExistente.fechaInicio;
      const fechaFin = arriendoDto.fechaFin ? new Date(arriendoDto.fechaFin) : arriendoExistente.fechaFin;

      if (this.fechasSeSuperponen(
        fechaInicio, 
        fechaFin, 
        arriendoExistente.fechaInicio, 
        arriendoExistente.fechaFin
      )) {
        // Verificar conflictos de horarios
        const horarios = arriendoDto.horarios || arriendoExistente.horarios;
        for (const horario of horarios) {
          for (const horarioExistente of arriendoExistente.horarios) {
            if (horario.dia === horarioExistente.dia && horarioExistente.activo) {
              if (this.horariosSeSuperponen(horario, horarioExistente)) {
                throw new ConflictException(
                  `Conflicto de horarios: El box ya está arrendado en ${horario.dia} de ${horarioExistente.horaInicio} a ${horarioExistente.horaFin}`
                );
              }
            }
          }
        }
      }
    }
  }

  private fechasSeSuperponen(inicio1: Date, fin1: Date, inicio2: Date, fin2: Date): boolean {
    return inicio1 <= fin2 && inicio2 <= fin1;
  }

  private horariosSeSuperponen(horario1: any, horario2: any): boolean {
    const inicio1 = this.convertirHoraAMinutos(horario1.horaInicio);
    const fin1 = this.convertirHoraAMinutos(horario1.horaFin);
    const inicio2 = this.convertirHoraAMinutos(horario2.horaInicio);
    const fin2 = this.convertirHoraAMinutos(horario2.horaFin);

    return inicio1 < fin2 && inicio2 < fin1;
  }

  private convertirHoraAMinutos(hora: string): number {
    const [horas, minutos] = hora.split(':').map(Number);
    return horas * 60 + minutos;
  }

  async remove(id: string) {
    const arriendo = await this.findOne(id);
    return await this.arriendoRepository.remove(arriendo);
  }
} 