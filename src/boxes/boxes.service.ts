import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Box } from '../common/entities/box.entity';
import { Sede } from '../common/entities/sede.entity';
import { CreateBoxDto, UpdateBoxDto } from './dto/box.dto';
import { Not } from 'typeorm';

@Injectable()
export class BoxesService {
  constructor(
    @InjectRepository(Box)
    private boxesRepository: Repository<Box>,
    @InjectRepository(Sede)
    private sedesRepository: Repository<Sede>,
  ) {}

  async findAll(): Promise<Box[]> {
    return this.boxesRepository.find({
      relations: ['sede'],
      order: { numero: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Box> {
    const box = await this.boxesRepository.findOne({
      where: { id },
      relations: ['sede'],
    });

    if (!box) {
      throw new NotFoundException('Box no encontrado');
    }

    return box;
  }

  async create(createBoxDto: CreateBoxDto): Promise<Box> {
    // Verificar si la sede existe si se proporciona sedeId
    let sede: Sede | null = null;
    if (createBoxDto.sedeId) {
      sede = await this.sedesRepository.findOne({
        where: { id: createBoxDto.sedeId },
      });
      if (!sede) {
        throw new BadRequestException('Sede no encontrada');
      }
    }

    // Verificar si ya existe un box con el mismo número en la misma sede
    if (createBoxDto.sedeId) {
      const existingBox = await this.boxesRepository.findOne({
        where: {
          numero: createBoxDto.numero,
          sede: { id: createBoxDto.sedeId },
        },
      });
      if (existingBox) {
        throw new BadRequestException('Ya existe un box con ese número en esta sede');
      }
    }

    // Crear el box sin sedeId (para evitar problemas de mapeo)
    const { sedeId, ...boxData } = createBoxDto;
    const box = this.boxesRepository.create(boxData);
    
    // Asignar la sede si existe
    if (sede) {
      box.sede = sede;
    }

    return await this.boxesRepository.save(box);
  }

  async update(id: string, updateBoxDto: UpdateBoxDto): Promise<Box> {
    const box = await this.findOne(id);

    // Verificar si la sede existe si se proporciona sedeId
    let sede: Sede | null = null;
    if (updateBoxDto.sedeId) {
      sede = await this.sedesRepository.findOne({
        where: { id: updateBoxDto.sedeId },
      });
      if (!sede) {
        throw new BadRequestException('Sede no encontrada');
      }
    }

    // Verificar si ya existe otro box con el mismo número en la misma sede
    if (updateBoxDto.numero && updateBoxDto.sedeId) {
      const existingBox = await this.boxesRepository.findOne({
        where: {
          numero: updateBoxDto.numero,
          sede: { id: updateBoxDto.sedeId },
          id: Not(id), // Excluir el box actual
        },
      });
      if (existingBox) {
        throw new BadRequestException('Ya existe un box con ese número en esta sede');
      }
    }

    // Actualizar el box sin sedeId (para evitar problemas de mapeo)
    const { sedeId, ...boxData } = updateBoxDto;
    Object.assign(box, boxData);
    
    // Asignar la sede si se proporciona
    if (sede) {
      box.sede = sede;
    }

    return await this.boxesRepository.save(box);
  }

  async remove(id: string): Promise<void> {
    const box = await this.findOne(id);
    await this.boxesRepository.remove(box);
  }

  async findBySede(sedeId: string): Promise<Box[]> {
    const sede = await this.sedesRepository.findOne({
      where: { id: sedeId },
    });

    if (!sede) {
      throw new NotFoundException('Sede no encontrada');
    }

    return this.boxesRepository.find({
      where: { sede: { id: sedeId } },
      relations: ['sede'],
      order: { numero: 'ASC' },
    });
  }
} 