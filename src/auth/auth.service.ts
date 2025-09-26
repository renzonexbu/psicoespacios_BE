import { Injectable, BadRequestException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../common/entities/user.entity';
import { Psicologo } from '../common/entities/psicologo.entity';
import { RefreshToken } from '../common/entities/refresh-token.entity';
import { Suscripcion, EstadoSuscripcion } from '../common/entities/suscripcion.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { RegisterResponseDto } from './dto/register-response.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Psicologo)
    private psicologoRepository: Repository<Psicologo>,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(Suscripcion)
    private suscripcionRepository: Repository<Suscripcion>,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    // Verificar que el usuario existe
    const user = await this.userRepository.findOne({ 
      where: { email: loginDto.email } 
    });

    if (!user) {
      throw new UnauthorizedException('El correo electrónico no está registrado en el sistema');
    }

    // Verificar la contraseña
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('La contraseña es incorrecta');
    }

    // Verificar que el usuario no esté bloqueado o suspendido
    if (user.estado === 'BLOQUEADO' || user.estado === 'SUSPENDIDO') {
      throw new UnauthorizedException(`Tu cuenta está ${user.estado.toLowerCase()}. Contacta al administrador para más información`);
    }

    // Verificar que los psicólogos tengan un subrol asignado
    if (user.role === 'PSICOLOGO' && !user.subrol) {
      throw new UnauthorizedException('Tu cuenta de psicólogo está pendiente de aprobación. Un administrador debe asignarte un subrol para poder acceder al sistema.');
    }

    // Verificar onboarding para usuarios con subrol CDD
    if (user.role === 'PSICOLOGO' && user.subrol === 'CDD') {
      const psicologo = await this.psicologoRepository.findOne({
        where: { usuario: { id: user.id } }
      });
      
      if (!psicologo) {
        throw new UnauthorizedException('Debes completar tu perfil de psicólogo antes de acceder al sistema. Por favor, completa el proceso de onboarding.');
      }
    }

    const payload = { sub: user.id, email: user.email, role: user.role, subrol: user.subrol };
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
    // Validar suscripción si es psicólogo
    let suscripcionInfo: any = null;
    let psicologoId: string | undefined = undefined;
    
    if (user.role === 'PSICOLOGO') {
      suscripcionInfo = await this.validarSuscripcionPsicologo(user.id);
      
      // Obtener el psicologoId
      const psicologo = await this.psicologoRepository.findOne({
        where: { usuario: { id: user.id } },
        relations: ['usuario']
      });
      
      if (psicologo) {
        psicologoId = psicologo.id;
      }
    }

    // Verificar estado de onboarding para usuarios CDD
    let hasOnboarding: boolean | undefined = undefined;
    if (user.role === 'PSICOLOGO' && user.subrol === 'CDD') {
      hasOnboarding = !!psicologoId;
    }

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
        subrol: user.subrol, // Subrol para psicólogos
        psicologoId, // Solo para psicólogos
        hasOnboarding, // Solo para usuarios con subrol CDD
      },
      suscripcion: suscripcionInfo,
    };
  }

  async register(registerDto: RegisterDto): Promise<RegisterResponseDto> {
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
      role: registerDto.role,
      estado: 'PENDIENTE' // Usuarios nuevos comienzan como PENDIENTES
    });

    await this.userRepository.save(user);
    
    // Enviar email de bienvenida
    try {
      await this.mailService.sendBienvenida(
        user.email,
        user.nombre
      );
      console.log(`✅ Email de bienvenida enviado a ${user.email}`);
    } catch (error) {
      console.error(`❌ Error al enviar email de bienvenida a ${user.email}:`, error);
      // No fallar el registro si falla el email
    }
    
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
        estado: user.estado,
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
    
    // Si es psicólogo, agregar información adicional del perfil
    if (user.role === 'PSICOLOGO') {
      try {
        const psicologo = await this.psicologoRepository.findOne({
          where: { usuario: { id } },
          relations: ['usuario']
        });
        
        if (psicologo) {
          return {
            ...userData,
            psicologo: {
              id: psicologo.id,
              diagnosticos_experiencia: psicologo.diagnosticos_experiencia,
              temas_experiencia: psicologo.temas_experiencia,
              estilo_terapeutico: psicologo.estilo_terapeutico,
              afinidad_paciente_preferida: psicologo.afinidad_paciente_preferida,
              genero: psicologo.genero,
              numeroRegistroProfesional: psicologo.numeroRegistroProfesional,
              experiencia: psicologo.experiencia,
              descripcion: psicologo.descripcion,
              precioPresencial: psicologo.precioPresencial,
              precioOnline: psicologo.precioOnline,
              disponibilidad: psicologo.disponibilidad,
              createdAt: psicologo.createdAt,
              updatedAt: psicologo.updatedAt
            }
          };
        }
      } catch (error) {
        console.error('Error al obtener perfil de psicólogo:', error);
        // Si hay error, devolver solo datos del usuario
      }
    }
    
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

  async findAllUsers(): Promise<any[]> { // Assuming UserResponseDto is removed, so returning raw user data for now
    const users = await this.userRepository.find({
      order: { createdAt: 'DESC' }
    });
    
    // Transformar usando el DTO para excluir password y formatear fechas
    return users.map(user => {
      const { password, ...userData } = user;
      return userData;
    });
  }

  async findAllPsychologists(): Promise<any[]> {
    const psychologists = await this.userRepository.find({
      where: { role: 'PSICOLOGO' },
      order: { createdAt: 'DESC' },
      select: [
        'id',
        'email',
        'nombre',
        'apellido',
        'rut',
        'telefono',
        'fechaNacimiento',
        'fotoUrl',
        'direccion',
        'especialidad',
        'numeroRegistroProfesional',
        'experiencia',
        'role',
        'estado',
        'subrol',
        'createdAt',
        'updatedAt'
      ]
    });
    
    return psychologists;
  }

  /**
   * Valida la suscripción de un psicólogo
   * @param userId ID del usuario psicólogo
   * @returns Información de la suscripción o null si no tiene
   */
  private async validarSuscripcionPsicologo(userId: string): Promise<any> { // Assuming SuscripcionInfoDto is removed, so returning raw data for now
    try {
      const suscripcion = await this.suscripcionRepository.findOne({
        where: { 
          usuarioId: userId,
          estado: EstadoSuscripcion.ACTIVA
        },
        relations: ['plan']
      });

      if (!suscripcion) {
              return {
        tieneSuscripcion: false,
        mensaje: 'No tienes una suscripción activa',
        estado: 'SIN_SUSCRIPCION' as const
      };
      }

      // Verificar si la suscripción está vencida
      const ahora = new Date();
      const estaVencida = suscripcion.fechaFin < ahora;

      if (estaVencida) {
        return {
          tieneSuscripcion: false,
          mensaje: 'Tu suscripción ha vencido',
          estado: 'VENCIDA' as const,
          fechaVencimiento: suscripcion.fechaFin,
          plan: suscripcion.plan?.nombre || 'Plan no especificado'
        };
      }

      // Calcular días restantes
      const diasRestantes = Math.ceil((suscripcion.fechaFin.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24));

      return {
        tieneSuscripcion: true,
        mensaje: 'Suscripción activa',
        estado: EstadoSuscripcion.ACTIVA,
        plan: suscripcion.plan?.nombre || 'Plan no especificado',
        fechaVencimiento: suscripcion.fechaFin,
        diasRestantes,
        renovacionAutomatica: suscripcion.renovacionAutomatica || false,
        precioRenovacion: suscripcion.precioRenovacion
      };
    } catch (error) {
      console.error('Error al validar suscripción:', error);
      return {
        tieneSuscripcion: false,
        mensaje: 'Error al verificar suscripción',
        estado: 'ERROR' as const
      };
    }
  }

  async assignSubrol(userId: string, subrol: string): Promise<any> {
    // Verificar que el usuario existe y es psicólogo
    const user = await this.userRepository.findOne({
      where: { id: userId, role: 'PSICOLOGO' }
    });

    if (!user) {
      throw new BadRequestException('Usuario no encontrado o no es psicólogo');
    }

    // Actualizar el subrol y cambiar estado a ACTIVO
    user.subrol = subrol as any;
    user.estado = 'ACTIVO';
    
    await this.userRepository.save(user);

    return {
      success: true,
      message: 'Subrol asignado exitosamente',
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        apellido: user.apellido,
        role: user.role,
        estado: user.estado,
        subrol: user.subrol
      }
    };
  }

  async getPendingPsychologists() {
    const pendingPsychologists = await this.userRepository.find({
      where: {
        role: 'PSICOLOGO',
        subrol: IsNull()
      },
      select: [
        'id',
        'email',
        'nombre',
        'apellido',
        'rut',
        'telefono',
        'fechaNacimiento',
        'especialidad',
        'numeroRegistroProfesional',
        'experiencia',
        'estado',
        'createdAt'
      ],
      order: {
        createdAt: 'DESC'
      }
    });

    return {
      success: true,
      count: pendingPsychologists.length,
      psychologists: pendingPsychologists
    };
  }

  async checkOnboardingStatus(userId: string): Promise<{ hasOnboarding: boolean; psicologoId?: string }> {
    const psicologo = await this.psicologoRepository.findOne({
      where: { usuario: { id: userId } }
    });

    return {
      hasOnboarding: !!psicologo,
      psicologoId: psicologo?.id
    };
  }
}