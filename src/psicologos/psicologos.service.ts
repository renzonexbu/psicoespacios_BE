import { Injectable } from '@nestjs/common';
import { CreatePsicologoDto } from './dto/create-psicologo.dto';
import { UpdatePsicologoDto } from './dto/update-psicologo.dto';
import { QueryDisponibilidadDiasDto } from './dto/query-disponibilidad-dias.dto';
import { QueryDisponibilidadHorariosDto } from './dto/query-disponibilidad-horarios.dto';
import { CreateReservaDto } from './dto/create-reserva.dto';
import { QueryHistorialTurnosDto } from './dto/query-historial-turnos.dto';
import { Psicologo } from './entities/psicologo.entity';
import { Reserva, EstadoReserva } from './entities/reserva.entity';
import { Disponibilidad } from './entities/disponibilidad.entity';
import { 
  ResourceNotFoundException, 
  BadRequestException, 
  DatabaseConnectionException, 
  ConflictException 
} from '../common/exceptions';

// Interfaces temporales para compatibilidad con el servicio existente
export interface DisponibilidadDia {
  fecha: string;
  disponible: boolean;
}

export interface HorarioSlot {
  horaInicio: string;
  horaFin: string;
  disponible: boolean;
}

@Injectable()
export class PsicologosService {
  // Aquí se debería inyectar el servicio de base de datos o el repositorio correspondiente.
  // Por ahora, usaremos arrays en memoria para simular la persistencia.
  private psicologos: Psicologo[] = [];
  private reservas: Reserva[] = [];
  private disponibilidades: any = {}; // Simulación de base de datos de disponibilidad

  create(createPsicologoDto: CreatePsicologoDto) {
    // Comprobación de datos
    if (!createPsicologoDto.nombre) {
      throw new BadRequestException('El nombre del psicólogo es obligatorio');
    }

    // Simular verificación de duplicados
    const existePsicologo = this.psicologos.some(p => 
      p.nombre && p.nombre.toLowerCase() === createPsicologoDto.nombre?.toLowerCase()
    );
    
    if (existePsicologo) {
      throw new ConflictException('Ya existe un psicólogo con ese nombre');
    }

    try {
      // Simular error de base de datos en algunas ocasiones
      if (Math.random() < 0.05) { // 5% de probabilidad de error
        throw new DatabaseConnectionException('Error al conectar con la base de datos para crear psicólogo');
      }

      const nuevoPsicologo: Psicologo = {
        id: String(this.psicologos.length + 1), // Simulación de ID autoincremental
        ...createPsicologoDto,
      };
      this.psicologos.push(nuevoPsicologo);
      return nuevoPsicologo;
    } catch (error) {
      // Manejar otros errores no esperados
      if (!(error instanceof DatabaseConnectionException)) {
        console.error('Error al crear psicólogo:', error);
        throw new BadRequestException('No se pudo crear el psicólogo debido a datos inválidos');
      }
      throw error;
    }
  }

