import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../common/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UserResponseDto } from './dto/user-response.dto';
import * as bcrypt from 'bcrypt';
import { RefreshToken } from '../common/entities/refresh-token.entity';
import { v4 as uuidv4 } from 'uuid';
import { plainToClass } from 'class-transformer';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
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
    const access_token = await this.jwtService.signAsync(payload);
    // Crear refresh token
    const refresh_token = uuidv4() + uuidv4();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 días
    await this.refreshTokenRepository.save({
      userId: user.id,
      token: refresh_token,
      expiresAt,
      revoked: false,
    });
    return {
      access_token,
      refresh_token,
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
    const access_token = await this.jwtService.signAsync(payload);
    // Crear refresh token para el registro también
    const refresh_token = uuidv4() + uuidv4();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 días
    await this.refreshTokenRepository.save({
      userId: user.id,
      token: refresh_token,
      expiresAt,
      revoked: false,
    });
    
    return {
      access_token,
      refresh_token,
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

  async refreshToken(refreshToken: string) {
    const token = await this.refreshTokenRepository.findOne({ where: { token: refreshToken, revoked: false } });
    if (!token || token.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }
    const user = await this.userRepository.findOne({ where: { id: token.userId } });
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }
    
    // Revocar el refresh token actual
    token.revoked = true;
    await this.refreshTokenRepository.save(token);
    
    // Generar nuevo access token
    const payload = { sub: user.id, email: user.email, role: user.role };
    const access_token = await this.jwtService.signAsync(payload);
    
    // Generar nuevo refresh token
    const new_refresh_token = uuidv4() + uuidv4();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 días
    await this.refreshTokenRepository.save({
      userId: user.id,
      token: new_refresh_token,
      expiresAt,
      revoked: false,
    });
    
    return { 
      access_token,
      refresh_token: new_refresh_token
    };
  }

  async revokeRefreshToken(refreshToken: string) {
    const token = await this.refreshTokenRepository.findOne({ where: { token: refreshToken } });
    if (token) {
      token.revoked = true;
      await this.refreshTokenRepository.save(token);
    }
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

  async findAllUsers(): Promise<UserResponseDto[]> {
    const users = await this.userRepository.find({
      order: { createdAt: 'DESC' }
    });
    
    // Transformar usando el DTO para excluir password y formatear fechas
    return users.map(user => {
      const { password, ...userData } = user;
      return plainToClass(UserResponseDto, userData, { excludeExtraneousValues: true });
    });
  }
}