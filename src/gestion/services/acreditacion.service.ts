import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Acreditacion } from '../../common/entities/acreditacion.entity';
import { CreateAcreditacionDto, UpdateAcreditacionDto } from '../dto/acreditacion.dto';

@Injectable()
export class AcreditacionService {
  constructor(
    @InjectRepository(Acreditacion)
    private acreditacionRepository: Repository<Acreditacion>,
  ) {}

  async create(dto: CreateAcreditacionDto): Promise<Acreditacion> {
    const acreditacion = this.acreditacionRepository.create(dto);
    return this.acreditacionRepository.save(acreditacion);
  }

  async findAll(): Promise<Acreditacion[]> {
    return this.acreditacionRepository.find();
  }

  async findOne(id: string): Promise<Acreditacion> {
    const acreditacion = await this.acreditacionRepository.findOne({ where: { id } });
    if (!acreditacion) throw new NotFoundException('Acreditación no encontrada');
    return acreditacion;
  }

  async update(id: string, dto: UpdateAcreditacionDto): Promise<Acreditacion> {
    const acreditacion = await this.findOne(id);
    Object.assign(acreditacion, dto);
    return this.acreditacionRepository.save(acreditacion);
  }

  async remove(id: string): Promise<void> {
    const acreditacion = await this.findOne(id);
    await this.acreditacionRepository.remove(acreditacion);
  }

  async findByPsicologo(idPsicologo: string): Promise<Acreditacion[]> {
    return this.acreditacionRepository.find({ where: { idPsicologo } });
  }
} 