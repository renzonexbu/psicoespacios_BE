import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../common/entities/user.entity';
import { Disponibilidad } from '../entities/disponibilidad.entity';
import { Sede } from '../../common/entities/sede.entity';
import { AvailabilityDataDto, AvailabilityResponseDto, WeeklyDayDto } from '../dto/disponibilidad.dto';

@Injectable()
export class DisponibilidadService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Disponibilidad)
    private disponibilidadRepository: Repository<Disponibilidad>,
    @InjectRepository(Sede)
    private sedeRepository: Repository<Sede>,
  ) {}

  private validateHours(hours: string[]): boolean {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    
    for (const hour of hours) {
      if (!timeRegex.test(hour)) {
        return false;
      }
      
      const [hours, minutes] = hour.split(':').map(Number);
      if (hours < 8 || hours > 20) {
        return false;
      }
    }
    
    return true;
  }

  private async validateSede(sedeId: string): Promise<boolean> {
    if (sedeId === 'online') {
      return true;
    }
    
    const sede = await this.sedeRepository.findOne({ where: { id: sedeId } });
    return !!sede;
  }

  private isLegacyDay(day: WeeklyDayDto): boolean {
    return Array.isArray(day.hours) && !!day.sede;
  }

  private buildStoredHours(day: WeeklyDayDto): any {
    if (this.isLegacyDay(day)) {
      return day.hours || [];
    }
    return {
      online: day.hoursOnline || [],
      presenciales: (day.presenciales || []).map(p => ({ sedeId: p.sedeId, horas: p.horas }))
    };
  }

  async saveAvailability(userId: string, data: AvailabilityDataDto): Promise<AvailabilityResponseDto> {
    // 1. Validar que el usuario existe y es psicólogo
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    if (user.role !== 'PSICOLOGO') {
      throw new BadRequestException('El usuario debe ser un psicólogo');
    }

    // 2. Validar disponibilidad semanal (nuevo formato y legado)
    for (const day of data.weeklySchedule) {
      if (!day.active) continue;
      if (this.isLegacyDay(day)) {
        if (day.hours && day.hours.length > 0 && !this.validateHours(day.hours)) {
          throw new BadRequestException(`Horas inválidas para ${day.day}. Deben estar entre 08:00 y 20:00`);
        }
        if (day.sede && !(await this.validateSede(day.sede))) {
          throw new BadRequestException(`Sede no encontrada: ${day.sede}`);
        }
      } else {
        if (day.hoursOnline && day.hoursOnline.length > 0 && !this.validateHours(day.hoursOnline)) {
          throw new BadRequestException(`Horas online inválidas para ${day.day}. Deben estar entre 08:00 y 20:00`);
        }
        if (day.presenciales) {
          for (const blk of day.presenciales) {
            if (!this.validateHours(blk.horas)) {
              throw new BadRequestException(`Horas presenciales inválidas para ${day.day} (sede ${blk.sedeId}).`);
            }
            if (!(await this.validateSede(blk.sedeId))) {
              throw new BadRequestException(`Sede no encontrada: ${blk.sedeId}`);
            }
          }
        }
      }
    }

    // 4. Guardar disponibilidad semanal (upsert por día)
    for (const day of data.weeklySchedule) {
      await this.disponibilidadRepository.upsert(
        {
          psicologo: { id: userId },
          day: day.day,
          active: day.active,
          hours: day.active ? this.buildStoredHours(day) : [],
          sede_id: this.isLegacyDay(day) ? day.sede : undefined,
          works_on_holidays: data.worksOnHolidays,
        },
        ['psicologo', 'day']
      );
    }

    // 6. Retornar confirmación
    return this.getAvailability(userId);
  }

  async getAvailability(userId: string): Promise<AvailabilityResponseDto> {
    // 1. Validar que el usuario existe y es psicólogo
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    if (user.role !== 'PSICOLOGO') {
      throw new BadRequestException('El usuario debe ser un psicólogo');
    }

    // 2. Obtener disponibilidad semanal
    const disponibilidades = await this.disponibilidadRepository.find({
      where: { psicologo: { id: userId } },
      order: { day: 'ASC' }
    });

    // 4. Formatear respuesta (nuevo y legado)
    const weeklySchedule: WeeklyDayDto[] = disponibilidades.map(d => {
      const result: any = { day: d.day, active: d.active };
      if (Array.isArray(d.hours)) {
        result.hours = d.hours || [];
        result.sede = d.sede_id || 'online';
      } else if (d.hours && typeof d.hours === 'object') {
        result.hoursOnline = Array.isArray((d as any).hours.online) ? (d as any).hours.online : [];
        result.presenciales = Array.isArray((d as any).hours.presenciales) ? (d as any).hours.presenciales : [];
      } else {
        result.hours = [];
        result.sede = d.sede_id || 'online';
      }
      return result as WeeklyDayDto;
    });

    const worksOnHolidays = disponibilidades.length > 0 ? disponibilidades[0].works_on_holidays : false;

    // 5. Retornar datos
    return {
      weeklySchedule,
      worksOnHolidays,
      updatedAt: new Date().toISOString()
    };
  }
} 