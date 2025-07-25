import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import * as qs from 'qs';

@Injectable()
export class FlowService {
  private readonly apiKey: string;
  private readonly secretKey: string;
  private readonly commerceId: string;
  private readonly baseUrl: string;
  private readonly frontUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = '25F41F46-9C8A-4705-B0BE-1L1832F85190';
    this.secretKey = 'b1daeb63ff319f82ab8660f9fe35a4334914f1dd';
    this.commerceId = 'TU_COMMERCE_ID';
    this.baseUrl = 'https://sandbox.flow.cl/api';
    this.frontUrl = this.configService.get<string>('FRONT_URL', 'https://TU_FRONTEND');
  }

  private sign(params: any): string {
    const keys = Object.keys(params).sort();
    const toSign = keys.map(k => `${k}${params[k]}`).join('');
    return crypto.createHmac('sha256', this.secretKey).update(toSign).digest('hex');
  }

  async createPayment(amount: number, orderId: string, subject: string, email: string): Promise<any> {
    const url = `${this.baseUrl}/payment/create`;
    const params = {
      apiKey: this.apiKey,
      commerceOrder: orderId,
      subject: subject,
      currency: 'CLP',
      amount: amount,
      email: "manu.araya@psicoespacios.cl",
      urlConfirmation: 'https://webhook.site/b11eb1a1-63a0-4e9c-a894-f665fa8eeada',
      urlReturn: `${this.frontUrl}/pago-exitoso`,
    };
    params['s'] = this.sign(params);
    console.log('Params enviados a Flow:', params);
    try {
      const formData = qs.stringify(params);
      const { data } = await axios.post(url, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      return data;
    } catch (error) {
      // Log detallado del error de Flow
      console.error('Error al crear pago en Flow:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message ||
        error.response?.data ||
        'Error al crear pago en Flow'
      );
    }
  }

  validateSignature(params: any): boolean {
    const s = params.s;
    delete params.s;
    const expected = this.sign(params);
    return expected === s;
  }
}
