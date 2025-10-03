import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, DataSource, MoreThanOrEqual, In } from 'typeorm';
import { ReservaPsicologo, EstadoReservaPsicologo, ModalidadSesion } from '../common/entities/reserva-psicologo.entity';
import { Reserva, EstadoReserva, EstadoPagoReserva } from '../common/entities/reserva.entity';
import { User } from '../common/entities/user.entity';
import { Psicologo } from '../common/entities/psicologo.entity';
import { Box } from '../common/entities/box.entity';
import { Paciente } from '../common/entities/paciente.entity';
import { MailService } from '../mail/mail.service';
import { 
  CreateReservaPsicologoDto, 
  UpdateReservaPsicologoDto, 
  ReservaPsicologoResponseDto, 
  QueryReservasPsicologoDto 
} from './dto/reserva-psicologo.dto';

@Injectable()
export class ReservasPsicologosService {
  private readonly logger = new Logger(ReservasPsicologosService.name);

  constructor(
    @InjectRepository(ReservaPsicologo)
    private readonly reservaPsicologoRepository: Repository<ReservaPsicologo>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Psicologo)
    private readonly psicologoRepository: Repository<Psicologo>,
    @InjectRepository(Box)
    private readonly boxRepository: Repository<Box>,
    @InjectRepository(Paciente)
    private readonly pacienteRepository: Repository<Paciente>,
    private readonly dataSource: DataSource,
    private readonly mailService: MailService,
  ) {}

  /**
   * Crear una nueva reserva de sesión con psicólogo
   */
  async create(createReservaDto: CreateReservaPsicologoDto): Promise<ReservaPsicologoResponseDto> {
    this.logger.log(`Creando reserva de sesión: psicólogo ${createReservaDto.psicologoId}, paciente ${createReservaDto.pacienteId}`);

    // Usar transacción para asegurar consistencia
    return await this.dataSource.transaction(async (manager) => {
      
      // 1. Verificar que el psicólogo existe
      // El psicologoId puede ser el ID del psicólogo o el ID del usuario psicólogo
      let psicologo = await manager.findOne(Psicologo, {
        where: { id: createReservaDto.psicologoId },
        relations: ['usuario']
      });

      // Si no se encuentra por ID directo, buscar por usuario.id
      if (!psicologo) {
        psicologo = await manager.findOne(Psicologo, {
          where: { usuario: { id: createReservaDto.psicologoId } },
          relations: ['usuario']
        });
      }

      if (!psicologo) {
        throw new NotFoundException('Psicólogo no encontrado');
      }

      // 2. Verificar que el paciente existe
      const paciente = await manager.findOne(User, {
        where: { id: createReservaDto.pacienteId }
      });

      if (!paciente) {
        throw new NotFoundException('Paciente no encontrado');
      }

      // 3. Crear o actualizar registro en tabla pacientes
      let pacienteRecord = await manager.findOne(Paciente, {
        where: { idUsuarioPaciente: createReservaDto.pacienteId }
      });

      if (pacienteRecord) {
        // Actualizar psicólogo existente
        this.logger.log(`Actualizando paciente existente: ${pacienteRecord.id}`);
        pacienteRecord.idUsuarioPsicologo = createReservaDto.psicologoId;
        pacienteRecord.ultima_actualizacion_matching = new Date();
        pacienteRecord.estado = 'ACTIVO';
      } else {
        // Crear nuevo paciente
        this.logger.log(`Creando nuevo paciente para usuario: ${createReservaDto.pacienteId}`);
        pacienteRecord = manager.create(Paciente, {
          idUsuarioPaciente: createReservaDto.pacienteId,
          idUsuarioPsicologo: createReservaDto.psicologoId,
          primeraSesionRegistrada: new Date(),
          estado: 'ACTIVO',
          perfil_matching_completado: false,
          diagnosticos_principales: [],
          temas_principales: [],
          estilo_terapeutico_preferido: [],
          enfoque_teorico_preferido: [],
          afinidad_personal_preferida: [],
          modalidad_preferida: [],
          genero_psicologo_preferido: []
        });
      }

      await manager.save(pacienteRecord);
      this.logger.log(`Paciente ${pacienteRecord.id} guardado/actualizado exitosamente`);

      // 4. Validar boxId para sesiones presenciales
      if (createReservaDto.modalidad === ModalidadSesion.PRESENCIAL) {
        if (!createReservaDto.boxId) {
          throw new BadRequestException('boxId es requerido para sesiones presenciales');
        }

        const box = await manager.findOne(Box, {
          where: { id: createReservaDto.boxId }
        });

        if (!box) {
          throw new NotFoundException('Box no encontrado');
        }

        if (box.estado !== 'DISPONIBLE') {
          throw new BadRequestException('El box seleccionado no está disponible');
        }

        // Verificar que no hay conflicto de horarios para el box
        const conflictoBox = await this.verificarConflictoHorariosBox(
          createReservaDto.boxId,
          createReservaDto.fecha,
          createReservaDto.horaInicio,
          createReservaDto.horaFin
        );

        if (conflictoBox) {
          throw new BadRequestException('Ya existe una reserva en ese horario para este box');
        }
      } else if (createReservaDto.boxId) {
        throw new BadRequestException('boxId no debe ser proporcionado para sesiones online');
      }

      // 5. Verificar que no hay conflicto de horarios para el psicólogo
      const conflicto = await this.verificarConflictoHorarios(
        createReservaDto.psicologoId,
        createReservaDto.fecha,
        createReservaDto.horaInicio,
        createReservaDto.horaFin
      );

      if (conflicto) {
        throw new BadRequestException('Ya existe una reserva en ese horario para este psicólogo');
      }

      // 6. Crear la reserva
      // Corregir problema de timezone: crear fecha en zona horaria local
      const fechaLocal = new Date(createReservaDto.fecha + 'T00:00:00');
      
      // Log para debugging de fechas
      this.logger.log(`📅 Fecha recibida: ${createReservaDto.fecha}`);
      this.logger.log(`📅 Fecha procesada: ${fechaLocal.toISOString()}`);
      this.logger.log(`📅 Fecha local: ${fechaLocal.toLocaleDateString('es-CL', { timeZone: 'America/Santiago' })}`);
      
      const reserva = manager.create(ReservaPsicologo, {
        psicologo: { id: createReservaDto.psicologoId },
        paciente: { id: createReservaDto.pacienteId },
        fecha: fechaLocal,
        horaInicio: createReservaDto.horaInicio,
        horaFin: createReservaDto.horaFin,
        boxId: createReservaDto.boxId,
        modalidad: createReservaDto.modalidad || ModalidadSesion.PRESENCIAL,
        estado: EstadoReservaPsicologo.CONFIRMADA, // Cambiado a CONFIRMADA
        observaciones: createReservaDto.observaciones,
        cuponId: createReservaDto.cuponId,
        descuentoAplicado: createReservaDto.descuentoAplicado || 0,
        metadatos: {
          ...(createReservaDto.metadatos || {}),
          pagoId: undefined, // Se actualizará cuando se confirme el pago
          cuponInfo: createReservaDto.cuponId ? {
            id: createReservaDto.cuponId,
            // La información completa del cupón se puede obtener del voucher
          } : undefined,
        },
      });

      const savedReserva = await manager.save(reserva);
      this.logger.log(`Reserva creada con ID: ${savedReserva.id}`);

      // 7. Crear reserva de box automáticamente para sesiones presenciales
      this.logger.log(`🔍 Verificando condiciones para reserva de box:`);
      this.logger.log(`   - Modalidad: ${createReservaDto.modalidad}`);
      this.logger.log(`   - ModalidadSesion.PRESENCIAL: ${ModalidadSesion.PRESENCIAL}`);
      this.logger.log(`   - boxId: ${createReservaDto.boxId}`);
      this.logger.log(`   - Condición modalidad: ${createReservaDto.modalidad === ModalidadSesion.PRESENCIAL}`);
      this.logger.log(`   - Condición boxId: ${!!createReservaDto.boxId}`);
      
      if (createReservaDto.modalidad === ModalidadSesion.PRESENCIAL && createReservaDto.boxId) {
        this.logger.log(`✅ Creando reserva de box automática para sesión presencial`);
        
        // Obtener información del box para calcular precio
        const box = await manager.findOne(Box, {
          where: { id: createReservaDto.boxId },
          relations: ['sede']
        });

        if (box) {
          // Calcular precio del box (puedes ajustar esta lógica según tu modelo de precios)
          const precioBox = this.calcularPrecioBox(box, createReservaDto.horaInicio, createReservaDto.horaFin);
          
          // Crear reserva de box en la tabla reservas
          const reservaBox = manager.create(Reserva, {
            boxId: createReservaDto.boxId,
            psicologoId: psicologo.usuario.id, // Usar el ID del usuario psicólogo
            fecha: fechaLocal,
            horaInicio: createReservaDto.horaInicio,
            horaFin: createReservaDto.horaFin,
            precio: precioBox,
            estado: EstadoReserva.CONFIRMADA,
            estadoPago: EstadoPagoReserva.PENDIENTE_PAGO // Por defecto pendiente hasta que se confirme el pago
          });

          const savedReservaBox = await manager.save(reservaBox);
          this.logger.log(`Reserva de box creada con ID: ${savedReservaBox.id} - Precio: $${precioBox}`);
          
          // Actualizar metadatos de la sesión con información del box
          savedReserva.metadatos = {
            ...savedReserva.metadatos,
            reservaBoxId: savedReservaBox.id,
            precioBox: precioBox,
            ubicacion: `${box.sede?.nombre || 'Sede'} - Box ${box.numero}`
          };
          
          await manager.save(savedReserva);
        } else {
          this.logger.warn(`❌ Box no encontrado con ID: ${createReservaDto.boxId}`);
        }
      } else {
        this.logger.log(`❌ No se creará reserva de box - Modalidad: ${createReservaDto.modalidad}, boxId: ${createReservaDto.boxId}`);
      }

      // 8. Enviar email de confirmación (fuera de la transacción)
      try {
        await this.mailService.sendReservaConfirmada(
          paciente.email,
          psicologo.usuario.nombre,
          createReservaDto.fecha,
          createReservaDto.horaInicio,
          createReservaDto.modalidad || ModalidadSesion.PRESENCIAL,
          createReservaDto.metadatos?.ubicacion
        );
        this.logger.log(`Email de confirmación enviado a ${paciente.email}`);
      } catch (error) {
        this.logger.error(`Error al enviar email de confirmación: ${error.message}`);
        // No fallar la operación si el email falla
      }

      // 8. Retornar respuesta completa
      // Obtener información del box si existe
      let box: Box | undefined;
      if (savedReserva.boxId) {
        const foundBox = await manager.findOne(Box, {
          where: { id: savedReserva.boxId },
          relations: ['sede']
        });
        box = foundBox || undefined;
      }

      return this.mapToResponseDto(savedReserva, psicologo.usuario, paciente, box);
    });
  }

  /**
   * Obtener todas las reservas con filtros
   */
  async findAll(query: QueryReservasPsicologoDto): Promise<ReservaPsicologoResponseDto[]> {
    this.logger.log('Obteniendo reservas de psicólogos con filtros');

    const queryBuilder = this.reservaPsicologoRepository
      .createQueryBuilder('reserva')
      .leftJoinAndSelect('reserva.psicologo', 'psicologo')
      .leftJoinAndSelect('psicologo.usuario', 'psicologoUsuario')
      .leftJoinAndSelect('reserva.paciente', 'paciente')
      .leftJoinAndSelect('Box', 'box', 'box.id = reserva.boxId')
      .leftJoinAndSelect('box.sede', 'sede')
      .orderBy('reserva.fecha', 'DESC')
      .addOrderBy('reserva.horaInicio', 'ASC');

    // Aplicar filtros
    if (query.psicologoId) {
      queryBuilder.andWhere('reserva.psicologo.id = :psicologoId', { psicologoId: query.psicologoId });
    }

    if (query.pacienteId) {
      queryBuilder.andWhere('reserva.paciente.id = :pacienteId', { pacienteId: query.pacienteId });
    }

    if (query.fechaDesde && query.fechaHasta) {
      queryBuilder.andWhere('reserva.fecha BETWEEN :fechaDesde AND :fechaHasta', {
        fechaDesde: new Date(query.fechaDesde),
        fechaHasta: new Date(query.fechaHasta),
      });
    }

    if (query.modalidad) {
      queryBuilder.andWhere('reserva.modalidad = :modalidad', { modalidad: query.modalidad });
    }

    if (query.estado) {
      queryBuilder.andWhere('reserva.estado = :estado', { estado: query.estado });
    }

    const reservas = await queryBuilder.getMany();
    
    // Obtener información de boxes para las reservas que tienen boxId
    const boxIds = reservas
      .filter(reserva => reserva.boxId)
      .map(reserva => reserva.boxId);
    
    let boxesMap = new Map();
    if (boxIds.length > 0) {
      const boxes = await this.boxRepository.find({
        where: boxIds.length === 1 ? { id: boxIds[0] } : { id: In(boxIds) },
        relations: ['sede']
      });
      boxesMap = new Map(boxes.map(box => [box.id, box]));
    }
    
    return reservas.map(reserva => {
      const box = reserva.boxId ? boxesMap.get(reserva.boxId) : undefined;
      return this.mapToResponseDto(reserva, reserva.psicologo.usuario, reserva.paciente, box);
    });
  }

  /**
   * Obtener todas las reservas de una sede específica
   */
  async findBySede(sedeId: string, query?: QueryReservasPsicologoDto): Promise<ReservaPsicologoResponseDto[]> {
    this.logger.log(`Obteniendo reservas de la sede: ${sedeId}`);

    const queryBuilder = this.reservaPsicologoRepository
      .createQueryBuilder('reserva')
      .leftJoinAndSelect('reserva.psicologo', 'psicologo')
      .leftJoinAndSelect('psicologo.usuario', 'psicologoUsuario')
      .leftJoinAndSelect('reserva.paciente', 'paciente')
      .leftJoinAndSelect('reserva.box', 'box')
      .leftJoinAndSelect('box.sede', 'sede')
      .where('sede.id = :sedeId', { sedeId })
      .orderBy('reserva.fecha', 'DESC')
      .addOrderBy('reserva.horaInicio', 'ASC');

    // Aplicar filtros adicionales si se proporcionan
    if (query) {
      if (query.psicologoId) {
        queryBuilder.andWhere('reserva.psicologo.id = :psicologoId', { psicologoId: query.psicologoId });
      }

      if (query.pacienteId) {
        queryBuilder.andWhere('reserva.paciente.id = :pacienteId', { pacienteId: query.pacienteId });
      }

      if (query.fechaDesde && query.fechaHasta) {
        queryBuilder.andWhere('reserva.fecha BETWEEN :fechaDesde AND :fechaHasta', {
          fechaDesde: new Date(query.fechaDesde),
          fechaHasta: new Date(query.fechaHasta),
        });
      }

      if (query.modalidad) {
        queryBuilder.andWhere('reserva.modalidad = :modalidad', { modalidad: query.modalidad });
      }

      if (query.estado) {
        queryBuilder.andWhere('reserva.estado = :estado', { estado: query.estado });
      }
    }

    const reservas = await queryBuilder.getMany();
    
    // Obtener información de boxes para las reservas que tienen boxId
    const boxIds = reservas
      .filter(reserva => reserva.boxId)
      .map(reserva => reserva.boxId);
    
    let boxesMap = new Map();
    if (boxIds.length > 0) {
      const boxes = await this.boxRepository.find({
        where: boxIds.length === 1 ? { id: boxIds[0] } : { id: In(boxIds) },
        relations: ['sede']
      });
      boxesMap = new Map(boxes.map(box => [box.id, box]));
    }
    
    return reservas.map(reserva => {
      const box = reserva.boxId ? boxesMap.get(reserva.boxId) : undefined;
      return this.mapToResponseDto(reserva, reserva.psicologo.usuario, reserva.paciente, box);
    });
  }

  /**
   * Obtener una reserva específica
   */
  async findOne(id: string): Promise<ReservaPsicologoResponseDto> {
    this.logger.log(`Obteniendo reserva: ${id}`);

    const reserva = await this.reservaPsicologoRepository.findOne({
      where: { id },
      relations: ['psicologo', 'psicologo.usuario', 'paciente'],
    });

    if (!reserva) {
      throw new NotFoundException('Reserva no encontrada');
    }

    // Obtener información del box si existe
    let box: Box | undefined;
    if (reserva.boxId) {
      const foundBox = await this.boxRepository.findOne({
        where: { id: reserva.boxId },
        relations: ['sede']
      });
      box = foundBox || undefined;
    }

    return this.mapToResponseDto(reserva, reserva.psicologo.usuario, reserva.paciente, box);
  }

  /**
   * Obtener reservas de un psicólogo específico
   */
  async findByPsicologo(psicologoId: string): Promise<ReservaPsicologoResponseDto[]> {
    this.logger.log(`Obteniendo reservas del psicólogo: ${psicologoId}`);

    const reservas = await this.reservaPsicologoRepository.find({
      where: { psicologo: { id: psicologoId } },
      relations: ['psicologo', 'psicologo.usuario', 'paciente'],
      order: { fecha: 'DESC', horaInicio: 'ASC' },
    });

    // Obtener información de boxes para las reservas que tienen boxId
    const boxIds = reservas
      .filter(reserva => reserva.boxId)
      .map(reserva => reserva.boxId);
    
    let boxesMap = new Map();
    if (boxIds.length > 0) {
      const boxes = await this.boxRepository.find({
        where: boxIds.length === 1 ? { id: boxIds[0] } : { id: In(boxIds) },
        relations: ['sede']
      });
      boxesMap = new Map(boxes.map(box => [box.id, box]));
    }

    return reservas.map(reserva => {
      const box = reserva.boxId ? boxesMap.get(reserva.boxId) : undefined;
      return this.mapToResponseDto(reserva, reserva.psicologo.usuario, reserva.paciente, box);
    });
  }

  /**
   * Obtener reservas de un paciente específico por su ID de paciente
   */
  async findByPaciente(pacienteId: string): Promise<ReservaPsicologoResponseDto[]> {
    this.logger.log(`Obteniendo reservas del paciente: ${pacienteId}`);

    const reservas = await this.reservaPsicologoRepository.find({
      where: { paciente: { id: pacienteId } },
      relations: ['psicologo', 'psicologo.usuario', 'paciente'],
      order: { fecha: 'DESC', horaInicio: 'ASC' },
    });

    // Obtener información de boxes para las reservas que tienen boxId
    const boxIds = reservas
      .filter(reserva => reserva.boxId)
      .map(reserva => reserva.boxId);
    
    let boxesMap = new Map();
    if (boxIds.length > 0) {
      const boxes = await this.boxRepository.find({
        where: boxIds.length === 1 ? { id: boxIds[0] } : { id: In(boxIds) },
        relations: ['sede']
      });
      boxesMap = new Map(boxes.map(box => [box.id, box]));
    }

    return reservas.map(reserva => {
      const box = reserva.boxId ? boxesMap.get(reserva.boxId) : undefined;
      return this.mapToResponseDto(reserva, reserva.psicologo.usuario, reserva.paciente, box);
    });
  }

  /**
   * Obtener reservas de un paciente por su usuarioId
   */
  async findByUsuarioPaciente(usuarioId: string): Promise<ReservaPsicologoResponseDto[]> {
    this.logger.log(`Obteniendo reservas del paciente por usuarioId: ${usuarioId}`);

    // Buscar reservas directamente por el usuarioId del paciente
    const reservas = await this.reservaPsicologoRepository.find({
      where: { paciente: { id: usuarioId } },
      relations: ['psicologo', 'psicologo.usuario', 'paciente'],
      order: { fecha: 'DESC', horaInicio: 'ASC' },
    });

    this.logger.log(`Reservas encontradas para usuario ${usuarioId}: ${reservas.length}`);

    // Obtener información de boxes para las reservas que tienen boxId
    const boxIds = reservas
      .filter(reserva => reserva.boxId)
      .map(reserva => reserva.boxId);
    
    let boxesMap = new Map();
    if (boxIds.length > 0) {
      const boxes = await this.boxRepository.find({
        where: boxIds.length === 1 ? { id: boxIds[0] } : { id: In(boxIds) },
        relations: ['sede']
      });
      boxesMap = new Map(boxes.map(box => [box.id, box]));
    }

    return reservas.map(reserva => {
      const box = reserva.boxId ? boxesMap.get(reserva.boxId) : undefined;
      return this.mapToResponseDto(reserva, reserva.psicologo.usuario, reserva.paciente, box);
    });
  }

  /**
   * Obtener reservas de un psicólogo por su usuarioId
   */
  async findByUsuarioPsicologo(usuarioId: string, soloFuturas: boolean = false): Promise<ReservaPsicologoResponseDto[]> {
    this.logger.log(`Obteniendo reservas del psicólogo por usuarioId: ${usuarioId}, soloFuturas: ${soloFuturas}`);

    // Primero obtener el psicólogo por usuarioId
    const psicologo = await this.psicologoRepository.findOne({
      where: { usuario: { id: usuarioId } },
      relations: ['usuario']
    });

    if (!psicologo) {
      throw new NotFoundException('Psicólogo no encontrado para este usuario');
    }

    // Construir condiciones de búsqueda
    const whereConditions: any = { psicologo: { id: psicologo.id } };

    // Si soloFuturas es true, filtrar solo sesiones del día actual en adelante
    if (soloFuturas) {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0); // Inicio del día actual
      
      whereConditions.fecha = MoreThanOrEqual(hoy);
    }

    // Luego obtener las reservas del psicólogo
    const reservas = await this.reservaPsicologoRepository.find({
      where: whereConditions,
      relations: ['psicologo', 'psicologo.usuario', 'paciente'],
      order: { fecha: 'ASC', horaInicio: 'ASC' }, // Ordenar por fecha ascendente para sesiones futuras
    });

    this.logger.log(`Reservas encontradas: ${reservas.length}`);
    
    // Obtener información de boxes para las reservas que tienen boxId
    const boxIds = reservas
      .filter(reserva => reserva.boxId)
      .map(reserva => reserva.boxId);
    
    let boxesMap = new Map();
    if (boxIds.length > 0) {
      const boxes = await this.boxRepository.find({
        where: boxIds.length === 1 ? { id: boxIds[0] } : { id: In(boxIds) },
        relations: ['sede']
      });
      boxesMap = new Map(boxes.map(box => [box.id, box]));
    }

    return reservas.map(reserva => {
      const box = reserva.boxId ? boxesMap.get(reserva.boxId) : undefined;
      return this.mapToResponseDto(reserva, reserva.psicologo.usuario, reserva.paciente, box);
    });
  }

  /**
   * Actualizar una reserva
   */
  async update(id: string, updateReservaDto: UpdateReservaPsicologoDto): Promise<ReservaPsicologoResponseDto> {
    this.logger.log(`Actualizando reserva: ${id}`);

    const reserva = await this.reservaPsicologoRepository.findOne({
      where: { id },
      relations: ['psicologo', 'psicologo.usuario', 'paciente'],
    });

    if (!reserva) {
      throw new NotFoundException('Reserva no encontrada');
    }

    // Verificar conflicto de horarios si se cambia la fecha/hora
    if (updateReservaDto.fecha || updateReservaDto.horaInicio || updateReservaDto.horaFin) {
      const fecha = updateReservaDto.fecha || reserva.fecha.toISOString().split('T')[0];
      const horaInicio = updateReservaDto.horaInicio || reserva.horaInicio;
      const horaFin = updateReservaDto.horaFin || reserva.horaFin;

      const conflicto = await this.verificarConflictoHorarios(
        reserva.psicologo.id,
        fecha,
        horaInicio,
        horaFin,
        id // excluir la reserva actual
      );

      if (conflicto) {
        throw new BadRequestException('Ya existe una reserva en ese horario para este psicólogo');
      }

      // Verificar conflicto de horarios para box si es presencial
      const modalidad = updateReservaDto.modalidad || reserva.modalidad;
      const boxId = updateReservaDto.boxId || reserva.boxId;

      if (modalidad === ModalidadSesion.PRESENCIAL && boxId) {
        const conflictoBox = await this.verificarConflictoHorariosBox(
          boxId,
          fecha,
          horaInicio,
          horaFin,
          id // excluir la reserva actual
        );

        if (conflictoBox) {
          throw new BadRequestException('Ya existe una reserva en ese horario para este box');
        }
      }
    }

    // Validar boxId si se cambia la modalidad
    if (updateReservaDto.modalidad) {
      if (updateReservaDto.modalidad === ModalidadSesion.PRESENCIAL) {
        if (!updateReservaDto.boxId && !reserva.boxId) {
          throw new BadRequestException('boxId es requerido para sesiones presenciales');
        }

        if (updateReservaDto.boxId) {
          const box = await this.boxRepository.findOne({
            where: { id: updateReservaDto.boxId }
          });

          if (!box) {
            throw new NotFoundException('Box no encontrado');
          }

          if (box.estado !== 'DISPONIBLE') {
            throw new BadRequestException('El box seleccionado no está disponible');
          }
        }
      } else if (updateReservaDto.boxId) {
        throw new BadRequestException('boxId no debe ser proporcionado para sesiones online');
      }
    }

    // Actualizar la reserva
    Object.assign(reserva, updateReservaDto);
    if (updateReservaDto.fecha) {
      reserva.fecha = new Date(updateReservaDto.fecha);
    }

    const updatedReserva = await this.reservaPsicologoRepository.save(reserva);
    this.logger.log(`Reserva actualizada: ${id}`);

    // Obtener información del box si existe
    let box: Box | undefined;
    if (updatedReserva.boxId) {
      const foundBox = await this.boxRepository.findOne({
        where: { id: updatedReserva.boxId },
        relations: ['sede']
      });
      box = foundBox || undefined;
    }

    return this.mapToResponseDto(updatedReserva, reserva.psicologo.usuario, reserva.paciente, box);
  }

  /**
   * Cancelar una reserva
   */
  async cancel(id: string): Promise<ReservaPsicologoResponseDto> {
    this.logger.log(`Cancelando reserva: ${id}`);

    return await this.dataSource.transaction(async (manager) => {
      const reserva = await manager.findOne(ReservaPsicologo, {
        where: { id },
        relations: ['psicologo', 'psicologo.usuario', 'paciente'],
      });

      if (!reserva) {
        throw new NotFoundException('Reserva no encontrada');
      }

      if (reserva.estado === EstadoReservaPsicologo.CANCELADA) {
        throw new BadRequestException('La reserva ya está cancelada');
      }

      // Cancelar reserva de box si existe (para sesiones presenciales)
      if (reserva.modalidad === ModalidadSesion.PRESENCIAL && reserva.metadatos?.reservaBoxId) {
        this.logger.log(`Cancelando reserva de box asociada: ${reserva.metadatos.reservaBoxId}`);
        
        const reservaBox = await manager.findOne(Reserva, {
          where: { id: reserva.metadatos.reservaBoxId }
        });

        if (reservaBox) {
          reservaBox.estado = EstadoReserva.CANCELADA;
          await manager.save(reservaBox);
          this.logger.log(`Reserva de box cancelada: ${reserva.metadatos.reservaBoxId}`);
        }
      }

      // Cancelar la sesión
      reserva.estado = EstadoReservaPsicologo.CANCELADA;
      const updatedReserva = await manager.save(reserva);

      this.logger.log(`Reserva cancelada: ${id}`);
      
      // Obtener información del box si existe
      let box: Box | undefined;
      if (updatedReserva.boxId) {
        const foundBox = await this.boxRepository.findOne({
          where: { id: updatedReserva.boxId },
          relations: ['sede']
        });
        box = foundBox || undefined;
      }

      return this.mapToResponseDto(updatedReserva, reserva.psicologo.usuario, reserva.paciente, box);
    });
  }

  /**
   * Actualizar pagoId en una reserva (cuando se confirma el pago)
   */
  async actualizarPagoId(id: string, pagoId: string): Promise<ReservaPsicologoResponseDto> {
    this.logger.log(`Actualizando pagoId para reserva: ${id}, pago: ${pagoId}`);

    const reserva = await this.reservaPsicologoRepository.findOne({
      where: { id },
      relations: ['psicologo', 'psicologo.usuario', 'paciente']
    });

    if (!reserva) {
      throw new NotFoundException('Reserva no encontrada');
    }

    // Actualizar metadatos con el pagoId
    const metadatos = reserva.metadatos || {};
    metadatos.pagoId = pagoId;

    reserva.metadatos = metadatos;
    await this.reservaPsicologoRepository.save(reserva);

    this.logger.log(`PagoId actualizado para reserva: ${id}`);

    // Obtener información del box si existe
    let box: Box | undefined;
    if (reserva.boxId) {
      const foundBox = await this.boxRepository.findOne({
        where: { id: reserva.boxId },
        relations: ['sede']
      });
      box = foundBox || undefined;
    }

    return this.mapToResponseDto(reserva, reserva.psicologo.usuario, reserva.paciente, box);
  }

  /**
   * Eliminar una reserva
   */
  async remove(id: string): Promise<void> {
    this.logger.log(`Eliminando reserva: ${id}`);

    const reserva = await this.reservaPsicologoRepository.findOne({
      where: { id }
    });

    if (!reserva) {
      throw new NotFoundException('Reserva no encontrada');
    }

    await this.reservaPsicologoRepository.remove(reserva);
    this.logger.log(`Reserva eliminada: ${id}`);
  }

  /**
   * Verificar si hay conflicto de horarios para psicólogo
   */
  private async verificarConflictoHorarios(
    psicologoId: string,
    fecha: string,
    horaInicio: string,
    horaFin: string,
    excludeId?: string
  ): Promise<boolean> {
    const queryBuilder = this.reservaPsicologoRepository
      .createQueryBuilder('reserva')
      .where('reserva.psicologo.id = :psicologoId', { psicologoId })
      .andWhere('reserva.fecha = :fecha', { fecha: new Date(fecha) })
      .andWhere('reserva.estado != :cancelada', { cancelada: EstadoReservaPsicologo.CANCELADA })
      .andWhere(`
        (reserva.horaInicio < :horaFin AND reserva.horaFin > :horaInicio)
      `, { horaInicio, horaFin });

    if (excludeId) {
      queryBuilder.andWhere('reserva.id != :excludeId', { excludeId });
    }

    const conflicto = await queryBuilder.getOne();
    return !!conflicto;
  }

  /**
   * Verificar si hay conflicto de horarios para box
   */
  private async verificarConflictoHorariosBox(
    boxId: string,
    fecha: string,
    horaInicio: string,
    horaFin: string,
    excludeId?: string
  ): Promise<boolean> {
    const queryBuilder = this.reservaPsicologoRepository
      .createQueryBuilder('reserva')
      .where('reserva.boxId = :boxId', { boxId })
      .andWhere('reserva.fecha = :fecha', { fecha: new Date(fecha) })
      .andWhere('reserva.estado != :cancelada', { cancelada: EstadoReservaPsicologo.CANCELADA })
      .andWhere(`
        (reserva.horaInicio < :horaFin AND reserva.horaFin > :horaInicio)
      `, { horaInicio, horaFin });

    if (excludeId) {
      queryBuilder.andWhere('reserva.id != :excludeId', { excludeId });
    }

    const conflicto = await queryBuilder.getOne();
    return !!conflicto;
  }

  /**
   * Mapear entidad a DTO de respuesta
   */
  private mapToResponseDto(
    reserva: ReservaPsicologo, 
    psicologoUsuario: User, 
    paciente: User,
    box?: Box
  ): ReservaPsicologoResponseDto {
    return {
      id: reserva.id,
      psicologoId: reserva.psicologo.id,
      psicologoNombre: `${psicologoUsuario.nombre} ${psicologoUsuario.apellido}`,
      pacienteId: reserva.paciente.id,
      pacienteNombre: `${paciente.nombre} ${paciente.apellido}`,
      pacienteFotoUrl: paciente.fotoUrl, // URL de la foto del paciente
      pacienteEmail: paciente.email,
      pacienteTelefono: paciente.telefono,
      fecha: reserva.fecha,
      horaInicio: reserva.horaInicio,
      horaFin: reserva.horaFin,
      boxId: reserva.boxId,
      boxNombre: box?.nombre || box?.numero,
      boxSede: box?.sede?.nombre,
      modalidad: reserva.modalidad,
      estado: reserva.estado,
      observaciones: reserva.observaciones,
      cuponId: reserva.cuponId,
      descuentoAplicado: reserva.descuentoAplicado,
      metadatos: reserva.metadatos,
      createdAt: reserva.createdAt,
      updatedAt: reserva.updatedAt,
    };
  }

  /**
   * Calcular precio del box basado en duración y características del box
   */
  private calcularPrecioBox(box: Box, horaInicio: string, horaFin: string): number {
    // Calcular duración en horas
    const [horaIni, minIni] = horaInicio.split(':').map(Number);
    const [horaFinNum, minFin] = horaFin.split(':').map(Number);
    
    const inicioMinutos = horaIni * 60 + minIni;
    const finMinutos = horaFinNum * 60 + minFin;
    const duracionMinutos = finMinutos - inicioMinutos;
    const duracionHoras = duracionMinutos / 60;

    // Precio base por hora (puedes ajustar estos valores según tu modelo de negocio)
    let precioPorHora = 5000; // $5,000 CLP por hora base

    // Ajustar precio según capacidad del box
    if (box.capacidad >= 6) {
      precioPorHora = 8000; // Box grande
    } else if (box.capacidad >= 4) {
      precioPorHora = 6000; // Box mediano
    }

    // Calcular precio total
    const precioTotal = Math.round(precioPorHora * duracionHoras);

    this.logger.log(`Precio calculado para Box ${box.numero}: $${precioTotal} (${duracionHoras}h × $${precioPorHora}/h)`);

    return precioTotal;
  }

} 