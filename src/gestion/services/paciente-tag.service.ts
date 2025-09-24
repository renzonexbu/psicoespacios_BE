import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Paciente } from '../../common/entities/paciente.entity';
import { Psicologo } from '../../common/entities/psicologo.entity';
import { User } from '../../common/entities/user.entity';
import { UpdatePacienteTagDto, RemovePacienteTagDto } from '../dto/update-paciente-tag.dto';

@Injectable()
export class PacienteTagService {
  private readonly logger = new Logger(PacienteTagService.name);

  constructor(
    @InjectRepository(Paciente)
    private pacienteRepository: Repository<Paciente>,
    @InjectRepository(Psicologo)
    private psicologoRepository: Repository<Psicologo>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * Asigna un tag a un paciente
   */
  async asignarTag(
    pacienteId: string,
    updateTagDto: UpdatePacienteTagDto,
    psicologoUserId: string
  ): Promise<{ success: boolean; message: string; tag: string }> {
    this.logger.log(`Asignando tag '${updateTagDto.tag}' al paciente ${pacienteId} por psicólogo ${psicologoUserId}`);

    // 1. Verificar que el paciente existe
    const paciente = await this.pacienteRepository.findOne({
      where: { id: pacienteId }
    });

    if (!paciente) {
      throw new NotFoundException(`Paciente con ID ${pacienteId} no encontrado`);
    }

    // 2. Buscar el psicólogo por usuarioId para obtener su ID
    const psicologo = await this.psicologoRepository.findOne({
      where: { usuario: { id: psicologoUserId } },
      relations: ['usuario']
    });

    if (!psicologo) {
      throw new NotFoundException('Psicólogo no encontrado');
    }

    // 3. Verificar que el psicólogo tiene acceso al paciente
    if (paciente.idUsuarioPsicologo !== psicologo.id) {
      throw new ForbiddenException('No tienes permisos para asignar tags a este paciente');
    }

    // 4. Actualizar el tag
    paciente.tag = updateTagDto.tag;
    await this.pacienteRepository.save(paciente);

    this.logger.log(`Tag '${updateTagDto.tag}' asignado exitosamente al paciente ${pacienteId}`);

    return {
      success: true,
      message: `Tag '${updateTagDto.tag}' asignado exitosamente`,
      tag: updateTagDto.tag
    };
  }

  /**
   * Remueve el tag de un paciente
   */
  async removerTag(
    pacienteId: string,
    removeTagDto: RemovePacienteTagDto,
    psicologoUserId: string
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Removiendo tag del paciente ${pacienteId} por psicólogo ${psicologoUserId}`);

    // 1. Verificar que el paciente existe
    const paciente = await this.pacienteRepository.findOne({
      where: { id: pacienteId }
    });

    if (!paciente) {
      throw new NotFoundException(`Paciente con ID ${pacienteId} no encontrado`);
    }

    // 2. Buscar el psicólogo por usuarioId para obtener su ID
    const psicologo = await this.psicologoRepository.findOne({
      where: { usuario: { id: psicologoUserId } },
      relations: ['usuario']
    });

    if (!psicologo) {
      throw new NotFoundException('Psicólogo no encontrado');
    }

    // 3. Verificar que el psicólogo tiene acceso al paciente
    if (paciente.idUsuarioPsicologo !== psicologo.id) {
      throw new ForbiddenException('No tienes permisos para remover tags de este paciente');
    }

    // 4. Verificar que el paciente tiene un tag asignado
    if (!paciente.tag) {
      throw new BadRequestException('El paciente no tiene un tag asignado');
    }

    // 5. Remover el tag
    const tagAnterior = paciente.tag;
    paciente.tag = null;
    await this.pacienteRepository.save(paciente);

    this.logger.log(`Tag '${tagAnterior}' removido exitosamente del paciente ${pacienteId}`);

    return {
      success: true,
      message: `Tag '${tagAnterior}' removido exitosamente`
    };
  }

  /**
   * Obtiene el tag de un paciente
   */
  async obtenerTag(
    pacienteId: string,
    psicologoUserId: string
  ): Promise<{ tag: string | null; paciente: { id: string; nombre: string; apellido: string } }> {
    this.logger.log(`Obteniendo tag del paciente ${pacienteId} por psicólogo ${psicologoUserId}`);

    // 1. Buscar el paciente
    const paciente = await this.pacienteRepository.findOne({
      where: { id: pacienteId }
    });

    if (!paciente) {
      throw new NotFoundException(`Paciente con ID ${pacienteId} no encontrado`);
    }

    // 2. Buscar el psicólogo por usuarioId para obtener su ID
    const psicologo = await this.psicologoRepository.findOne({
      where: { usuario: { id: psicologoUserId } },
      relations: ['usuario']
    });

    if (!psicologo) {
      throw new NotFoundException('Psicólogo no encontrado');
    }

    // 3. Verificar que el psicólogo tiene acceso al paciente
    if (paciente.idUsuarioPsicologo !== psicologo.id) {
      throw new ForbiddenException('No tienes permisos para ver el tag de este paciente');
    }

    // 4. Obtener información del usuario paciente
    const usuarioPaciente = await this.userRepository.findOne({
      where: { id: paciente.idUsuarioPaciente }
    });

    if (!usuarioPaciente) {
      throw new NotFoundException('Información del usuario paciente no encontrada');
    }

    return {
      tag: paciente.tag,
      paciente: {
        id: paciente.id,
        nombre: usuarioPaciente.nombre,
        apellido: usuarioPaciente.apellido
      }
    };
  }

  /**
   * Lista todos los pacientes con tags de un psicólogo
   */
  async listarPacientesConTags(
    psicologoUserId: string
  ): Promise<Array<{ id: string; nombre: string; apellido: string; tag: string | null }>> {
    this.logger.log(`Listando pacientes con tags para psicólogo ${psicologoUserId}`);

    const pacientes = await this.pacienteRepository
      .createQueryBuilder('paciente')
      .leftJoinAndSelect('paciente.idUsuarioPaciente', 'usuario')
      .where('paciente.idUsuarioPsicologo = :psicologoUserId', { psicologoUserId })
      .orderBy('paciente.primeraSesionRegistrada', 'DESC')
      .getMany();

    // Obtener información de los usuarios para cada paciente
    const pacientesConInfo = await Promise.all(
      pacientes.map(async (paciente) => {
        const usuarioPaciente = await this.userRepository.findOne({
          where: { id: paciente.idUsuarioPaciente }
        });

        if (!usuarioPaciente) {
          return null; // Usuario no encontrado, omitir
        }

        return {
          id: paciente.id,
          nombre: usuarioPaciente.nombre,
          apellido: usuarioPaciente.apellido,
          tag: paciente.tag
        };
      })
    );

    // Filtrar pacientes nulos y retornar
    return pacientesConInfo.filter(paciente => paciente !== null);
  }
}
