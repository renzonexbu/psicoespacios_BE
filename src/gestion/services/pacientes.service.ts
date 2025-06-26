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
    // Servicio temporalmente deshabilitado durante migración al sistema de matching
    return [];
  }

  async findOne(id: string, userId: string) {
    // Servicio temporalmente deshabilitado durante migración al sistema de matching
    throw new NotFoundException('Servicio en migración al sistema de matching');
  }

  async create(createPacienteDto: CreatePacienteDto, userId: string) {
    // Servicio temporalmente deshabilitado durante migración al sistema de matching
    throw new NotFoundException('Servicio en migración al sistema de matching');
  }

  async update(id: string, updatePacienteDto: UpdatePacienteDto, userId: string) {
    // Servicio temporalmente deshabilitado durante migración al sistema de matching
    throw new NotFoundException('Servicio en migración al sistema de matching');
  }

  async findFichas(pacienteId: string, userId: string) {
    // Servicio temporalmente deshabilitado durante migración al sistema de matching
    throw new NotFoundException('Servicio en migración al sistema de matching');
  }

  async createFicha(
    pacienteId: string,
    createFichaSesionDto: CreateFichaSesionDto,
    userId: string,
  ) {
    // Servicio temporalmente deshabilitado durante migración al sistema de matching
    throw new NotFoundException('Servicio en migración al sistema de matching');
  }
}