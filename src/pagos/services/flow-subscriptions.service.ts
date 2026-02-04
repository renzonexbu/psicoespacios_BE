import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plan } from '../../common/entities/plan.entity';
import {
  EstadoSuscripcion,
  Suscripcion,
} from '../../common/entities/suscripcion.entity';
import { User } from '../../common/entities/user.entity';
import { FlowService } from './flow.service';

function parseFlowDate(value?: string | null): Date | null {
  if (!value) return null;
  const v = String(value).trim();
  if (!v) return null;
  // "yyyy-mm-dd hh:mm:ss" -> "yyyy-mm-ddThh:mm:ssZ"
  if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}/.test(v)) {
    return new Date(v.replace(' ', 'T') + 'Z');
  }
  // "yyyy-mm-dd" -> "yyyy-mm-ddT00:00:00Z"
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    return new Date(v + 'T00:00:00Z');
  }
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

@Injectable()
export class FlowSubscriptionsService {
  private readonly logger = new Logger(FlowSubscriptionsService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly flowService: FlowService,
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Suscripcion)
    private readonly suscripcionRepository: Repository<Suscripcion>,
  ) {}

  private getSubscriptionsCallbackUrl() {
    return (
      this.configService.get<string>('FLOW_SUBSCRIPTIONS_CALLBACK_URL') ||
      `${this.configService.get<string>('API_URL', 'http://localhost:3000')}/api/v1/flow/subscription-callback`
    );
  }

  private buildFlowPlanId(plan: Plan) {
    // Flow exige un texto sin espacios. Usamos el UUID sin guiones para estabilidad.
    return `psico_${plan.id.replace(/-/g, '')}`;
  }

  async ensureFlowPlan(plan: Plan): Promise<Plan> {
    if (!plan.flowPlanId) {
      plan.flowPlanId = this.buildFlowPlanId(plan);
      plan = await this.planRepository.save(plan);
    }
    const flowPlanId = plan.flowPlanId!;

    // Verificar si existe en Flow; si no, crearlo.
    try {
      await this.flowService.plansGet(flowPlanId);
      return plan;
    } catch (e) {
      this.logger.warn(
        `Plan ${plan.id} no existe en Flow (planId=${flowPlanId}). Creando...`,
      );
    }

    await this.flowService.plansCreate({
      planId: flowPlanId,
      name: plan.nombre,
      amount: plan.precio,
      interval: 3, // mensual
      interval_count: 1,
      currency: 'CLP',
      trial_period_days: 0,
      days_until_due: 3,
      // periods_number omitido => indefinido
      urlCallback: this.getSubscriptionsCallbackUrl(),
      charges_retries_number: 3,
    });

    return plan;
  }

  async syncFlowPlanFromLocal(planId: string) {
    const plan = await this.planRepository.findOne({ where: { id: planId } });
    if (!plan) throw new NotFoundException('Plan no encontrado');
    await this.ensureFlowPlan(plan);
    return plan;
  }

  private async ensureFlowCustomer(user: User): Promise<User> {
    if (user.flowCustomerId) return user;

    const customer = await this.flowService.customerCreate({
      name: `${user.nombre} ${user.apellido}`.trim(),
      email: user.email,
      externalId: user.id,
    });

    user.flowCustomerId = customer.customerId;
    return await this.userRepository.save(user);
  }

  private customerHasCard(customer: any) {
    // En customer/get aparecen creditCardType y last4CardDigits cuando hay tarjeta registrada
    return !!customer?.last4CardDigits || !!customer?.creditCardType;
  }

  async iniciarSuscripcionFlow(userId: string, planDbId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId, role: 'PSICOLOGO' },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado o no es psicólogo');

    const plan = await this.planRepository.findOne({
      where: { id: planDbId, activo: true },
    });
    if (!plan) throw new NotFoundException('Plan no encontrado o inactivo');

    // No permitir si ya tiene activa
    const suscripcionActiva = await this.suscripcionRepository.findOne({
      where: { usuarioId: userId, estado: EstadoSuscripcion.ACTIVA },
    });
    if (suscripcionActiva) {
      throw new BadRequestException('Ya tiene una suscripción activa');
    }

    const ensuredPlan = await this.ensureFlowPlan(plan);
    const ensuredUser = await this.ensureFlowCustomer(user);

    const customer = await this.flowService.customerGet(ensuredUser.flowCustomerId!);
    if (!this.customerHasCard(customer)) {
      const returnUrl =
        this.configService.get<string>('FLOW_CUSTOMER_REGISTER_RETURN_URL') ||
        `${this.configService.get<string>('API_URL', 'http://localhost:3000')}/api/v1/flow/customer-register-return?userId=${encodeURIComponent(
          ensuredUser.id,
        )}&planId=${encodeURIComponent(ensuredPlan.id)}`;

      const reg = await this.flowService.customerRegister({
        customerId: ensuredUser.flowCustomerId!,
        url_return: returnUrl,
      });
      return {
        status: 'REQUIRES_CARD' as const,
        redirectUrl: reg.url,
      };
    }

    const sub = await this.flowService.subscriptionCreate({
      planId: ensuredPlan.flowPlanId!,
      customerId: ensuredUser.flowCustomerId!,
    });

    const saved = await this.createLocalSuscripcionFromFlow({
      userId: ensuredUser.id,
      plan,
      flowSubscription: sub,
      renovacionAutomatica: true,
    });

    return { status: 'SUBSCRIBED' as const, suscripcion: saved };
  }

  async finalizarSuscripcionTrasRegistroTarjeta(params: {
    userId: string;
    planDbId: string;
    registerToken: string;
  }) {
    const { userId, planDbId, registerToken } = params;
    const status = await this.flowService.customerGetRegisterStatus(registerToken);
    if (String(status?.status) !== '1') {
      throw new BadRequestException('No se pudo registrar la tarjeta');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const plan = await this.planRepository.findOne({ where: { id: planDbId, activo: true } });
    if (!plan) throw new NotFoundException('Plan no encontrado o inactivo');

    const ensuredPlan = await this.ensureFlowPlan(plan);
    const ensuredUser = await this.ensureFlowCustomer(user);

    const sub = await this.flowService.subscriptionCreate({
      planId: ensuredPlan.flowPlanId!,
      customerId: ensuredUser.flowCustomerId!,
    });

    const saved = await this.createLocalSuscripcionFromFlow({
      userId: ensuredUser.id,
      plan,
      flowSubscription: sub,
      renovacionAutomatica: true,
    });

    return saved;
  }

  private async createLocalSuscripcionFromFlow(params: {
    userId: string;
    plan: Plan;
    flowSubscription: any;
    renovacionAutomatica: boolean;
  }) {
    const { userId, plan, flowSubscription, renovacionAutomatica } = params;

    const periodStart =
      parseFlowDate(flowSubscription?.period_start) ||
      parseFlowDate(flowSubscription?.subscription_start) ||
      new Date();
    const periodEnd =
      parseFlowDate(flowSubscription?.period_end) ||
      (() => {
        const d = new Date(periodStart);
        d.setMonth(d.getMonth() + (plan.duracion || 1));
        return d;
      })();

    const nextInvoiceDate = parseFlowDate(flowSubscription?.next_invoice_date);

    const fechaProximaRenovacion = new Date(periodEnd);
    fechaProximaRenovacion.setDate(fechaProximaRenovacion.getDate() - 7);

    const estadoLocal =
      flowSubscription?.status === 1 || flowSubscription?.status === 2
        ? EstadoSuscripcion.ACTIVA
        : EstadoSuscripcion.PENDIENTE_PAGO;

    const suscripcion = this.suscripcionRepository.create({
      usuarioId: userId,
      planId: plan.id,
      fechaInicio: periodStart,
      fechaFin: periodEnd,
      fechaProximaRenovacion,
      precioTotal: plan.precio,
      precioRenovacion: plan.precio,
      renovacionAutomatica,
      estado: estadoLocal,
      flowSubscriptionId: flowSubscription?.subscriptionId,
      flowStatus: flowSubscription?.status,
      flowNextInvoiceDate: nextInvoiceDate || undefined,
      historialPagos: [
        {
          fecha: new Date(),
          monto: plan.precio,
          metodo: 'FLOW',
          referencia: flowSubscription?.subscriptionId || '',
          estado: 'PENDIENTE',
        },
      ],
    });

    return await this.suscripcionRepository.save(suscripcion);
  }

  async procesarCallbackSuscripcion(payload: any) {
    // Flow puede enviar invoiceId, subscriptionId u otros campos.
    const invoiceIdRaw =
      payload?.invoiceId ??
      payload?.invoice_id ??
      payload?.invoice ??
      payload?.id;
    const subscriptionId =
      payload?.subscriptionId ?? payload?.subscription_id ?? payload?.subscription;

    if (invoiceIdRaw) {
      const invoiceId = Number(invoiceIdRaw);
      if (Number.isNaN(invoiceId)) {
        throw new BadRequestException('invoiceId inválido');
      }
      const invoice = await this.flowService.invoiceGet(invoiceId);
      await this.applyInvoiceToLocal(invoice);
      return { ok: true };
    }

    if (subscriptionId) {
      const sub = await this.flowService.subscriptionGet(String(subscriptionId));
      // Si viene lista de invoices, procesar el último con payment.
      const invoices = Array.isArray(sub?.invoices) ? sub.invoices : [];
      const latest = invoices
        .filter((i: any) => i && typeof i.id !== 'undefined')
        .sort((a: any, b: any) => Number(b.id) - Number(a.id))[0];
      if (latest?.id) {
        const invoice = await this.flowService.invoiceGet(Number(latest.id));
        await this.applyInvoiceToLocal(invoice);
      }
      // Actualizar metadata de suscripción aunque no haya invoice
      await this.updateLocalFromFlowSubscription(sub);
      return { ok: true };
    }

    // Intentar token (si Flow envía token de pago)
    if (payload?.token) {
      this.logger.warn(
        `Callback suscripción recibido con token, pero sin invoiceId/subscriptionId. Payload keys: ${Object.keys(
          payload,
        ).join(', ')}`,
      );
      // Best-effort: consultar pago
      try {
        await this.flowService.getPaymentStatus(String(payload.token));
      } catch (e) {
        // ignore
      }
      return { ok: true };
    }

    this.logger.warn(
      `Callback suscripción sin identificadores conocidos. Payload keys: ${Object.keys(
        payload || {},
      ).join(', ')}`,
    );
    return { ok: true };
  }

  async cancelarSuscripcionFlow(flowSubscriptionId: string, atPeriodEnd = true) {
    return await this.flowService.subscriptionCancel({
      subscriptionId: flowSubscriptionId,
      at_period_end: atPeriodEnd ? 1 : 0,
    });
  }

  async cambiarPlanSuscripcionFlow(params: {
    flowSubscriptionId: string;
    newFlowPlanId: string;
    startDateOfNewPlan?: string | null;
  }) {
    const { flowSubscriptionId, newFlowPlanId, startDateOfNewPlan } = params;
    return await this.flowService.subscriptionChangePlan({
      subscriptionId: flowSubscriptionId,
      newPlanId: newFlowPlanId,
      startDateOfNewPlan: startDateOfNewPlan ?? null,
    });
  }

  private async updateLocalFromFlowSubscription(flowSub: any) {
    const flowSubscriptionId = flowSub?.subscriptionId;
    if (!flowSubscriptionId) return;
    const local = await this.suscripcionRepository.findOne({
      where: { flowSubscriptionId },
    });
    if (!local) return;

    local.flowStatus = flowSub?.status ?? local.flowStatus;
    const next = parseFlowDate(flowSub?.next_invoice_date);
    if (next) local.flowNextInvoiceDate = next;

    const periodEnd = parseFlowDate(flowSub?.period_end);
    const periodStart = parseFlowDate(flowSub?.period_start);
    if (periodStart) local.fechaInicio = periodStart;
    if (periodEnd) {
      local.fechaFin = periodEnd;
      const prox = new Date(periodEnd);
      prox.setDate(prox.getDate() - 7);
      local.fechaProximaRenovacion = prox;
      if (periodEnd < new Date() && local.estado === EstadoSuscripcion.ACTIVA) {
        local.estado = EstadoSuscripcion.VENCIDA;
      }
    }

    await this.suscripcionRepository.save(local);
  }

  private async applyInvoiceToLocal(invoice: any) {
    const flowSubscriptionId = invoice?.subscriptionId;
    if (!flowSubscriptionId) return;

    const local = await this.suscripcionRepository.findOne({
      where: { flowSubscriptionId },
      relations: ['plan'],
    });
    if (!local) {
      this.logger.warn(
        `Invoice ${invoice?.id} refiere subscriptionId ${flowSubscriptionId} pero no existe local`,
      );
      return;
    }

    local.flowLastInvoiceId = Number(invoice?.id) || local.flowLastInvoiceId;

    const periodStart = parseFlowDate(invoice?.period_start);
    const periodEnd = parseFlowDate(invoice?.period_end);
    if (periodStart) local.fechaInicio = periodStart;
    if (periodEnd) {
      local.fechaFin = periodEnd;
      const prox = new Date(periodEnd);
      prox.setDate(prox.getDate() - 7);
      local.fechaProximaRenovacion = prox;
    }

    // Determinar estado de pago del invoice
    const payStatus = invoice?.payment?.status;
    const isPaid = payStatus === 2 || payStatus === '2' || payStatus === 1 || payStatus === '1';
    // Nota: en Flow Payment status 2 suele ser pagado; para invoices puede variar. Tratamos 1/2 como no error.
    if (isPaid) {
      local.estado = EstadoSuscripcion.ACTIVA;
      const metodo =
        invoice?.payment?.paymentData?.media || invoice?.payment?.paymentData?.mediaType || 'FLOW';
      const referencia = String(invoice?.payment?.flowOrder || '') || String(invoice?.id || '');
      const monto = Number(invoice?.amount ?? local.precioTotal);

      local.historialPagos = local.historialPagos || [];
      local.historialPagos.push({
        fecha: new Date(),
        monto,
        metodo,
        referencia,
        estado: 'CONFIRMADO',
      });
    }

    await this.suscripcionRepository.save(local);
  }
}

