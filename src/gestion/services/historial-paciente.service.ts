import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HistorialPaciente } from '../../common/entities/historial-paciente.entity';
import { CreateHistorialPacienteDto, UpdateHistorialPacienteDto } from '../dto/historial-paciente.dto';

@Injectable()
export class HistorialPacienteService {
  constructor(
    @InjectRepository(HistorialPaciente)
    private historialRepository: Repository<HistorialPaciente>,
  ) {}

  async create(dto: CreateHistorialPacienteDto): Promise<HistorialPaciente> {
    const registro = this.historialRepository.create(dto);
    return this.historialRepository.save(registro);
  }

  async findAll(): Promise<HistorialPaciente[]> {
    return this.historialRepository.find();
  }

  async findOne(id: string): Promise<HistorialPaciente> {
    const registro = await this.historialRepository.findOne({ where: { id } });
    if (!registro) throw new NotFoundException('Registro de historial no encontrado');
    return registro;
  }

  async update(id: string, dto: UpdateHistorialPacienteDto): Promise<HistorialPaciente> {
    const registro = await this.findOne(id);
    Object.assign(registro, dto);
    return this.historialRepository.save(registro);
  }

  async remove(id: string): Promise<void> {
    const registro = await this.findOne(id);
    await this.historialRepository.remove(registro);
  }

  async findByPaciente(idUsuarioPaciente: string): Promise<HistorialPaciente[]> {
    return this.historialRepository.find({ where: { idUsuarioPaciente } });
  }
} 