import { Injectable, NotFoundException } from '@nestjs/common';
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
      where: { activa: true },
      relations: ['boxes'],
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
    const boxes = await this.boxesRepository
      .createQueryBuilder('box')
      .leftJoin('box.reservas', 'reserva')
      .where('box.sedeId = :sedeId', { sedeId })
      .andWhere(
        '(reserva.fechaInicio IS NULL OR NOT (' +
        'reserva.fechaInicio <= :horaFin AND ' +
        'reserva.fechaFin >= :horaInicio))',
        {
          horaInicio: `${fecha.toISOString().split('T')[0]} ${horaInicio}`,
          horaFin: `${fecha.toISOString().split('T')[0]} ${horaFin}`,
        },
      )
      .getMany();

    return boxes;
  }
}