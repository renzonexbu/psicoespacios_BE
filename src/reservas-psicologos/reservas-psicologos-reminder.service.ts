import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ReservaPsicologo,
  EstadoReservaPsicologo,
  ModalidadSesion,
} from '../common/entities/reserva-psicologo.entity';
import { Box } from '../common/entities/box.entity';
import { MailService } from '../mail/mail.service';

@Injectable()
export class ReservasPsicologosReminderService {
  private readonly logger = new Logger(ReservasPsicologosReminderService.name);

  constructor(
    @InjectRepository(ReservaPsicologo)
    private readonly reservaPsicologoRepository: Repository<ReservaPsicologo>,
    @InjectRepository(Box)
    private readonly boxRepository: Repository<Box>,
    private readonly mailService: MailService,
  ) {}

  /**
   * Cron que corre cada hora y envía recordatorios 24h antes de la sesión
   */
  @Cron(CronExpression.EVERY_HOUR)
  async enviarRecordatorios24h() {
    const ahora = new Date();
    const target = new Date(ahora.getTime() + 24 * 60 * 60 * 1000);
    const targetDateStr = target.toISOString().split('T')[0]; // YYYY-MM-DD

    this.logger.log(`Buscando sesiones para recordatorio 24h del día ${targetDateStr}`);

    // Obtener sesiones confirmadas para la fecha objetivo
    const reservas = await this.reservaPsicologoRepository.find({
      where: {
        estado: EstadoReservaPsicologo.CONFIRMADA,
        fecha: targetDateStr as any,
      },
      relations: ['psicologo', 'psicologo.usuario', 'paciente'],
    });

    if (!reservas.length) {
      return;
    }

    this.logger.log(`Encontradas ${reservas.length} sesiones confirmadas para enviar recordatorio`);

    for (const reserva of reservas) {
      try {
        const yaEnviado = reserva.metadatos?.recordatorio24hEnviado;
        if (yaEnviado) {
          continue;
        }

        // Usar siempre la fecha real de la sesión para mostrar en el mail
        const fechaObj = new Date(reserva.fecha as any);
        const fechaStr = isNaN(fechaObj.getTime())
          ? targetDateStr
          : fechaObj.toISOString().split('T')[0];
        const modalidadStr =
          reserva.modalidad === ModalidadSesion.PRESENCIAL ? 'Presencial' : 'Online';

        // Obtener ubicación si es presencial
        let ubicacion: string | undefined;
        if (reserva.modalidad === ModalidadSesion.PRESENCIAL && reserva.boxId) {
          const box = await this.boxRepository.findOne({
            where: { id: reserva.boxId },
            relations: ['sede'],
          });
          if (box) {
            ubicacion = `${box.sede?.nombre || 'Sede'} - ${box.sede?.direccion || ''}${
              box.sede?.ciudad ? ', ' + box.sede.ciudad : ''
            } - Box ${box.numero}`;
          }
        }

        const nombrePaciente = `${reserva.paciente.nombre} ${
          reserva.paciente.apellido || ''
        }`.trim();
        const nombrePsicologo = `${reserva.psicologo.usuario.nombre} ${
          reserva.psicologo.usuario.apellido || ''
        }`.trim();

        // Email al paciente (usa plantilla de recordatorio existente)
        if (reserva.paciente.email) {
          await this.mailService.sendRecordatorioSesion(
            reserva.paciente.email,
            nombrePsicologo,
            fechaStr,
            reserva.horaInicio,
            modalidadStr,
            ubicacion,
            'alt',
          );
        }

        // Email al psicólogo (usamos misma plantilla, pero con nombre del paciente)
        const emailPsico = reserva.psicologo.usuario.email;
        if (emailPsico) {
          await this.mailService.sendRecordatorioSesion(
            emailPsico,
            nombrePaciente,
            fechaStr,
            reserva.horaInicio,
            modalidadStr,
            ubicacion,
          );
        }

        // Marcar en metadatos que ya se envió el recordatorio
        reserva.metadatos = {
          ...(reserva.metadatos || {}),
          recordatorio24hEnviado: true,
        };
        await this.reservaPsicologoRepository.save(reserva);
      } catch (error) {
        this.logger.warn(
          `Error al enviar recordatorio 24h para reserva ${reserva.id}: ${
            error?.message || error
          }`,
        );
      }
    }
  }
}


