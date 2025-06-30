import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../common/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.userRepository.findOne({ 
      where: { email: loginDto.email } 
    });

    if (!user || !(await bcrypt.compare(loginDto.password, user.password))) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        apellido: user.apellido,
        rut: user.rut,
        telefono: user.telefono,
        fechaNacimiento: user.fechaNacimiento,
        fotoUrl: user.fotoUrl,
        role: user.role,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new UnauthorizedException('El email ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const user = this.userRepository.create({
      email: registerDto.email,
      password: hashedPassword,
      nombre: registerDto.nombre,
      apellido: registerDto.apellido,
      rut: registerDto.rut,
      telefono: registerDto.telefono,
      fechaNacimiento: registerDto.fechaNacimiento,
      fotoUrl: registerDto.fotoUrl,
      role: registerDto.role
    });

    await this.userRepository.save(user);
    
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        apellido: user.apellido,
        rut: user.rut,
        telefono: user.telefono,
        fechaNacimiento: user.fechaNacimiento,
        fotoUrl: user.fotoUrl,
        role: user.role,
      },
    };
  }

  async refreshToken(userId: string) {
    const user = await this.userRepository.findOne({ 
      where: { id: userId } 
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}