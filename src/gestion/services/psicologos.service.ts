import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Psicologo } from '../../common/entities/psicologo.entity';
import { User } from '../../common/entities/user.entity';
import { CreatePsicologoDto, UpdatePsicologoDto, PsicologoPublicDto } from '../../common/dto/psicologo.dto';
import { Reserva } from '../../common/entities/reserva.entity';
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

  async getPacientesAsignados(psicologoUserId: string): Promise<any[]> {
    const psicologo = await this.findByUserId(psicologoUserId);
    
    // Buscar reservas del psicólogo
    const reservas = await this.reservaRepository.find({
      where: { psicologoId: psicologoUserId },
      order: { fecha: 'DESC' }
    });

    // Por ahora, retornar un array vacío ya que no tenemos la relación paciente configurada
    // TODO: Implementar cuando se configure la relación paciente en la entidad Reserva
    return [];
    
    // Código comentado para cuando se configure la relación:
    /*
    // Buscar pacientes que tienen reservas con este psicólogo
    const reservas = await this.reservaRepository.find({
      where: { psicologoId: psicologoUserId },
      relations: ['paciente', 'paciente.usuario'],
      order: { fecha: 'DESC' }
    });

    // Agrupar por paciente y obtener la última reserva
    const pacientesMap = new Map();
    for (const reserva of reservas) {
      if (!pacientesMap.has(reserva.paciente.id)) {
        pacientesMap.set(reserva.paciente.id, {
          pacienteId: reserva.paciente.id,
          nombre: reserva.paciente.usuario.nombre,
          apellido: reserva.paciente.usuario.apellido,
          email: reserva.paciente.usuario.email,
          ultimaReserva: reserva.fecha,
          totalReservas: 1
        });
      } else {
        pacientesMap.get(reserva.paciente.id).totalReservas++;
      }
    }

    return Array.from(pacientesMap.values());
    */
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
