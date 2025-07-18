import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Paciente } from '../../common/entities/paciente.entity';
import { CreatePacienteDto, UpdatePacienteDto } from '../dto/paciente.dto';

@Injectable()
export class PacientesService {
  constructor(
    @InjectRepository(Paciente)
    private readonly pacienteRepository: Repository<Paciente>,
  ) {}

  async findAll(): Promise<Paciente[]> {
    return this.pacienteRepository.find();
  }

  async findOne(id: string): Promise<Paciente> {
    const paciente = await this.pacienteRepository.findOne({ where: { id } });
    if (!paciente) {
      throw new NotFoundException('Paciente no encontrado');
    }
    return paciente;
  }

  async findByUserId(idUsuarioPaciente: string): Promise<Paciente> {
    const paciente = await this.pacienteRepository.findOne({ where: { idUsuarioPaciente } });
    if (!paciente) {
      throw new NotFoundException('Paciente no encontrado para este usuario');
    }
    return paciente;
  }

  async create(createPacienteDto: CreatePacienteDto): Promise<Paciente> {
    const paciente = this.pacienteRepository.create(createPacienteDto);
    return this.pacienteRepository.save(paciente);
  }

  async update(id: string, updatePacienteDto: UpdatePacienteDto): Promise<Paciente> {
    const paciente = await this.findOne(id);
    Object.assign(paciente, updatePacienteDto);
    return this.pacienteRepository.save(paciente);
  }
}