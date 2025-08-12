import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
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
      where: { deletedAt: IsNull() }, // Solo boxes no eliminados
      relations: ['sede'],
      order: { numero: 'ASC' },
    });
  }

  async findAllWithDeleted(): Promise<Box[]> {
    return this.boxesRepository.find({
      relations: ['sede'],
      order: { numero: 'ASC' },
      withDeleted: true, // Incluir boxes eliminados
    });
  }

  async findOne(id: string): Promise<Box> {
    const box = await this.boxesRepository.findOne({
      where: { id, deletedAt: IsNull() }, // Solo boxes no eliminados
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
          deletedAt: IsNull(), // Solo considerar boxes activos
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
    // Solo validar si se está cambiando el número o la sede
    const numeroChanged = updateBoxDto.numero && updateBoxDto.numero !== box.numero;
    const sedeChanged = updateBoxDto.sedeId && updateBoxDto.sedeId !== box.sede?.id;
    
    if (numeroChanged || sedeChanged) {
      const numeroToCheck = updateBoxDto.numero || box.numero;
      const sedeIdToCheck = updateBoxDto.sedeId || box.sede?.id;
      
      if (numeroToCheck && sedeIdToCheck) {
        const existingBox = await this.boxesRepository.findOne({
          where: {
            numero: numeroToCheck,
            sede: { id: sedeIdToCheck },
            id: Not(id), // Excluir el box actual
            deletedAt: IsNull(), // Solo considerar boxes activos
          },
        });
        if (existingBox) {
          throw new BadRequestException('Ya existe un box con ese número en esta sede');
        }
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
    // Soft delete: marcar como eliminado en lugar de eliminar físicamente
    box.deletedAt = new Date();
    await this.boxesRepository.save(box);
  }

  async restore(id: string): Promise<Box> {
    const box = await this.boxesRepository.findOne({ 
      where: { id, deletedAt: IsNull() } 
    });
    
    if (!box) {
      throw new NotFoundException('Box no encontrado o ya está activo');
    }
    
    // Restaurar el box
    box.deletedAt = null;
    return await this.boxesRepository.save(box);
  }

  async findBySede(sedeId: string): Promise<Box[]> {
    const sede = await this.sedesRepository.findOne({
      where: { id: sedeId },
    });

    if (!sede) {
      throw new NotFoundException('Sede no encontrada');
    }

    return this.boxesRepository.find({
      where: { sede: { id: sedeId }, deletedAt: IsNull() }, // Solo boxes no eliminados
      relations: ['sede'],
      order: { numero: 'ASC' },
    });
  }
} 