import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfiguracionSistema } from '../../common/entities/configuracion-sistema.entity';
import { User } from '../../common/entities/user.entity';
import { UpdateConfiguracionDto } from '../dto/configuracion.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(ConfiguracionSistema)
    private readonly configuracionRepository: Repository<ConfiguracionSistema>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getConfiguracion() {
    const configuracion = await this.configuracionRepository.findOne({
      where: {},
      order: { createdAt: 'DESC' },
    });

    if (!configuracion) {
      // Crear configuración inicial por defecto
      return this.configuracionRepository.save(this.getConfiguracionPorDefecto());
    }

    return configuracion;
  }

  async updateConfiguracion(updateDto: UpdateConfiguracionDto) {
    let configuracion = await this.getConfiguracion();

    // Actualizar solo los campos proporcionados
    Object.keys(updateDto).forEach(key => {
      if (updateDto[key]) {
        configuracion[key] = {
          ...configuracion[key],
          ...updateDto[key],
        };
      }
    });

    return this.configuracionRepository.save(configuracion);
  }

  async getEstadisticasSistema() {
    const [
      totalUsuarios,
      psicologosActivos,
      psicologosInactivos,
      psicologosVerificados,
    ] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.count({
        where: { role: 'PSICOLOGO', estado: 'ACTIVO' },
      }),
      this.userRepository.count({
        where: { role: 'PSICOLOGO', estado: 'INACTIVO' },
      }),
      this.userRepository.count({
        where: { role: 'PSICOLOGO', estado: 'ACTIVO' },
      }),
    ]);

    return {
      usuarios: {
        total: totalUsuarios,
        psicologos: {
          activos: psicologosActivos,
          inactivos: psicologosInactivos,
          verificados: psicologosVerificados,
        },
      },
    };
  }

  async verificarPsicologo(psicologoId: string) {
    const psicologo = await this.userRepository.findOne({
      where: { id: psicologoId, role: 'PSICOLOGO' },
    });

    if (!psicologo) {
      throw new NotFoundException('Psicólogo no encontrado');
    }

    psicologo.estado = 'ACTIVO';
    return this.userRepository.save(psicologo);
  }

  async suspenderPsicologo(psicologoId: string) {
    const psicologo = await this.userRepository.findOne({
      where: { id: psicologoId, role: 'PSICOLOGO' },
    });

    if (!psicologo) {
      throw new NotFoundException('Psicólogo no encontrado');
    }

    psicologo.estado = 'SUSPENDIDO';
    return this.userRepository.save(psicologo);
  }

  private getConfiguracionPorDefecto(): ConfiguracionSistema {
    return this.configuracionRepository.create({
      configuracionGeneral: {
        nombreSistema: 'PsicoEspacios',
        colorPrimario: '#4A90E2',
        colorSecundario: '#50E3C2',
        contactoSoporte: 'soporte@psicoespacios.cl',
      },
      configuracionReservas: {
        tiempoMinimoReserva: 30,
        tiempoMaximoReserva: 120,
        anticipacionMinima: 24,
        anticipacionMaxima: 720,
        intervaloHorario: [9, 20],
      },
      configuracionPagos: {
        moneda: 'CLP',
        comisionPlataforma: 5,
        metodosHabilitados: ['TARJETA', 'TRANSFERENCIA'],
      },
      configuracionDerivacion: {
        especialidades: [
          'Psicología Clínica',
          'Psicología Infantil',
          'Psicología Familiar',
          'Psicología Laboral',
        ],
        modalidades: ['PRESENCIAL', 'ONLINE'],
        tiempoMaximoRespuesta: 48,
        comisionDerivacion: 10,
      },
      configuracionSuscripciones: {
        periodosRenovacion: [1, 3, 6, 12],
        descuentosRenovacion: [
          { periodo: 3, descuento: 5 },
          { periodo: 6, descuento: 10 },
          { periodo: 12, descuento: 15 },
        ],
      },
      configuracionNotificaciones: {
        emailsHabilitados: true,
        plantillasEmail: {
          bienvenida: {
            asunto: '¡Bienvenido a PsicoEspacios!',
            plantilla: 'Plantilla de bienvenida por defecto',
          },
          reservaConfirmada: {
            asunto: 'Tu reserva ha sido confirmada',
            plantilla: 'Plantilla de confirmación por defecto',
          },
        },
      },
    });
  }
}