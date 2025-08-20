import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Paciente } from '../../common/entities/paciente.entity';
import { Psicologo } from '../../common/entities/psicologo.entity';
import { User } from '../../common/entities/user.entity';
import { ReservaPsicologo, EstadoReservaPsicologo } from '../../common/entities/reserva-psicologo.entity';
import { Disponibilidad } from '../../psicologos/entities/disponibilidad.entity';

@Injectable()
export class PsicologoPacienteService {
  private readonly logger = new Logger(PsicologoPacienteService.name);

  constructor(
    @InjectRepository(Paciente)
    private readonly pacienteRepository: Repository<Paciente>,
    @InjectRepository(Psicologo)
    private readonly psicologoRepository: Repository<Psicologo>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(ReservaPsicologo)
    private readonly reservaPsicologoRepository: Repository<ReservaPsicologo>,
    @InjectRepository(Disponibilidad)
    private readonly disponibilidadRepository: Repository<Disponibilidad>,
  ) {}

  async getPsicologoByPacienteUsuario(usuarioId: string) {
    this.logger.log(`Buscando psicólogo para paciente con usuarioId: ${usuarioId}`);

    try {
      // 1. Buscar el paciente por usuarioId
      const paciente = await this.pacienteRepository.findOne({
        where: { idUsuarioPaciente: usuarioId }
      });

      if (!paciente) {
        throw new NotFoundException(`Paciente no encontrado para el usuario: ${usuarioId}`);
      }

      this.logger.log(`Paciente encontrado: ${paciente.id}, idUsuarioPsicologo: ${paciente.idUsuarioPsicologo}`);

      // 2. Si no tiene psicólogo asignado, retornar null
      if (!paciente.idUsuarioPsicologo) {
        this.logger.log(`Paciente ${usuarioId} no tiene psicólogo asignado`);
        return {
          paciente: {
            id: paciente.id,
            idUsuarioPaciente: paciente.idUsuarioPaciente,
          },
          psicologo: null,
          mensaje: 'El paciente no tiene psicólogo asignado'
        };
      }

      // 3. Buscar el psicólogo por su ID (no por usuarioId)
      this.logger.log(`Buscando psicólogo con ID = ${paciente.idUsuarioPsicologo}`);
      
      // Buscar directamente en la tabla psicologo por el ID del psicólogo
      const psicologo = await this.psicologoRepository
        .createQueryBuilder('psicologo')
        .leftJoinAndSelect('psicologo.usuario', 'usuario')
        .where('psicologo.id = :psicologoId', { psicologoId: paciente.idUsuarioPsicologo })
        .getOne();

      this.logger.log(`Psicólogo encontrado: ${psicologo ? 'SÍ' : 'NO'}`);
      if (psicologo) {
        this.logger.log(`ID del psicólogo: ${psicologo.id}, Usuario: ${psicologo.usuario.nombre}, UsuarioID: ${psicologo.usuario.id}`);
      }

      if (!psicologo) {
        this.logger.warn(`Psicólogo no encontrado para ID: ${paciente.idUsuarioPsicologo}`);
        return {
          paciente: {
            id: paciente.id,
            idUsuarioPaciente: paciente.idUsuarioPaciente,
          },
          psicologo: null,
          mensaje: 'El psicólogo asignado no fue encontrado'
        };
      }

      // 4. Buscar información del usuario del paciente
      const usuarioPaciente = await this.userRepository.findOne({
        where: { id: paciente.idUsuarioPaciente }
      });

      // 5. Contar las sesiones del psicólogo hasta la fecha
      const fechaHoy = new Date();
      fechaHoy.setHours(23, 59, 59, 999); // Final del día actual
      
      const countSesiones = await this.reservaPsicologoRepository
        .createQueryBuilder('reserva')
        .where('reserva.psicologo = :psicologoId', { psicologoId: psicologo.id })
        .andWhere('reserva.fecha <= :fechaHoy', { fechaHoy })
        .andWhere('reserva.estado IN (:...estados)', { estados: [EstadoReservaPsicologo.CONFIRMADA, EstadoReservaPsicologo.COMPLETADA] })
        .getCount();

      this.logger.log(`Sesiones del psicólogo ${psicologo.id} hasta hoy: ${countSesiones}`);

      // 6. Obtener disponibilidad real desde la tabla psicologo_disponibilidad
      // IMPORTANTE: psicologo_id en esta tabla es el idUsuario del psicólogo, NO el id del psicólogo
      this.logger.log(`Buscando disponibilidad con usuario.id = ${psicologo.usuario.id}`);
      
      const disponibilidad = await this.disponibilidadRepository
        .createQueryBuilder('disp')
        .where('disp.psicologo_id = :usuarioId', { usuarioId: psicologo.usuario.id })
        .orderBy('disp.day', 'ASC')
        .getMany();

      this.logger.log(`Disponibilidad encontrada: ${disponibilidad.length} días`);

      // 7. Retornar información completa
      return {
        paciente: {
          id: paciente.id,
          idUsuarioPaciente: paciente.idUsuarioPaciente,
          nombre: usuarioPaciente?.nombre || 'N/A',
          email: usuarioPaciente?.email || 'N/A',
          fotoUrl: usuarioPaciente?.fotoUrl || null,
        },
        psicologo: {
          id: psicologo.id,
          idUsuario: psicologo.usuario.id,
          nombre: psicologo.usuario.nombre || 'N/A',
          email: psicologo.usuario.email || 'N/A',
          telefono: psicologo.usuario.telefono || 'N/A',
          fotoUrl: psicologo.usuario.fotoUrl || null,
          descripcion: psicologo.descripcion,
          experiencia: psicologo.experiencia,
          totalSesiones: countSesiones,
          disponibilidad: disponibilidad,
        }
      };

    } catch (error) {
      this.logger.error(`Error al buscar psicólogo para paciente ${usuarioId}: ${error.message}`);
      throw error;
    }
  }

