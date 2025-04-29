import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Paciente } from '../../common/entities/paciente.entity';
import { FichaSesion } from '../../common/entities/ficha-sesion.entity';
import { User } from '../../common/entities/user.entity';
import { CreatePacienteDto, UpdatePacienteDto, CreateFichaSesionDto } from '../dto/paciente.dto';

@Injectable()
export class PacientesService {
  constructor(
    @InjectRepository(Paciente)
    private readonly pacienteRepository: Repository<Paciente>,
    @InjectRepository(FichaSesion)
    private readonly fichaSesionRepository: Repository<FichaSesion>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll(userId: string) {
    return this.pacienteRepository.find({
      where: { psicologo: { id: userId } },
      order: { apellido: 'ASC', nombre: 'ASC' },
    });
  }

  async findOne(id: string, userId: string) {
    const paciente = await this.pacienteRepository.findOne({
      where: { id, psicologo: { id: userId } },
      relations: ['fichasSesion'],
    });

    if (!paciente) {
      throw new NotFoundException('Paciente no encontrado');
    }

    return paciente;
  }

  async create(createPacienteDto: CreatePacienteDto, userId: string) {
    const psicologo = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!psicologo) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const paciente = this.pacienteRepository.create({
      ...createPacienteDto,
      psicologo,
    });

    return this.pacienteRepository.save(paciente);
  }

  async update(id: string, updatePacienteDto: UpdatePacienteDto, userId: string) {
    const paciente = await this.findOne(id, userId);
    const updatedPaciente = Object.assign(paciente, updatePacienteDto);
    return this.pacienteRepository.save(updatedPaciente);
  }

  async findFichas(pacienteId: string, userId: string) {
    const paciente = await this.findOne(pacienteId, userId);
    return this.fichaSesionRepository.find({
      where: { paciente: { id: paciente.id } },
      order: { fechaSesion: 'DESC' },
    });
  }

  async createFicha(
    pacienteId: string,
    createFichaSesionDto: CreateFichaSesionDto,
    userId: string,
  ) {
    const paciente = await this.findOne(pacienteId, userId);
    
    const fichaSesion = this.fichaSesionRepository.create({
      ...createFichaSesionDto,
      paciente,
    });

    return this.fichaSesionRepository.save(fichaSesion);
  }
}