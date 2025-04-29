import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PerfilDerivacion } from '../../common/entities/perfil-derivacion.entity';
import { CreatePerfilDerivacionDto, UpdatePerfilDerivacionDto, SearchPerfilDerivacionDto } from '../dto/perfil-derivacion.dto';
import { User } from '../../common/entities/user.entity';

@Injectable()
export class PerfilesDerivacionService {
  constructor(
    @InjectRepository(PerfilDerivacion)
    private perfilRepository: Repository<PerfilDerivacion>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findMiPerfil(userId: string) {
    const perfil = await this.perfilRepository.findOne({
      where: { psicologo: { id: userId } },
      relations: ['psicologo'],
    });

    if (!perfil) {
      throw new NotFoundException('Perfil de derivación no encontrado');
    }

    return perfil;
  }

  async search(searchDto: SearchPerfilDerivacionDto) {
    const queryBuilder = this.perfilRepository.createQueryBuilder('perfil');

    // Aplicar filtros solo si los arreglos tienen elementos
    const especialidades = searchDto.especialidades || [];
    if (especialidades.length > 0) {
      queryBuilder.andWhere('perfil.especialidades && :especialidades', {
        especialidades,
      });
    }

    const modalidades = searchDto.modalidades || [];
    if (modalidades.length > 0) {
      queryBuilder.andWhere('perfil.modalidades && :modalidades', {
        modalidades,
      });
    }

    // Filtro por disponibilidad
    if (searchDto.disponible !== undefined) {
      queryBuilder.andWhere('perfil.disponible = :disponible', {
        disponible: searchDto.disponible,
      });
    }

    return queryBuilder.getMany();
  }

  async findOne(id: string) {
    const perfil = await this.perfilRepository.findOne({
      where: { id },
      relations: ['psicologo'],
    });

    if (!perfil) {
      throw new NotFoundException('Perfil de derivación no encontrado');
    }

    return perfil;
  }

  async aprobar(id: string) {
    const perfil = await this.findOne(id);
    perfil.aprobado = true;
    return this.perfilRepository.save(perfil);
  }

  async createOrUpdate(createDto: CreatePerfilDerivacionDto, userId: string): Promise<PerfilDerivacion> {
    const psicologo = await this.userRepository.findOne({
      where: { id: userId }
    });

    if (!psicologo) {
      throw new NotFoundException('Usuario no encontrado');
    }

    let perfil = await this.perfilRepository.findOne({
      where: { psicologo: { id: userId } }
    });

    if (!perfil) {
      perfil = this.perfilRepository.create();
    }

    Object.assign(perfil, {
      ...createDto,
      psicologo
    });
    
    return await this.perfilRepository.save(perfil);
  }
}