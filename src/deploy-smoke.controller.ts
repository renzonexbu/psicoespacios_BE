import { Controller, Get } from '@nestjs/common';

@Controller('api/v1/deploy-smoke')
export class DeploySmokeController {
  @Get()
  getDeploySmoke() {
    return {
      ok: true,
      marker: 'codex-autodeploy-smoke-20260714-2138',
    };
  }
}
