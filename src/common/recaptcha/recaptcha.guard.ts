import {
  CanActivate,
  ExecutionContext,
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { RecaptchaService } from './recaptcha.service';

@Injectable()
export class RecaptchaGuard implements CanActivate {
  constructor(private readonly recaptchaService: RecaptchaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const body: any = (req as any).body ?? {};

    const token = typeof body.recaptchaToken === 'string' ? body.recaptchaToken : '';
    if (!token) throw new BadRequestException('recaptchaToken es obligatorio');

    const remoteIp =
      // x-forwarded-for may contain a list: "client, proxy1, proxy2"
      (typeof req.headers['x-forwarded-for'] === 'string'
        ? req.headers['x-forwarded-for'].split(',')[0]?.trim()
        : undefined) || req.ip;

    await this.recaptchaService.verifyV3(token, remoteIp);
    return true;
  }
}

