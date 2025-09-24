import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Psicologo } from '../../common/entities/psicologo.entity';
import { User } from '../../common/entities/user.entity';
import { CreatePsicologoDto, UpdatePsicologoDto, PsicologoPublicDto } from '../../common/dto/psicologo.dto';
import { PacienteAsignadoDto } from '../dto/paciente-asignado.dto';
import { Reserva } from '../../common/entities/reserva.entity';
import { ReservaPsicologo } from '../../common/entities/reserva-psicologo.entity';
import { Paciente } from '../../common/entities/paciente.entity';

@Injectable()
export class PsicologosService {
  constructor(
    @InjectRepository(Psicologo)
    private psicologoRepository: Repository<Psicologo>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Reserva)
    private reservaRepository: Repository<Reserva>,
    @InjectRepository(ReservaPsicologo)
    private reservaPsicologoRepository: Repository<ReservaPsicologo>,
    @InjectRepository(Paciente)
    private pacienteRepository: Repository<Paciente>,
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

  async findAllPublic(): Promise<PsicologoPublicDto[]> {
    const psicologos = await this.psicologoRepository.find({
      relations: ['usuario'],
      where: { usuario: { estado: 'ACTIVO' } },
    });

    return psicologos.map(psicologo => ({
      id: psicologo.id,
      diagnosticos_experiencia: psicologo.diagnosticos_experiencia,
      temas_experiencia: psicologo.temas_experiencia,
      estilo_terapeutico: psicologo.estilo_terapeutico,
      afinidad_paciente_preferida: psicologo.afinidad_paciente_preferida,
      genero: psicologo.genero,
      numeroRegistroProfesional: psicologo.numeroRegistroProfesional,
      experiencia: psicologo.experiencia,
      descripcion: psicologo.descripcion,
      precioPresencial: psicologo.precioPresencial,
      precioOnline: psicologo.precioOnline,
      disponibilidad: psicologo.disponibilidad,
      usuario: {
        id: psicologo.usuario.id,
        nombre: psicologo.usuario.nombre,
        apellido: psicologo.usuario.apellido,
        fotoUrl: psicologo.usuario.fotoUrl,
        especialidad: psicologo.usuario.especialidad,
        estado: psicologo.usuario.estado,
      },
    }));
  }

  async findOne(id: string): Promise<Psicologo> {
    console.log('[PsicologosService] findOne - id:', id);
    const psicologo = await this.psicologoRepository.findOne({
      where: { id },
      relations: ['usuario']
    });
    console.log('[PsicologosService] findOne - resultado:', psicologo);
    if (!psicologo) {
      throw new NotFoundException('Psicólogo no encontrado');
    }
    return psicologo;
  }

  async findOnePublic(id: string): Promise<PsicologoPublicDto> {
    const psicologo = await this.psicologoRepository.findOne({
      where: { id, usuario: { estado: 'ACTIVO' } },
      relations: ['usuario'],
    });

    if (!psicologo) {
      throw new NotFoundException('Psicólogo no encontrado');
    }

    return {
      id: psicologo.id,
      diagnosticos_experiencia: psicologo.diagnosticos_experiencia,
      temas_experiencia: psicologo.temas_experiencia,
      estilo_terapeutico: psicologo.estilo_terapeutico,
      afinidad_paciente_preferida: psicologo.afinidad_paciente_preferida,
      genero: psicologo.genero,
      numeroRegistroProfesional: psicologo.numeroRegistroProfesional,
      experiencia: psicologo.experiencia,
      descripcion: psicologo.descripcion,
      precioPresencial: psicologo.precioPresencial,
      precioOnline: psicologo.precioOnline,
      disponibilidad: psicologo.disponibilidad,
      usuario: {
        id: psicologo.usuario.id,
        nombre: psicologo.usuario.nombre,
        apellido: psicologo.usuario.apellido,
        fotoUrl: psicologo.usuario.fotoUrl,
        especialidad: psicologo.usuario.especialidad,
        estado: psicologo.usuario.estado,
      },
    };
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
    console.log('[PsicologosService] update - id:', id, 'body:', updatePsicologoDto);
    const psicologo = await this.findOne(id);
    
    Object.assign(psicologo, updatePsicologoDto);
    
    return await this.psicologoRepository.save(psicologo);
  }

