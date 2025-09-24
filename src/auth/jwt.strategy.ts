import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Psicologo } from '../common/entities/psicologo.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(Psicologo)
    private psicologoRepository: Repository<Psicologo>
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'default-secret-key',
    });
  }

  async validate(payload: any) {
    console.log('[JWT Strategy] Payload recibido:', payload);
    
    const user = { id: payload.sub, email: payload.email, role: payload.role, subrol: payload.subrol };
    
    // Si es psicólogo, agregar el psicologoId
    if (payload.role === 'PSICOLOGO') {
      console.log('[JWT Strategy] Usuario es psicólogo, buscando psicologoId...');
      
      const psicologo = await this.psicologoRepository.findOne({
        where: { usuario: { id: payload.sub } },
        relations: ['usuario']
      });
      
      if (psicologo) {
        user['psicologoId'] = psicologo.id;
        console.log('[JWT Strategy] PsicologoId encontrado:', psicologo.id);
      } else {
        console.log('[JWT Strategy] No se encontró psicólogo para el usuario:', payload.sub);
      }
    }
    
    console.log('[JWT Strategy] Usuario final:', user);
    return user;
  }
}