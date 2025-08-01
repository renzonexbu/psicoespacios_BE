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



  async saveAvailability(userId: string, data: AvailabilityDataDto): Promise<AvailabilityResponseDto> {
    // 1. Validar que el usuario existe y es psicólogo
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    if (user.role !== 'PSICOLOGO') {
      throw new BadRequestException('El usuario debe ser un psicólogo');
    }

    // 2. Validar disponibilidad semanal
    for (const day of data.weeklySchedule) {
      if (day.active && day.hours && day.hours.length > 0) {
        // Validar horas
        if (!this.validateHours(day.hours)) {
          throw new BadRequestException(`Horas inválidas para ${day.day}. Deben estar entre 08:00 y 20:00`);
        }
        
        // Validar sede
        if (!(await this.validateSede(day.sede))) {
          throw new BadRequestException(`Sede no encontrada: ${day.sede}`);
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
          hours: day.active ? day.hours : [],
          sede_id: day.sede,
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



    // 4. Formatear respuesta
    const weeklySchedule: WeeklyDayDto[] = disponibilidades.map(d => ({
      day: d.day,
      active: d.active,
      hours: d.hours || [],
      sede: d.sede_id || 'online'
    }));

    const worksOnHolidays = disponibilidades.length > 0 ? disponibilidades[0].works_on_holidays : false;



    // 5. Retornar datos
    return {
      weeklySchedule,
      worksOnHolidays,
      updatedAt: new Date().toISOString()
    };
  }
} 