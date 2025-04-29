import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './controllers/admin.controller';
import { AdminService } from './services/admin.service';
import { ConfiguracionSistema } from '../common/entities/configuracion-sistema.entity';
import { User } from '../common/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ConfiguracionSistema, User]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}