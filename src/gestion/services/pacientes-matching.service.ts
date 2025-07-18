import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Paciente } from '../../common/entities/paciente.entity';
import { User } from '../../common/entities/user.entity';
import { CreatePacienteMatchingDto, UpdatePacienteMatchingDto } from '../../common/dto/paciente.dto';

@Injectable()
export class PacientesMatchingService {
  constructor(
    @InjectRepository(Paciente)
    private pacienteRepository: Repository<Paciente>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createPacienteDto: CreatePacienteMatchingDto): Promise<Paciente> {
    // Verificar que el usuario existe y tiene rol PACIENTE
    const usuario = await this.userRepository.findOne({
      where: { id: createPacienteDto.idUsuarioPaciente, role: 'PACIENTE' }
    });

    if (!usuario) {
      throw new BadRequestException('El usuario no existe o no tiene rol PACIENTE');
    }

    // Verificar que no existe ya un perfil de paciente para este usuario
    const existingPaciente = await this.pacienteRepository.findOne({
      where: { idUsuarioPaciente: createPacienteDto.idUsuarioPaciente }
    });

    if (existingPaciente) {
      throw new BadRequestException('Ya existe un perfil de paciente para este usuario');
    }

    const paciente = this.pacienteRepository.create({
      ...createPacienteDto
    });

    return await this.pacienteRepository.save(paciente);
  }

  async findAll(): Promise<Paciente[]> {
    return await this.pacienteRepository.find();
  }

  async findOne(id: string): Promise<Paciente> {
    const paciente = await this.pacienteRepository.findOne({
      where: { id }
    });

    if (!paciente) {
      throw new NotFoundException('Paciente no encontrado');
    }

    return paciente;
  }

  async findByUserId(idUsuarioPaciente: string): Promise<Paciente> {
    const paciente = await this.pacienteRepository.findOne({
      where: { idUsuarioPaciente }
    });

    if (!paciente) {
      throw new NotFoundException('Perfil de paciente no encontrado para este usuario');
    }

    return paciente;
  }

  async update(id: string, updatePacienteDto: UpdatePacienteMatchingDto): Promise<Paciente> {
    const paciente = await this.findOne(id);
    Object.assign(paciente, updatePacienteDto);
    return await this.pacienteRepository.save(paciente);
  }

  async remove(id: string): Promise<void> {
    const paciente = await this.findOne(id);
    await this.pacienteRepository.remove(paciente);
  }

  // Método para buscar matches entre pacientes y psicólogos
  async findMatches(pacienteId: string): Promise<any[]> {
    const paciente = await this.findOne(pacienteId);
    // Aquí implementarías la lógica de matching basada en los nuevos campos
    return [];
  }
}