  async remove(id: string): Promise<void> {
    const psicologo = await this.findOne(id);
    await this.psicologoRepository.remove(psicologo);
  }

  async disponibilidadDias(id: string, mes: number, anio: number): Promise<{ fecha: string, disponible: boolean }[]> {
    const psicologo = await this.findOne(id);
    if (!psicologo || !psicologo.disponibilidad) {
      throw new NotFoundException('Disponibilidad no encontrada para este psicólogo');
    }
    // Obtener cantidad de días del mes
    const diasEnMes = new Date(anio, mes, 0).getDate();
    const resultado: { fecha: string, disponible: boolean }[] = [];
    for (let dia = 1; dia <= diasEnMes; dia++) {
      const fecha = `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
      // Verificar si hay disponibilidad para ese día
      let disponible = false;
      // Suponemos que la disponibilidad es un objeto tipo { lunes: [...], miercoles: [...] }
      const dateObj = new Date(anio, mes - 1, dia);
      const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
      const diaSemana = diasSemana[dateObj.getDay()];
      if (psicologo.disponibilidad[diaSemana] && psicologo.disponibilidad[diaSemana].length > 0) {
        disponible = true;
      }
      resultado.push({ fecha, disponible });
    }
    return resultado;
  }

  async disponibilidadHorarios(id: string, fecha: string): Promise<string[]> {
    const psicologo = await this.findOne(id);
    if (!psicologo || !psicologo.disponibilidad) {
      throw new NotFoundException('Disponibilidad no encontrada para este psicólogo');
    }
    // fecha: YYYY-MM-DD
    // Corregir: parsear como local para evitar desfase de día
    const [year, month, day] = fecha.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    if (isNaN(dateObj.getTime())) {
      throw new BadRequestException('Fecha inválida');
    }
    const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const diaSemana = diasSemana[dateObj.getDay()];
    console.log('Día consultado:', diaSemana);
    console.log('Claves de disponibilidad:', Object.keys(psicologo.disponibilidad));
    // Horarios base disponibles para ese día
    const franjas: string[] = psicologo.disponibilidad[diaSemana] || [];
    // Generar bloques de 1 hora por franja
    const bloques: string[] = [];
    for (const franja of franjas) {
      const [inicio, fin] = franja.split('-');
      let [hIni, mIni] = inicio.split(':').map(Number);
      let [hFin, mFin] = fin.split(':').map(Number);
      let current = new Date(dateObj);
      current.setHours(hIni, mIni, 0, 0);
      const end = new Date(dateObj);
      end.setHours(hFin, mFin, 0, 0);
      while (current < end) {
        const next = new Date(current);
        next.setHours(current.getHours() + 1);
        if (next > end) break;
        const bloque = `${current.toTimeString().slice(0,5)}-${next.toTimeString().slice(0,5)}`;
        bloques.push(bloque);
        current = next;
      }
    }
    // Buscar reservas existentes para ese psicólogo y fecha
    const reservas = await this.reservaRepository.find({
      where: { psicologoId: psicologo.usuario.id, fecha: new Date(fecha) },
    });
    // Filtrar bloques ocupados
    const bloquesOcupados = reservas.map(r => `${r.horaInicio}-${r.horaFin}`);
    const bloquesLibres = bloques.filter(b => !bloquesOcupados.includes(b));
    return bloquesLibres;
  }

  async getPacientesAsignados(psicologoUserId: string): Promise<PacienteAsignadoDto[]> {
    // Buscar pacientes asignados directamente desde la tabla pacientes
    const pacientes = await this.pacienteRepository.find({
      where: { idUsuarioPsicologo: psicologoUserId },
      order: { primeraSesionRegistrada: 'DESC' }
    });

    if (pacientes.length === 0) {
      return [];
    }

    // Obtener información completa de los usuarios (pacientes) y calcular próxima sesión
    const pacientesConInfo = await Promise.all(
      pacientes.map(async (paciente) => {
        const usuarioPaciente = await this.userRepository.findOne({
          where: { id: paciente.idUsuarioPaciente }
        });

        if (!usuarioPaciente) {
          return null; // Usuario no encontrado, omitir
        }

        // Calcular la próxima sesión basándose en las reservas futuras
        // El psicologoUserId ya es el ID del psicólogo (no del usuario)
        const proximaSesion = await this.calcularProximaSesion(paciente.idUsuarioPaciente, psicologoUserId);

        return {
          id: paciente.id,
          pacienteId: paciente.idUsuarioPaciente,
          nombre: usuarioPaciente.nombre,
          apellido: usuarioPaciente.apellido,
          rut: usuarioPaciente.rut,
          email: usuarioPaciente.email,
          telefono: usuarioPaciente.telefono,
          fechaNacimiento: usuarioPaciente.fechaNacimiento,
          fotoUrl: usuarioPaciente.fotoUrl,
          primeraSesionRegistrada: paciente.primeraSesionRegistrada,
          proximaSesion: proximaSesion,
          estado: paciente.estado || 'ACTIVO',
          tag: paciente.tag
        };
      })
    );

    // Filtrar pacientes nulos y retornar
    return pacientesConInfo.filter(paciente => paciente !== null);
  }

  /**
   * Calcula la próxima sesión de un paciente basándose en las reservas futuras
   */
  private async calcularProximaSesion(pacienteId: string, psicologoId: string): Promise<Date | null> {
    try {
      console.log(`[DEBUG] Calculando próxima sesión para paciente: ${pacienteId}, psicólogo: ${psicologoId}`);
      
      // Buscar la próxima reserva futura del paciente con este psicólogo
      // La tabla reservas_sesiones tiene:
      // - paciente_id: referencia al usuario paciente (pacienteId)
      // - psicologo_id: referencia al psicólogo (psicologoId)
      const proximaReserva = await this.reservaPsicologoRepository
        .createQueryBuilder('reserva')
        .where('reserva.paciente.id = :pacienteId', { pacienteId })
        .andWhere('reserva.psicologo.id = :psicologoId', { psicologoId })
        .andWhere('reserva.fecha >= :hoy', { hoy: new Date() })
        .andWhere('reserva.estado IN (:...estados)', { 
          estados: ['PENDIENTE', 'CONFIRMADA'] 
        })
        .orderBy('reserva.fecha', 'ASC')
        .addOrderBy('reserva.horaInicio', 'ASC')
        .getOne();

      console.log(`[DEBUG] Reserva encontrada:`, proximaReserva);

      if (proximaReserva) {
        // Combinar fecha y hora para crear un objeto Date completo
        const fechaSesion = new Date(proximaReserva.fecha);
        const [hora, minuto] = proximaReserva.horaInicio.split(':').map(Number);
        fechaSesion.setHours(hora, minuto, 0, 0);
        console.log(`[DEBUG] Fecha calculada: ${fechaSesion.toISOString()}`);
        return fechaSesion;
      }

      console.log(`[DEBUG] No se encontró próxima sesión`);
      return null; // No hay próxima sesión programada
    } catch (error) {
      console.error('Error calculando próxima sesión:', error);
      return null;
    }
  }

  // Métodos para gestionar precios
  async getPrecios(usuarioId: string): Promise<{ precioOnline: number | null; precioPresencial: number | null; updatedAt: Date }> {
    const psicologo = await this.findByUserId(usuarioId);
    
    return {
      precioOnline: psicologo.precioOnline,
      precioPresencial: psicologo.precioPresencial,
      updatedAt: psicologo.updatedAt
    };
  }

  async updatePrecios(usuarioId: string, precios: { precioOnline?: number; precioPresencial?: number }): Promise<{ precioOnline: number | null; precioPresencial: number | null; updatedAt: Date }> {
    const psicologo = await this.findByUserId(usuarioId);
    
    // Actualizar solo los precios proporcionados
    if (precios.precioOnline !== undefined) {
      psicologo.precioOnline = precios.precioOnline;
    }
    if (precios.precioPresencial !== undefined) {
      psicologo.precioPresencial = precios.precioPresencial;
    }
    
    // Guardar cambios
    const psicologoActualizado = await this.psicologoRepository.save(psicologo);
    
    return {
      precioOnline: psicologoActualizado.precioOnline,
      precioPresencial: psicologoActualizado.precioPresencial,
      updatedAt: psicologoActualizado.updatedAt
    };
  }
}
