import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Paciente } from '../../common/entities/paciente.entity';
import { User } from '../../common/entities/user.entity';
import { CreatePacienteDto, UpdatePacienteDto, PacienteWithUserDto } from '../dto/paciente.dto';

@Injectable()
export class PacientesService {
  constructor(
    @InjectRepository(Paciente)
    private readonly pacienteRepository: Repository<Paciente>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll(): Promise<Paciente[]> {
    return this.pacienteRepository.find();
  }

  async findOne(id: string): Promise<PacienteWithUserDto> {
    const paciente = await this.pacienteRepository.findOne({ where: { id } });
    if (!paciente) {
      throw new NotFoundException('Paciente no encontrado');
    }

    // Obtener información del usuario asociado
    const usuario = await this.userRepository.findOne({ 
      where: { id: paciente.idUsuarioPaciente } 
    });

    if (!usuario) {
      throw new NotFoundException('Usuario asociado al paciente no encontrado');
    }

    // Retornar información combinada del paciente y usuario
    return {
      ...paciente,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        rut: usuario.rut,
        telefono: usuario.telefono,
        fechaNacimiento: usuario.fechaNacimiento,
        fotoUrl: usuario.fotoUrl,
        direccion: usuario.direccion,
        role: usuario.role,
        estado: usuario.estado,
        createdAt: usuario.createdAt,
        updatedAt: usuario.updatedAt,
      }
    };
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