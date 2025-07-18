import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
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
        estado: user.estado,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('El email ya está registrado. Por favor, usa otro correo electrónico.');
    }

    // Validaciones adicionales personalizadas
    if (!registerDto.password || registerDto.password.length < 6) {
      throw new BadRequestException('La contraseña debe tener al menos 6 caracteres.');
    }
    if (!registerDto.nombre || !registerDto.apellido) {
      throw new BadRequestException('El nombre y apellido son obligatorios.');
    }
    if (!registerDto.rut) {
      throw new BadRequestException('El RUT es obligatorio y debe tener el formato XX.XXX.XXX-X.');
    }
    if (!registerDto.telefono) {
      throw new BadRequestException('El teléfono es obligatorio.');
    }
    if (!registerDto.fechaNacimiento) {
      throw new BadRequestException('La fecha de nacimiento es obligatoria y debe tener el formato YYYY-MM-DD.');
    }
    if (!registerDto.role) {
      throw new BadRequestException('El rol es obligatorio y debe ser PSICOLOGO, PACIENTE o ADMIN.');
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

  async getFullProfile(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new UnauthorizedException('Usuario no encontrado');
    const { password, ...userData } = user;
    return userData;
  }

  async updateProfile(id: string, updateDto: any) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new UnauthorizedException('Usuario no encontrado');
    // No permitir cambiar email ni password por este endpoint
    delete updateDto.email;
    delete updateDto.password;
    Object.assign(user, updateDto);
    await this.userRepository.save(user);
    const { password, ...userData } = user;
    return userData;
  }

  async changePassword(id: string, currentPassword: string, newPassword: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new UnauthorizedException('Usuario no encontrado');
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) throw new UnauthorizedException('La contraseña actual es incorrecta');
    user.password = await bcrypt.hash(newPassword, 10);
    await this.userRepository.save(user);
  }
}