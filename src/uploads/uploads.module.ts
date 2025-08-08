import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { BackblazeService } from './services/backblaze.service';

@Module({
  controllers: [UploadsController],
  providers: [BackblazeService],
  exports: [BackblazeService],
})
export class UploadsModule {} 