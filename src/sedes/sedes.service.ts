import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sede } from '../common/entities/sede.entity';
import { Box } from '../common/entities/box.entity';
import { CreateSedeDto, UpdateSedeDto } from './dto/sede.dto';

@Injectable()
export class SedesService {
  constructor(
    @InjectRepository(Sede)
    private sedesRepository: Repository<Sede>,
    @InjectRepository(Box)
    private boxesRepository: Repository<Box>,
  ) {}

  async findAll(): Promise<Sede[]> {
    return this.sedesRepository.find({
      where: { estado: 'ACTIVA' },
      relations: ['boxes'],
      order: { nombre: 'ASC' },
    });
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
    const sede = this.sedesRepository.create(createSedeDto);
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
    
    try {
      const boxes = await this.boxesRepository
        .createQueryBuilder('box')
        .leftJoin('box.reservas', 'reserva', 
          'reserva.estado = :estado', 
          { estado: 'CONFIRMADA' }
        )
        .where('box.sedeId = :sedeId', { sedeId })
        .andWhere('box.estado = :estado', { estado: 'DISPONIBLE' })
        .andWhere(
          '(reserva.fechaInicio IS NULL OR NOT (' +
          'reserva.fechaInicio <= :horaFin AND ' +
          'reserva.fechaFin >= :horaInicio))',
          {
            horaInicio: `${fechaStr} ${horaInicio}`,
            horaFin: `${fechaStr} ${horaFin}`,
          },
        )
        .getMany();

      return {
        fecha: fechaStr,
        horaInicio,
        horaFin,
        boxesDisponibles: boxes,
        total: boxes.length
      };
    } catch (error) {
      throw new BadRequestException('Error al buscar disponibilidad: ' + error.message);
    }
  }
}