import { BadGatewayException, Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import * as qs from 'qs';

@Injectable()
export class FlowService {
  private readonly logger = new Logger(FlowService.name);
  private readonly apiKey: string;
  private readonly secretKey: string;
  private readonly commerceId: string;
  private readonly baseUrl: string;
  private readonly frontUrl: string;
  private readonly apiUrl: string;

  constructor(private readonly configService: ConfigService) {
    // Configuración desde variables de entorno
    this.apiKey = this.configService.get<string>(
      'FLOW_API_KEY',
      '5B2A0FB8-CE70-455E-AAAB-5AB11L67E99A',
    );
    this.secretKey = this.configService.get<string>(
      'FLOW_SECRET_KEY',
      '3699c4008de7bc5e08ce58ddde71e76348c5e104',
    );
    this.commerceId = this.configService.get<string>(
      'FLOW_COMMERCE_ID',
      'TU_COMMERCE_ID',
    );

    // URL base según ambiente
    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';
    this.baseUrl = isProduction
      ? 'https://www.flow.cl/api'
      : 'https://sandbox.flow.cl/api';

    this.frontUrl = this.configService.get<string>(
      'FRONT_URL',
      'https://TU_FRONTEND',
    );
    this.apiUrl = this.configService.get<string>(
      'API_URL',
      'http://localhost:3000',
    );
  }

  private sign(params: any): string {
    // Crear una copia de los parámetros sin 's' para calcular la firma
    const paramsToSign = { ...params };
    delete paramsToSign.s;

    // Ordenar las claves alfabéticamente (requerido por Flow)
    const keys = Object.keys(paramsToSign).sort();
    const toSign = keys
      .map((k) => `${k}${String(paramsToSign[k])}`)
      .join('');

    console.log('Parámetros para firma:', keys);
    console.log(
      'String para firmar (primeros 100 chars):',
      toSign.substring(0, 100),
    );

    return crypto
      .createHmac('sha256', this.secretKey)
      .update(toSign)
      .digest('hex');
  }

  /**
   * Flow firma exactamente los parámetros enviados.
   * `qs.stringify()` tiende a OMITIR `undefined` y a serializar `null` como vacío,
   * así que nunca debemos firmar keys con `null/undefined`.
   */
  private cleanParams(params: Record<string, any>) {
    const cleaned: Record<string, any> = {};
    for (const [k, v] of Object.entries(params || {})) {
      if (v === undefined || v === null) continue;
      cleaned[k] = v;
    }
    return cleaned;
  }

  private withSignature(params: Record<string, any>) {
    const signed: any = this.cleanParams({ ...params, apiKey: this.apiKey });
    signed.s = this.sign(signed);
    return signed;
  }

  private async postForm<T>(path: string, params: Record<string, any>): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const signed = this.withSignature(params);
    try {
      const formData = qs.stringify(signed);
      const { data } = await axios.post(url, formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 30000,
      });
      return data as T;
    } catch (error: any) {
      const status = error.response?.status;
      const data = error.response?.data;
      const msg =
        (typeof data === 'object' && data ? data.message : undefined) ||
        (typeof data === 'string' ? data : undefined) ||
        error.message ||
        'Error llamando a Flow';

      this.logger.error(
        `Error Flow POST ${path} (${status ?? 'no-status'}): ${
          typeof data === 'object' ? JSON.stringify(data) : String(data ?? msg)
        }`,
      );
      throw new BadGatewayException(msg);
    }
  }

  private async getQuery<T>(path: string, params: Record<string, any>): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const signed = this.withSignature(params);
    try {
      const { data } = await axios.get(url, { params: signed });
      return data as T;
    } catch (error: any) {
      const status = error.response?.status;
      const data = error.response?.data;
      const msg =
        (typeof data === 'object' && data ? data.message : undefined) ||
        (typeof data === 'string' ? data : undefined) ||
        error.message ||
        'Error llamando a Flow';

      this.logger.error(
        `Error Flow GET ${path} (${status ?? 'no-status'}): ${
          typeof data === 'object' ? JSON.stringify(data) : String(data ?? msg)
        }`,
      );
      throw new BadGatewayException(msg);
    }
  }

  private ensureUrlHasToken(url: string, token: string) {
    if (!url) return url;
    if (url.includes('token=')) return url;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}token=${token}`;
  }

  async createPayment(
    amount: number,
    orderId: string,
    subject: string,
    email: string,
  ): Promise<any> {
    // Validar que el email no esté vacío
    if (!email || email.trim() === '') {
      throw new Error('El email es requerido para crear la orden en Flow');
    }

    // Validar formato básico de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error(`El email "${email}" no tiene un formato válido`);
    }

    const url = `${this.baseUrl}/payment/create`;

    // URLs de callback dinámicas
    const urlConfirmation = `${this.apiUrl}/api/v1/flow/confirm`; // Webhook automático
    const urlReturn = `${this.apiUrl}/api/v1/flow/return`; // Endpoint del backend que redirige al frontend

    const params: any = {
      apiKey: this.apiKey,
      commerceOrder: orderId,
      subject: subject,
      currency: 'CLP',
      amount: amount,
      email: email.trim(), // Asegurar que el email esté limpio
      urlConfirmation: urlConfirmation,
      urlReturn: urlReturn,
      // Parámetros adicionales para mejor UX
      paymentMethod: 9, // Todos los métodos de pago
      timeout: 30, // 30 minutos de timeout
    };

    // Agregar merchantId solo si está configurado
    if (this.commerceId && this.commerceId !== 'TU_COMMERCE_ID') {
      params.merchantId = this.commerceId;
    }

    // Calcular la firma ANTES de agregarla a params
    const signature = this.sign(params);
    params['s'] = signature;

    console.log('Params enviados a Flow:', {
      ...params,
      secretKey: '***HIDDEN***', // No loggear la clave secreta
    });

    // Verificar que el email esté presente antes de enviar
    if (!params.email) {
      throw new Error('El parámetro email no está presente en los parámetros');
    }

    try {
      const formData = qs.stringify(params);

      // Log del formData para verificar que el email esté incluido
      console.log('FormData serializado:', formData.substring(0, 200)); // Primeros 200 caracteres

      const { data } = await axios.post(url, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 30000, // 30 segundos de timeout
      });

      console.log('Respuesta completa de Flow:', JSON.stringify(data, null, 2));

      // Validar que Flow devolvió los datos necesarios
      if (!data.token) {
        throw new Error('Flow no devolvió un token válido en la respuesta');
      }

      // Según la documentación de Flow: url + "?token=" + token
      // Flow devuelve una URL base (ej: https://sandbox.flow.cl/app/web/pay.php)
      // y debemos agregar el token completo como query parameter
      if (data.url) {
        // Verificar si la URL ya tiene el token
        if (data.url.includes('token=')) {
          console.log('URL ya incluye token, usando directamente');
        } else {
          // Agregar el token completo a la URL
          const separator = data.url.includes('?') ? '&' : '?';
          data.url = `${data.url}${separator}token=${data.token}`;
          console.log('Token agregado a la URL de Flow');
        }
      } else {
        // Si Flow no devuelve URL, construirla usando el token
        const isProduction =
          this.configService.get<string>('NODE_ENV') === 'production';
        const flowBaseUrl = isProduction
          ? 'https://www.flow.cl'
          : 'https://sandbox.flow.cl';
        data.url = `${flowBaseUrl}/app/web/pay.php?token=${data.token}`;
        console.log('URL construida manualmente con token completo');
      }

      // Validar que tenemos todos los datos necesarios
      if (!data.flowOrder) {
        console.warn(
          'Flow no devolvió flowOrder, pero continuamos con el token',
        );
      }

      console.log('=== RESUMEN DE RESPUESTA FLOW ===');
      console.log('URL de pago FINAL:', data.url);
      console.log('Token (completo):', data.token);
      console.log('Longitud del token:', data.token?.length);
      console.log('FlowOrder:', data.flowOrder);
      console.log('================================');

      return data;
    } catch (error) {
      // Log detallado del error de Flow
      console.error('Error al crear pago en Flow:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: url,
      });

      throw new Error(
        error.response?.data?.message ||
          error.response?.data ||
          'Error al crear pago en Flow',
      );
    }
  }

  validateSignature(params: any): boolean {
    try {
      const s = params.s;
      delete params.s;
      const expected = this.sign(params);
      const isValid = expected === s;

      console.log('Validación de firma Flow:', {
        expected: expected,
        received: s,
        isValid: isValid,
      });

      return isValid;
    } catch (error) {
      console.error('Error al validar firma de Flow:', error);
      return false;
    }
  }

  // Método para obtener el estado de un pago usando token
  // Según documentación: https://developers.flow.cl/docs/tutorial-basics/status
  // Debe usar GET con token como query parameter
  async getPaymentStatus(token: string): Promise<any> {
    const url = `${this.baseUrl}/payment/getStatus`;

    // Parámetros requeridos según documentación
    const params: any = {
      apiKey: this.apiKey,
      token: token,
    };

    // Calcular la firma
    params['s'] = this.sign(params);

    try {
      // Usar GET con query parameters según documentación
      const { data } = await axios.get(url, {
        params: params,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      this.logger.log(
        `Estado del pago obtenido de Flow: ${JSON.stringify(data)}`,
      );
      return data;
    } catch (error: any) {
      this.logger.error(
        `Error al obtener estado del pago: ${error.response?.data || error.message}`,
      );
      throw new Error(`Error al obtener estado del pago: ${error.message}`);
    }
  }

  // Método alternativo para obtener estado por flowOrder
  // Usa el endpoint /payment/getStatusByFlowOrder
  async getPaymentStatusByFlowOrder(flowOrder: string): Promise<any> {
    const url = `${this.baseUrl}/payment/getStatusByFlowOrder`;

    const params: any = {
      apiKey: this.apiKey,
      flowOrder: flowOrder,
    };

    // Calcular la firma
    params['s'] = this.sign(params);

    try {
      // Usar GET con query parameters
      const { data } = await axios.get(url, {
        params: params,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      this.logger.log(
        `Estado del pago obtenido por flowOrder: ${JSON.stringify(data)}`,
      );
      return data;
    } catch (error: any) {
      this.logger.error(
        `Error al obtener estado del pago por flowOrder: ${error.response?.data || error.message}`,
      );
      throw new Error(
        `Error al obtener estado del pago por flowOrder: ${error.message}`,
      );
    }
  }

  // =========================
  // Suscripciones (Flow API)
  // =========================

  async plansGet(planId: string) {
    return await this.getQuery<any>('/plans/get', { planId });
  }

  async plansCreate(params: {
    planId: string;
    name: string;
    amount: number;
    interval: number; // 1 diario 2 semanal 3 mensual 4 anual
    interval_count?: number;
    currency?: string;
    trial_period_days?: number;
    days_until_due?: number;
    periods_number?: number | null;
    urlCallback: string;
    charges_retries_number?: number;
  }) {
    return await this.postForm<any>('/plans/create', {
      currency: 'CLP',
      interval_count: 1,
      trial_period_days: 0,
      days_until_due: 3,
      ...params,
    });
  }

  async plansEdit(params: {
    planId: string;
    name?: string;
    amount?: number;
    interval?: number;
    interval_count?: number;
    currency?: string;
    trial_period_days?: number;
    days_until_due?: number;
    periods_number?: number | null;
    urlCallback?: string;
    charges_retries_number?: number;
  }) {
    return await this.postForm<any>('/plans/edit', params);
  }

  async plansDelete(planId: string) {
    return await this.postForm<any>('/plans/delete', { planId });
  }

  async customerCreate(params: { name: string; email: string; externalId: string }) {
    return await this.postForm<any>('/customer/create', params);
  }

  async customerGet(customerId: string) {
    return await this.getQuery<any>('/customer/get', { customerId });
  }

  async customerRegister(params: { customerId: string; url_return: string }) {
    const data = await this.postForm<any>('/customer/register', params);
    if (data?.url && data?.token) {
      data.url = this.ensureUrlHasToken(data.url, data.token);
    }
    return data;
  }

  async customerGetRegisterStatus(token: string) {
    return await this.getQuery<any>('/customer/getRegisterStatus', { token });
  }

  async subscriptionCreate(params: {
    planId: string;
    customerId: string;
    subscription_start?: string; // yyyy-mm-dd
    couponId?: number;
    trial_period_days?: number;
    periods_number?: number | null;
    planAdditionalList?: number[];
  }) {
    return await this.postForm<any>('/subscription/create', params);
  }

  async subscriptionGet(subscriptionId: string) {
    return await this.getQuery<any>('/subscription/get', { subscriptionId });
  }

  async subscriptionCancel(params: { subscriptionId: string; at_period_end: number }) {
    return await this.postForm<any>('/subscription/cancel', params);
  }

  async subscriptionChangePlan(params: {
    subscriptionId: string;
    newPlanId: string;
    startDateOfNewPlan?: string | null; // yyyy-mm-dd
  }) {
    return await this.postForm<any>('/subscription/changePlan', params);
  }

  async invoiceGet(invoiceId: number) {
    return await this.getQuery<any>('/invoice/get', { invoiceId });
  }

  async invoiceGetOverDue(params: {
    start?: number;
    limit?: number;
    filter?: string;
    planId?: string;
  }) {
    return await this.getQuery<any>('/invoice/getOverDue', params);
  }

  async invoiceRetryToCollect(invoiceId: number) {
    return await this.postForm<any>('/invoice/retryToCollect', { invoiceId });
  }
}
