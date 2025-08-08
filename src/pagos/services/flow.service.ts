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
  private readonly apiUrl: string;

  constructor(private readonly configService: ConfigService) {
    // Configuración desde variables de entorno
    this.apiKey = this.configService.get<string>('FLOW_API_KEY', '5B2A0FB8-CE70-455E-AAAB-5AB11L67E99A');
    this.secretKey = this.configService.get<string>('FLOW_SECRET_KEY', '3699c4008de7bc5e08ce58ddde71e76348c5e104');
    this.commerceId = this.configService.get<string>('FLOW_COMMERCE_ID', 'TU_COMMERCE_ID');
    
    // URL base según ambiente
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    this.baseUrl = isProduction ? 'https://www.flow.cl/api' : 'https://sandbox.flow.cl/api';
    
    this.frontUrl = this.configService.get<string>('FRONT_URL', 'https://TU_FRONTEND');
    this.apiUrl = this.configService.get<string>('API_URL', 'http://localhost:3000');
  }

  private sign(params: any): string {
    const keys = Object.keys(params).sort();
    const toSign = keys.map(k => `${k}${params[k]}`).join('');
    return crypto.createHmac('sha256', this.secretKey).update(toSign).digest('hex');
  }

  async createPayment(amount: number, orderId: string, subject: string, email: string): Promise<any> {
    const url = `${this.baseUrl}/payment/create`;
    
    // URLs de callback dinámicas
    const urlConfirmation = `${this.apiUrl}/api/v1/flow/confirm`;
    const urlReturn = `${this.frontUrl}/pago-exitoso`;
    
    const params = {
      apiKey: this.apiKey,
      commerceOrder: orderId,
      subject: subject,
      currency: 'CLP',
      amount: amount,
      email: email,
      urlConfirmation: urlConfirmation,
      urlReturn: urlReturn,
      // Parámetros adicionales para mejor UX
      paymentMethod: 9, // Todos los métodos de pago
      timeout: 30, // 30 minutos de timeout
      merchantId: this.commerceId,
    };
    
    params['s'] = this.sign(params);
    
    console.log('Params enviados a Flow:', {
      ...params,
      secretKey: '***HIDDEN***' // No loggear la clave secreta
    });
    
    try {
      const formData = qs.stringify(params);
      const { data } = await axios.post(url, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 30000, // 30 segundos de timeout
      });
      
      console.log('Respuesta de Flow:', data);
      return data;
    } catch (error) {
      // Log detallado del error de Flow
      console.error('Error al crear pago en Flow:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: url
      });
      
      throw new Error(
        error.response?.data?.message ||
        error.response?.data ||
        'Error al crear pago en Flow'
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
        isValid: isValid
      });
      
      return isValid;
    } catch (error) {
      console.error('Error al validar firma de Flow:', error);
      return false;
    }
  }

  // Método para obtener el estado de un pago
  async getPaymentStatus(flowOrder: string): Promise<any> {
    const url = `${this.baseUrl}/payment/getStatus`;
    const params = {
      apiKey: this.apiKey,
      flowOrder: flowOrder,
    };
    
    params['s'] = this.sign(params);
    
    try {
      const formData = qs.stringify(params);
      const { data } = await axios.post(url, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      
      return data;
    } catch (error) {
      console.error('Error al obtener estado del pago:', error.response?.data || error.message);
      throw new Error('Error al obtener estado del pago');
    }
  }
}
