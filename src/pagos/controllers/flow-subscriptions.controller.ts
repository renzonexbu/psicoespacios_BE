import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { FlowSubscriptionsService } from '../services/flow-subscriptions.service';

@Controller('api/v1/flow')
export class FlowSubscriptionsController {
  constructor(
    private readonly configService: ConfigService,
    private readonly flowSubscriptionsService: FlowSubscriptionsService,
  ) {}

  /**
   * Callback de Flow para cobros recurrentes (planes/suscripciones).
   * Se configura como `urlCallback` en `plans/create`.
   */
  @Post('subscription-callback')
  async subscriptionCallback(@Body() body: any) {
    return await this.flowSubscriptionsService.procesarCallbackSuscripcion(body);
  }

  /**
   * Retorno del registro de tarjeta de cliente (`customer/register`).
   * Flow envía un POST con { token } a la URL indicada.
   *
   * Incluimos `userId` y `planId` como query params cuando iniciamos el registro.
   */
  @Post('customer-register-return')
  async customerRegisterReturnPost(
    @Body() body: any,
    @Query('userId') userId: string,
    @Query('planId') planId: string,
    @Res() res: Response,
  ) {
    const token = body?.token || body?.Token || body?.TOKEN;
    await this.handleCustomerRegisterReturn({ token, userId, planId, res });
  }

  @Get('customer-register-return')
  async customerRegisterReturnGet(
    @Query('token') token: string,
    @Query('userId') userId: string,
    @Query('planId') planId: string,
    @Res() res: Response,
  ) {
    await this.handleCustomerRegisterReturn({ token, userId, planId, res });
  }

  private async handleCustomerRegisterReturn(params: {
    token: string;
    userId: string;
    planId: string;
    res: Response;
  }) {
    const { token, userId, planId, res } = params;
    const frontUrl = this.configService.get<string>(
      'FRONT_URL',
      'http://localhost:3001',
    );

    try {
      if (!token || !userId || !planId) {
        return res.redirect(
          `${frontUrl}/suscripciones/resultado?status=error&reason=missing_params`,
        );
      }

      const suscripcion =
        await this.flowSubscriptionsService.finalizarSuscripcionTrasRegistroTarjeta(
          {
            userId,
            planDbId: planId,
            registerToken: token,
          },
        );

      return res.redirect(
        `${frontUrl}/suscripciones/resultado?status=ok&suscripcionId=${encodeURIComponent(
          suscripcion.id,
        )}`,
      );
    } catch (e) {
      return res.redirect(
        `${frontUrl}/suscripciones/resultado?status=error&reason=failed`,
      );
    }
  }
}

