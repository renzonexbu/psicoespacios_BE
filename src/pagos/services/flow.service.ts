import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FlowService {
  private readonly apiKey: string;
  private readonly secretKey: string;
  private readonly commerceId: string;
  private readonly baseUrl: string;
  private readonly frontUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = 'TU_API_KEY';
    this.secretKey = 'TU_SECRET_KEY';
    this.commerceId = 'TU_COMMERCE_ID';
    this.baseUrl = 'https://sandbox.flow.cl/api';
    this.frontUrl = this.configService.get<string>('FRONT_URL', 'https://TU_FRONTEND');
  }

  private sign(params: any): string {
    const keys = Object.keys(params).sort();
    const toSign = keys.map(k => `${k}=${params[k]}`).join('&');
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
      email: email,
      urlConfirmation: 'https://TU_BACKEND/api/flow/confirm',
      urlReturn: `${this.frontUrl}/pago-exitoso`,
    };
    params['s'] = this.sign(params);
    const { data } = await axios.post(url, null, { params });
    return data;
  }

  validateSignature(params: any): boolean {
    const s = params.s;
    delete params.s;
    const expected = this.sign(params);
    return expected === s;
  }
}
