import { Injectable, Logger, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User } from '../../common/entities/user.entity';
import { Paciente } from '../../common/entities/paciente.entity';
import { Psicologo } from '../../common/entities/psicologo.entity';
import { CrearPacienteDto } from '../dto/crear-paciente.dto';
import { CrearPacienteResponseDto } from '../dto/crear-paciente-response.dto';
import { MailService } from '../../mail/mail.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class CrearPacienteService {
  private readonly logger = new Logger(CrearPacienteService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Paciente)
    private pacienteRepository: Repository<Paciente>,
    @InjectRepository(Psicologo)
    private psicologoRepository: Repository<Psicologo>,
    private dataSource: DataSource,
    private mailService: MailService,
  ) {}

  async crearPaciente(crearPacienteDto: CrearPacienteDto, psicologoUserId: string): Promise<CrearPacienteResponseDto> {
    this.logger.log(`Creando paciente para psicólogo: ${psicologoUserId}`);
    this.logger.log(`Datos del paciente: ${JSON.stringify(crearPacienteDto)}`);

    // Usar transacción para asegurar consistencia
    return await this.dataSource.transaction(async (manager) => {
      // 1. Verificar que el psicólogo existe
      const psicologo = await manager.findOne(Psicologo, {
        where: { usuario: { id: psicologoUserId } },
        relations: ['usuario']
      });

      if (!psicologo) {
        throw new NotFoundException('Psicólogo no encontrado');
      }

      this.logger.log(`Psicólogo encontrado: ${psicologo.usuario.nombre} ${psicologo.usuario.apellido}`);
      this.logger.log(`ID del psicólogo (tabla): ${psicologo.id}`);
      this.logger.log(`ID del usuario psicólogo: ${psicologo.usuario.id}`);

      // 2. Verificar que el email no esté en uso
      const usuarioExistente = await manager.findOne(User, {
        where: { email: crearPacienteDto.email }
      });

      if (usuarioExistente) {
        throw new ConflictException('El email ya está registrado en el sistema');
      }

      // 3. Verificar que el RUT no esté en uso
      const rutExistente = await manager.findOne(User, {
        where: { rut: crearPacienteDto.rut }
      });

      if (rutExistente) {
        throw new ConflictException('El RUT ya está registrado en el sistema');
      }

      // 4. Generar contraseña automática
      const passwordGenerada = this.generarPassword();
      const hashedPassword = await bcrypt.hash(passwordGenerada, 10);

      // 5. Crear el usuario paciente
      const nuevoUsuario = manager.create(User, {
        nombre: crearPacienteDto.nombre,
        apellido: crearPacienteDto.apellido,
        email: crearPacienteDto.email,
        rut: crearPacienteDto.rut,
        telefono: '', // Se puede agregar después
        fechaNacimiento: new Date(crearPacienteDto.fechaNacimiento),
        password: hashedPassword,
        role: 'PACIENTE',
        estado: 'ACTIVO'
      });

      const usuarioGuardado = await manager.save(nuevoUsuario);
      this.logger.log(`Usuario paciente creado: ${usuarioGuardado.id}`);

      // 6. Crear el registro de paciente vinculado al psicólogo
      const nuevoPaciente = manager.create(Paciente, {
        idUsuarioPaciente: usuarioGuardado.id,
        idUsuarioPsicologo: psicologo.id, // CORREGIDO: Usar el ID de la tabla psicólogo, no del usuario
        primeraSesionRegistrada: new Date(),
        estado: 'ACTIVO',
        perfil_matching_completado: false,
        diagnosticos_principales: [],
        temas_principales: [],
        estilo_terapeutico_preferido: [],
        enfoque_teorico_preferido: [],
        afinidad_personal_preferida: [],
        modalidad_preferida: [],
        genero_psicologo_preferido: []
      });

      const pacienteGuardado = await manager.save(nuevoPaciente);
      this.logger.log(`Paciente vinculado creado: ${pacienteGuardado.id}`);

      // 7. Enviar email de bienvenida con la contraseña
      let emailEnviado = false;
      try {
        emailEnviado = await this.mailService.sendEmail({
          to: crearPacienteDto.email,
          template: 'bienvenida-paciente',
          context: {
            nombre: crearPacienteDto.nombre,
            apellido: crearPacienteDto.apellido,
            email: crearPacienteDto.email,
            password: passwordGenerada,
            psicologoNombre: `${psicologo.usuario.nombre} ${psicologo.usuario.apellido}`,
            psicologoEmail: psicologo.usuario.email
          }
        });
        this.logger.log(`Email de bienvenida enviado: ${emailEnviado}`);
      } catch (error) {
        this.logger.error('Error al enviar email de bienvenida:', error);
        // No lanzar error, solo loggear
      }

      // 8. Preparar respuesta
      const response: CrearPacienteResponseDto = {
        success: true,
        message: 'Paciente creado exitosamente',
        paciente: {
          id: usuarioGuardado.id,
          nombre: usuarioGuardado.nombre,
          apellido: usuarioGuardado.apellido,
          email: usuarioGuardado.email,
          rut: usuarioGuardado.rut,
          fechaNacimiento: usuarioGuardado.fechaNacimiento.toISOString().split('T')[0],
          role: usuarioGuardado.role,
          estado: usuarioGuardado.estado
        },
        psicologo: {
          id: psicologo.id,
          nombre: psicologo.usuario.nombre,
          apellido: psicologo.usuario.apellido,
          email: psicologo.usuario.email
        },
        emailEnviado,
        passwordGenerada // Solo para mostrar en la respuesta
      };

      this.logger.log(`Paciente creado exitosamente: ${usuarioGuardado.id}`);
      return response;
    });
  }

  private generarPassword(): string {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    
    // Asegurar al menos un carácter de cada tipo
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // Mayúscula
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // Minúscula
    password += '0123456789'[Math.floor(Math.random() * 10)]; // Número
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // Símbolo
    
    // Completar hasta 12 caracteres
    for (let i = 4; i < 12; i++) {
      password += caracteres[Math.floor(Math.random() * caracteres.length)];
    }
    
    // Mezclar la contraseña
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }
}
