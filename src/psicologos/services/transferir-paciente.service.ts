import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Paciente } from '../../common/entities/paciente.entity';
import { Psicologo } from '../../common/entities/psicologo.entity';
import { User } from '../../common/entities/user.entity';
import { TransferirPacienteDto } from '../dto/transferir-paciente.dto';
import { TransferirPacienteResponseDto } from '../dto/transferir-paciente-response.dto';

@Injectable()
export class TransferirPacienteService {
  private readonly logger = new Logger(TransferirPacienteService.name);

  constructor(
    @InjectRepository(Paciente)
    private pacienteRepository: Repository<Paciente>,
    @InjectRepository(Psicologo)
    private psicologoRepository: Repository<Psicologo>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
  ) {}

  async transferirPaciente(
    transferirPacienteDto: TransferirPacienteDto, 
    psicologoOrigenUserId: string
  ): Promise<TransferirPacienteResponseDto> {
    this.logger.log(`Iniciando transferencia de paciente: ${transferirPacienteDto.pacienteId}`);
    this.logger.log(`De psicólogo: ${psicologoOrigenUserId} a psicólogo: ${transferirPacienteDto.nuevoPsicologoId}`);

    // Usar transacción para asegurar consistencia
    return await this.dataSource.transaction(async (manager) => {
      // 1. Verificar que el psicólogo origen existe
      const psicologoOrigen = await manager.findOne(Psicologo, {
        where: { usuario: { id: psicologoOrigenUserId } },
        relations: ['usuario']
      });

      if (!psicologoOrigen) {
        throw new NotFoundException('Psicólogo origen no encontrado');
      }

      this.logger.log(`Psicólogo origen: ${psicologoOrigen.usuario.nombre} ${psicologoOrigen.usuario.apellido}`);

      // 2. Verificar que el paciente existe y pertenece al psicólogo origen
      const paciente = await manager.findOne(Paciente, {
        where: { 
          id: transferirPacienteDto.pacienteId,
          idUsuarioPsicologo: psicologoOrigen.id
        }
      });

      if (!paciente) {
        throw new NotFoundException('Paciente no encontrado o no pertenece al psicólogo origen');
      }

      this.logger.log(`Paciente encontrado: ${paciente.id}`);

      // 3. Verificar que el nuevo psicólogo existe
      const nuevoPsicologo = await manager.findOne(Psicologo, {
        where: { id: transferirPacienteDto.nuevoPsicologoId },
        relations: ['usuario']
      });

      if (!nuevoPsicologo) {
        throw new NotFoundException('Psicólogo destino no encontrado');
      }

      this.logger.log(`Psicólogo destino: ${nuevoPsicologo.usuario.nombre} ${nuevoPsicologo.usuario.apellido}`);

      // 4. Verificar que no es el mismo psicólogo
      if (psicologoOrigen.id === nuevoPsicologo.id) {
        throw new BadRequestException('No se puede transferir un paciente al mismo psicólogo');
      }

      // 5. Guardar el ID del psicólogo anterior para la respuesta
      const psicologoAnteriorId = paciente.idUsuarioPsicologo;

      // 6. Actualizar la vinculación del paciente
      paciente.idUsuarioPsicologo = nuevoPsicologo.id;
      paciente.ultima_actualizacion_matching = new Date();
      paciente.estado = 'ACTIVO';
      paciente.tag = null; // Resetear tag al cambiar de psicólogo

      const pacienteActualizado = await manager.save(paciente);
      this.logger.log(`Paciente transferido exitosamente: ${pacienteActualizado.id}`);

      // 7. Preparar respuesta
      const response: TransferirPacienteResponseDto = {
        success: true,
        message: 'Paciente transferido exitosamente',
        paciente: {
          id: pacienteActualizado.id,
          idUsuarioPaciente: pacienteActualizado.idUsuarioPaciente,
          idUsuarioPsicologoAnterior: psicologoAnteriorId,
          idUsuarioPsicologoNuevo: nuevoPsicologo.id,
          estado: pacienteActualizado.estado || 'ACTIVO'
        },
        psicologoAnterior: {
          id: psicologoOrigen.id,
          nombre: psicologoOrigen.usuario.nombre,
          apellido: psicologoOrigen.usuario.apellido,
          email: psicologoOrigen.usuario.email
        },
        psicologoNuevo: {
          id: nuevoPsicologo.id,
          nombre: nuevoPsicologo.usuario.nombre,
          apellido: nuevoPsicologo.usuario.apellido,
          email: nuevoPsicologo.usuario.email
        },
        fechaTransferencia: new Date().toISOString(),
        motivoTransferencia: transferirPacienteDto.motivoTransferencia
      };

      this.logger.log(`Transferencia completada: ${pacienteActualizado.idUsuarioPaciente} de ${psicologoOrigen.usuario.nombre} a ${nuevoPsicologo.usuario.nombre}`);
      return response;
    });
  }
}
