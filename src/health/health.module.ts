import { Module } from '@nestjs/common';
import { HealthController, RootHealthController } from './health.controller';

@Module({
  controllers: [HealthController, RootHealthController],
})
export class HealthModule {}
