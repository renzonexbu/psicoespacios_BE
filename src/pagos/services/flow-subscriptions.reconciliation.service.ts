import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Suscripcion, EstadoSuscripcion } from '../../common/entities/suscripcion.entity';
import { FlowSubscriptionsService } from './flow-subscriptions.service';
import { FlowService } from './flow.service';

@Injectable()
export class FlowSubscriptionsReconciliationService {
  private readonly logger = new Logger(FlowSubscriptionsReconciliationService.name);

  constructor(
    @InjectRepository(Suscripcion)
    private readonly suscripcionRepository: Repository<Suscripcion>,
    private readonly flowService: FlowService,
    private readonly flowSubscriptionsService: FlowSubscriptionsService,
  ) {}

  /**
   * Conciliación periódica:
   * - actualiza metadata de suscripciones activas con Flow
   * - procesa invoices vencidos (best-effort)
   */
  @Cron('0 */2 * * *') // cada 2 horas
  async reconcile() {
    try {
      const activos = await this.suscripcionRepository.find({
        where: { estado: EstadoSuscripcion.ACTIVA },
      });

      for (const s of activos) {
        if (!s.flowSubscriptionId) continue;
        try {
          const flowSub = await this.flowService.subscriptionGet(s.flowSubscriptionId);
          await this.flowSubscriptionsService.procesarCallbackSuscripcion({
            subscriptionId: s.flowSubscriptionId,
            _source: 'reconcile',
          });
          // procesarCallbackSuscripcion ya llama subscription/get internamente y hace update.
          // flowSub se mantiene por si se necesita logging.
          void flowSub;
        } catch (e: any) {
          this.logger.warn(
            `Error conciliando subscriptionId=${s.flowSubscriptionId}: ${e?.message || e}`,
          );
        }
      }

      // Invoices vencidos (best-effort, primera página)
      try {
        const overdue = await this.flowService.invoiceGetOverDue({ start: 0, limit: 100 });
        const data = overdue?.data || overdue;
        if (Array.isArray(data)) {
          for (const inv of data) {
            if (!inv?.id) continue;
            try {
              await this.flowSubscriptionsService.procesarCallbackSuscripcion({
                invoiceId: inv.id,
                _source: 'reconcile_overdue',
              });
            } catch {
              // ignore
            }
          }
        }
      } catch (e: any) {
        this.logger.warn(`No se pudo consultar invoices vencidos: ${e?.message || e}`);
      }
    } catch (error: any) {
      this.logger.error(`Error en conciliación Flow: ${error?.message || error}`);
    }
  }
}