  consultarDiasDisponibles(query: QueryDisponibilidadDiasDto): DisponibilidadDia[] {
    // Lógica para consultar días disponibles basada en psicologoId, mes, año, modalidad
    // Esto es una simulación, se necesitaría una lógica más compleja y acceso a datos reales.
    try {
      console.log('Query para días:', query);
      
      // Validar que el psicólogo existe
      const existePsicologo = this.psicologos.some(p => p.id === query.psicologoId);
      if (!existePsicologo) {
        throw new ResourceNotFoundException('psicólogo', query.psicologoId);
      }

      // Validar modalidad
      if (!['Online', 'Presencial'].includes(query.modalidad)) {
        throw new BadRequestException('La modalidad debe ser "Online" o "Presencial"');
      }

      const diasDelMes = new Date(query.año, query.mes, 0).getDate();
      const resultado: DisponibilidadDia[] = [];
      for (let i = 1; i <= diasDelMes; i++) {
        resultado.push({
          fecha: `${query.año}-${String(query.mes).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
          disponible: Math.random() > 0.3, // Simulación de disponibilidad
        });
      }
      return resultado;
    } catch (error) {
      if (error instanceof ResourceNotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new DatabaseConnectionException('Error al conectar con la base de datos para consultar disponibilidad');
    }
  }

  consultarHorariosDisponibles(query: QueryDisponibilidadHorariosDto): HorarioSlot[] {
    // Lógica para consultar horarios disponibles basada en psicologoId, fecha, modalidad
    try {
      console.log('Query para horarios:', query);
      
      // Validar que el psicólogo existe
      const existePsicologo = this.psicologos.some(p => p.id === query.psicologoId);
      if (!existePsicologo) {
        throw new ResourceNotFoundException('psicólogo', query.psicologoId);
      }

      // Validar modalidad
      if (!['Online', 'Presencial'].includes(query.modalidad)) {
        throw new BadRequestException('La modalidad debe ser "Online" o "Presencial"');
      }

      // Validar fecha
      const fechaConsulta = new Date(query.fecha);
      if (isNaN(fechaConsulta.getTime())) {
        throw new BadRequestException('La fecha proporcionada no es válida');
      }

      const horarios: HorarioSlot[] = [];
      for (let i = 9; i < 18; i++) {
        if (Math.random() > 0.5) { // Simular algunos horarios no disponibles
          horarios.push({ 
            horaInicio: `${String(i).padStart(2, '0')}:00`, 
            horaFin: `${String(i).padStart(2, '0')}:50`, 
            disponible: true 
          });
        }
      }
      return horarios;
    } catch (error) {
      if (error instanceof ResourceNotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new DatabaseConnectionException('Error al conectar con la base de datos para consultar horarios disponibles');
    }
  }

  reservarTurno(createReservaDto: CreateReservaDto) {
    // Simulación de reserva de turno
    try {
      console.log('Datos de la reserva:', createReservaDto);
      
      // Validar que el psicólogo existe
      const existePsicologo = this.psicologos.some(p => p.id === createReservaDto.psicologoId);
      if (!existePsicologo) {
        throw new ResourceNotFoundException('psicólogo', createReservaDto.psicologoId);
      }

      // Validar modalidad
      if (!['Online', 'Presencial'].includes(createReservaDto.modalidad)) {
        throw new BadRequestException('La modalidad debe ser "Online" o "Presencial"');
      }

      // Validar fecha y horas
      try {
        const fechaReserva = new Date(createReservaDto.fecha);
        if (isNaN(fechaReserva.getTime())) {
          throw new BadRequestException('La fecha proporcionada no es válida');
        }
      } catch (error) {
        throw new BadRequestException('La fecha proporcionada no es válida');
      }

      // Simular comprobación de disponibilidad
      const disponible = Math.random() > 0.2; // 80% de probabilidad de estar disponible
      if (!disponible) {
        throw new ConflictException('El horario seleccionado ya no está disponible');
      }

      // Crear la reserva
      const nuevaReserva: Reserva = {
        id: String(this.reservas.length + 1),
        psicologoId: createReservaDto.psicologoId,
        pacienteId: createReservaDto.pacienteId,
        fecha: createReservaDto.fecha,
        horaInicio: createReservaDto.horaInicio,
        horaFin: createReservaDto.horaFin,
        modalidad: createReservaDto.modalidad,
        estado: EstadoReserva.CONFIRMADA,
        createdAt: new Date().toISOString(),
      };
      this.reservas.push(nuevaReserva);
      return nuevaReserva;
    } catch (error) {
      if (error instanceof ResourceNotFoundException || 
          error instanceof BadRequestException ||
          error instanceof ConflictException) {
        throw error;
      }
      throw new DatabaseConnectionException('Error al conectar con la base de datos para reservar turno');
    }
  }

  historialTurnosPaciente(pacienteId: string, query: QueryHistorialTurnosDto) {
    // Simulación de historial de turnos
    try {
      console.log('Buscando historial para paciente:', pacienteId);
      
      // Filtrar reservas por pacienteId
      const reservasPaciente = this.reservas.filter(r => r.pacienteId === pacienteId);
      
      if (reservasPaciente.length === 0) {
        return { turnos: [], total: 0 };
      }
      
      return {
        turnos: reservasPaciente,
        total: reservasPaciente.length,
      };
    } catch (error) {
      throw new DatabaseConnectionException('Error al conectar con la base de datos para consultar historial de turnos');
    }
  }

  // Métodos CRUD básicos para Psicologos (simulación)
  findAll(): Psicologo[] {
    try {
      return this.psicologos;
    } catch (error) {
      throw new DatabaseConnectionException('Error al conectar con la base de datos para listar psicólogos');
    }
  }

  findOne(id: string): Psicologo {
    try {
      const psicologo = this.psicologos.find(p => p.id === id);
      if (!psicologo) {
        throw new ResourceNotFoundException('psicólogo', id);
      }
      return psicologo;
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        throw error;
      }
      throw new DatabaseConnectionException('Error al conectar con la base de datos para buscar psicólogo');
    }
  }

  update(id: string, updatePsicologoDto: UpdatePsicologoDto): Psicologo {
    try {
      const psicologoIndex = this.psicologos.findIndex(p => p.id === id);
      if (psicologoIndex === -1) {
        throw new ResourceNotFoundException('psicólogo', id);
      }
      
      // Verificar duplicados si se actualiza el nombre
      if (updatePsicologoDto.nombre) {
        const existeNombre = this.psicologos.some(
          (p, idx) => idx !== psicologoIndex && 
          p.nombre && p.nombre.toLowerCase() === updatePsicologoDto.nombre?.toLowerCase()
        );
        
        if (existeNombre) {
          throw new ConflictException('Ya existe otro psicólogo con ese nombre');
        }
      }
      
      this.psicologos[psicologoIndex] = {
        ...this.psicologos[psicologoIndex],
        ...updatePsicologoDto,
      };
      
      return this.psicologos[psicologoIndex];
    } catch (error) {
      if (error instanceof ResourceNotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new DatabaseConnectionException('Error al conectar con la base de datos para actualizar psicólogo');
    }
  }

  remove(id: string): { message: string } {
    try {
      const psicologoIndex = this.psicologos.findIndex(p => p.id === id);
      if (psicologoIndex === -1) {
        throw new ResourceNotFoundException('psicólogo', id);
      }
      
      // Verificar si tiene reservas activas
      const tieneReservasActivas = this.reservas.some(
        r => r.psicologoId === id && 
        [EstadoReserva.CONFIRMADA].includes(r.estado)
      );
      
      if (tieneReservasActivas) {
        throw new ConflictException('No se puede eliminar el psicólogo porque tiene reservas activas');
      }
      
      this.psicologos.splice(psicologoIndex, 1);
      return { message: `Psicólogo con ID ${id} eliminado.` };
    } catch (error) {
      if (error instanceof ResourceNotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new DatabaseConnectionException('Error al conectar con la base de datos para eliminar psicólogo');
    }
  }
}