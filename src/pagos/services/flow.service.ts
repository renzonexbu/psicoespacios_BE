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
    this.apiKey = '5B2A0FB8-CE70-455E-AAAB-5AB11L67E99A';
    this.secretKey = '3699c4008de7bc5e08ce58ddde71e76348c5e104';
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
      urlConfirmation: 'https://webhook.site/7160f234-da3b-454a-8ab1-6d4ff17283f2',
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
