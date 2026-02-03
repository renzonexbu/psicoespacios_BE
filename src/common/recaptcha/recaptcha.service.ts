import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

type RecaptchaVerifyResponse = {
  success: boolean;
  score?: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
};

@Injectable()
export class RecaptchaService {
  private readonly logger = new Logger(RecaptchaService.name);

  constructor(private readonly configService: ConfigService) {}

  async verifyV3(token: string, remoteIp?: string) {
    const secret = this.configService.get<string>('RECAPTCHA_SECRET_KEY');
    if (!secret) {
      // Fail closed to avoid bypassing security accidentally
      throw new UnauthorizedException('reCAPTCHA no configurado');
    }

    const minScore = Number(
      this.configService.get<string>('RECAPTCHA_V3_MIN_SCORE') ?? '0.5',
    );

    const params = new URLSearchParams();
    params.set('secret', secret);
    params.set('response', token);
    if (remoteIp) params.set('remoteip', remoteIp);

    const { data } = await axios.post<RecaptchaVerifyResponse>(
      'https://www.google.com/recaptcha/api/siteverify',
      params,
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 5000,
      },
    );

    if (!data?.success) {
      this.logger.warn(
        `reCAPTCHA inválido: ${JSON.stringify(data?.['error-codes'] ?? [])}`,
      );
      throw new UnauthorizedException('reCAPTCHA inválido');
    }

    const score = typeof data.score === 'number' ? data.score : 0;
    if (score < minScore) {
      this.logger.warn(`reCAPTCHA score bajo: ${score} < ${minScore}`);
      throw new UnauthorizedException('reCAPTCHA score insuficiente');
    }

    return { score, action: data.action, hostname: data.hostname };
  }
}

