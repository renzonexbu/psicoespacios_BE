import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Psicologo } from '../../common/entities/psicologo.entity';
import { User } from '../../common/entities/user.entity';
import { CreatePsicologoDto, UpdatePsicologoDto } from '../../common/dto/psicologo.dto';

@Injectable()
export class PsicologosService {
  constructor(
    @InjectRepository(Psicologo)
    private psicologoRepository: Repository<Psicologo>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createPsicologoDto: CreatePsicologoDto): Promise<Psicologo> {
    // Verificar que el usuario existe y tiene rol PSICOLOGO
    const usuario = await this.userRepository.findOne({
      where: { id: createPsicologoDto.usuarioId, role: 'PSICOLOGO' }
    });

    if (!usuario) {
      throw new BadRequestException('El usuario no existe o no tiene rol PSICOLOGO');
    }

    // Verificar que no existe ya un perfil de psicólogo para este usuario
    const existingPsicologo = await this.psicologoRepository.findOne({
      where: { usuario: { id: createPsicologoDto.usuarioId } }
    });

    if (existingPsicologo) {
      throw new BadRequestException('Ya existe un perfil de psicólogo para este usuario');
    }

    const psicologo = this.psicologoRepository.create({
      ...createPsicologoDto,
      usuario
    });

    return await this.psicologoRepository.save(psicologo);
  }

  async findAll(): Promise<Psicologo[]> {
    return await this.psicologoRepository.find({
      relations: ['usuario']
    });
  }

  async findOne(id: string): Promise<Psicologo> {
    const psicologo = await this.psicologoRepository.findOne({
      where: { id },
      relations: ['usuario']
    });

    if (!psicologo) {
      throw new NotFoundException('Psicólogo no encontrado');
    }

    return psicologo;
  }

  async findByUserId(usuarioId: string): Promise<Psicologo> {
    const psicologo = await this.psicologoRepository.findOne({
      where: { usuario: { id: usuarioId } },
      relations: ['usuario']
    });

    if (!psicologo) {
      throw new NotFoundException('Perfil de psicólogo no encontrado para este usuario');
    }

    return psicologo;
  }

  async update(id: string, updatePsicologoDto: UpdatePsicologoDto): Promise<Psicologo> {
    const psicologo = await this.findOne(id);
    
    Object.assign(psicologo, updatePsicologoDto);
    
    return await this.psicologoRepository.save(psicologo);
  }

  async remove(id: string): Promise<void> {
    const psicologo = await this.findOne(id);
    await this.psicologoRepository.remove(psicologo);
  }
}