  async getPsicologoByPacienteId(pacienteId: string) {
    this.logger.log(`Buscando psicólogo para paciente con ID: ${pacienteId}`);

    try {
      // 1. Buscar el paciente por ID
      const paciente = await this.pacienteRepository.findOne({
        where: { id: pacienteId }
      });

      if (!paciente) {
        throw new NotFoundException(`Paciente no encontrado con ID: ${pacienteId}`);
      }

      this.logger.log(`Paciente encontrado: ${paciente.id}, idUsuarioPsicologo: ${paciente.idUsuarioPsicologo}`);

      // 2. Si no tiene psicólogo asignado, retornar null
      if (!paciente.idUsuarioPsicologo) {
        this.logger.log(`Paciente ${pacienteId} no tiene psicólogo asignado`);
        return {
          paciente: {
            id: paciente.id,
            idUsuarioPaciente: paciente.idUsuarioPaciente,
          },
          psicologo: null,
          mensaje: 'El paciente no tiene psicólogo asignado'
        };
      }

      // 3. Buscar el psicólogo por su ID (no por usuarioId)
      this.logger.log(`Buscando psicólogo con ID = ${paciente.idUsuarioPsicologo}`);
      
      // Buscar directamente en la tabla psicologo por el ID del psicólogo
      const psicologo = await this.psicologoRepository
        .createQueryBuilder('psicologo')
        .leftJoinAndSelect('psicologo.usuario', 'usuario')
        .where('psicologo.id = :psicologoId', { psicologoId: paciente.idUsuarioPsicologo })
        .getOne();

      this.logger.log(`Psicólogo encontrado: ${psicologo ? 'SÍ' : 'NO'}`);
      if (psicologo) {
        this.logger.log(`ID del psicólogo: ${psicologo.id}, Usuario: ${psicologo.usuario.nombre}, UsuarioID: ${psicologo.usuario.id}`);
      }

      if (!psicologo) {
        this.logger.warn(`Psicólogo no encontrado para ID: ${paciente.idUsuarioPsicologo}`);
        return {
          paciente: {
            id: paciente.id,
            idUsuarioPaciente: paciente.idUsuarioPaciente,
          },
          psicologo: null,
          mensaje: 'El psicólogo asignado no fue encontrado'
        };
      }

      // 4. Buscar información del usuario del paciente
      const usuarioPaciente = await this.userRepository.findOne({
        where: { id: paciente.idUsuarioPaciente }
      });

      // 5. Contar las sesiones del psicólogo hasta la fecha
      const fechaHoy = new Date();
      fechaHoy.setHours(23, 59, 59, 999); // Final del día actual
      
      const countSesiones = await this.reservaPsicologoRepository
        .createQueryBuilder('reserva')
        .where('reserva.psicologo = :psicologoId', { psicologoId: psicologo.id })
        .andWhere('reserva.fecha <= :fechaHoy', { fechaHoy })
        .andWhere('reserva.estado IN (:...estados)', { estados: [EstadoReservaPsicologo.CONFIRMADA, EstadoReservaPsicologo.COMPLETADA] })
        .getCount();

      this.logger.log(`Sesiones del psicólogo ${psicologo.id} hasta hoy: ${countSesiones}`);

      // 6. Obtener disponibilidad real desde la tabla psicologo_disponibilidad
      // IMPORTANTE: psicologo_id en esta tabla es el idUsuario del psicólogo, NO el id del psicólogo
      this.logger.log(`Buscando disponibilidad con usuario.id = ${psicologo.usuario.id}`);
      
      const disponibilidad = await this.disponibilidadRepository
        .createQueryBuilder('disp')
        .where('disp.psicologo_id = :usuarioId', { usuarioId: psicologo.usuario.id })
        .orderBy('disp.day', 'ASC')
        .getMany();

      this.logger.log(`Disponibilidad encontrada: ${disponibilidad.length} días`);

      // 7. Retornar información completa
      return {
        paciente: {
          id: paciente.id,
          idUsuarioPaciente: paciente.idUsuarioPaciente,
          nombre: usuarioPaciente?.nombre || 'N/A',
          email: usuarioPaciente?.email || 'N/A',
          fotoUrl: usuarioPaciente?.fotoUrl || null,
        },
        psicologo: {
          id: psicologo.id,
          idUsuario: psicologo.usuario.id,
          nombre: psicologo.usuario.nombre || 'N/A',
          email: psicologo.usuario.email || 'N/A',
          telefono: psicologo.usuario.telefono || 'N/A',
          fotoUrl: psicologo.usuario.fotoUrl || null,
          descripcion: psicologo.descripcion,
          experiencia: psicologo.experiencia,
          totalSesiones: countSesiones,
          disponibilidad: disponibilidad,
        }
      };

    } catch (error) {
      this.logger.error(`Error al buscar psicólogo para paciente ${pacienteId}: ${error.message}`);
      throw error;
    }
  }
}
