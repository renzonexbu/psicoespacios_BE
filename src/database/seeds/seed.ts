import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { User } from '../../common/entities/user.entity';
import { Plan, TipoPlan } from '../../common/entities/plan.entity';
import { Sede } from '../../common/entities/sede.entity';
import { Box } from '../../common/entities/box.entity';
import { ConfiguracionSistema } from '../../common/entities/configuracion-sistema.entity';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  try {
    // Crear usuario administrador
    const adminPassword = await bcrypt.hash('admin123', 10);
    const userRepo = dataSource.getRepository(User);
    const admin = new User();
    admin.email = 'admin@psicoespacios.com';
    admin.password = adminPassword;
    admin.nombre = 'Admin';
    admin.apellido = 'Sistema';
    admin.role = 'ADMIN';
    await userRepo.save(admin);

    // Crear planes base
    const planRepo = dataSource.getRepository(Plan);
    const planes = [
      {
        tipo: TipoPlan.BASICO,
        nombre: 'Plan Básico',
        descripcion: 'Plan ideal para comenzar',
        precio: 29990,
        duracion: 1,
        horasIncluidas: 20,
        beneficios: ['Reservas de box hasta 20 horas mensuales', 'Sistema de derivación básico', 'Reportes básicos'],
        activo: true,
      },
      {
        tipo: TipoPlan.INTERMEDIO,
        nombre: 'Plan Profesional',
        descripcion: 'Para profesionales establecidos',
        precio: 49990,
        duracion: 1,
        horasIncluidas: 40,
        beneficios: ['Reservas de box hasta 40 horas mensuales', 'Sistema de derivación avanzado', 'Reportes avanzados', 'Sistema de fichas ilimitado'],
        activo: true,
      },
      {
        tipo: TipoPlan.PREMIUM,
        nombre: 'Plan Premium',
        descripcion: 'Todas las características disponibles',
        precio: 79990,
        duracion: 1,
        horasIncluidas: 100,
        beneficios: ['Horas ilimitadas', 'Sistema de derivación premium', 'Reportes personalizados', 'Sistema de fichas avanzado', 'Soporte prioritario 24/7'],
        activo: true,
      },
    ];

    for (const planData of planes) {
      const plan = new Plan();
      Object.assign(plan, planData);
      await planRepo.save(plan);
    }

    // Crear sede demo
    const sedeRepo = dataSource.getRepository(Sede);
    const sede = new Sede();
    sede.nombre = 'Sede Central Santiago';
    sede.direccion = 'Av. Providencia 1234, Providencia';
    sede.estado = 'ACTIVA';
    sede.telefono = '+56229876543';
    sede.email = 'sede.central@psicoespacios.com';
    sede.horarioAtencion = {
      diasHabiles: [
        { dia: 'LUNES', inicio: '09:00', fin: '18:00', cerrado: false },
        { dia: 'MARTES', inicio: '09:00', fin: '18:00', cerrado: false },
        { dia: 'MIERCOLES', inicio: '09:00', fin: '18:00', cerrado: false },
        { dia: 'JUEVES', inicio: '09:00', fin: '18:00', cerrado: false },
        { dia: 'VIERNES', inicio: '09:00', fin: '18:00', cerrado: false },
        { dia: 'SABADO', inicio: '09:00', fin: '13:00', cerrado: false },
        { dia: 'DOMINGO', inicio: '00:00', fin: '00:00', cerrado: true },
      ],
    };
    sede.serviciosDisponibles = ['consulta-psicologica', 'terapia-grupal', 'terapia-familiar'];
    await sedeRepo.save(sede);

    // Crear boxes para la sede demo
    const boxRepo = dataSource.getRepository(Box);
    const boxes = [
      {
        numero: '101',
        nombre: 'Box amplio para terapia grupal',
        capacidad: 3,
        equipamiento: [
          'Sillón terapéutico: 1',
          'Sillas: 2',
          'Escritorio: 1'
        ],
        estado: 'DISPONIBLE',
      },
      {
        numero: '102',
        nombre: 'Box ideal para terapia individual',
        capacidad: 2,
        equipamiento: [
          'Sillón terapéutico: 1',
          'Silla: 1',
          'Escritorio: 1'
        ],
        estado: 'DISPONIBLE',
      },
      {
        numero: '103',
        nombre: 'Box para terapia familiar',
        capacidad: 4,
        equipamiento: [
          'Sillón terapéutico: 2',
          'Sillas: 2',
          'Mesa: 1'
        ],
        estado: 'DISPONIBLE',
      },
    ];

    for (const boxData of boxes) {
      const box = new Box();
      Object.assign(box, boxData);
      box.sede = sede;
      await boxRepo.save(box);
    }

    // Crear configuración inicial del sistema
    const configRepo = dataSource.getRepository(ConfiguracionSistema);
    const config = new ConfiguracionSistema();
    config.configuracionGeneral = {
      nombreSistema: 'PsicoEspacios',
      colorPrimario: '#4A90E2',
      colorSecundario: '#50E3C2',
      contactoSoporte: 'soporte@psicoespacios.cl',
    };
    config.configuracionReservas = {
      tiempoMinimoReserva: 30,
      tiempoMaximoReserva: 120,
      anticipacionMinima: 24,
      anticipacionMaxima: 720,
      intervaloHorario: [9, 20],
    };
    config.configuracionPagos = {
      moneda: 'CLP',
      comisionPlataforma: 5,
      metodosHabilitados: ['TARJETA', 'TRANSFERENCIA'],
      datosTransferencia: {
        banco: 'Banco Estado',
        tipoCuenta: 'Cuenta Corriente',
        numeroCuenta: '123456789',
        titular: 'PsicoEspacios SpA',
        rut: '77.888.999-K',
        email: 'pagos@psicoespacios.cl',
      },
    };
    config.configuracionDerivacion = {
      especialidades: [
        'Psicología Clínica',
        'Psicología Infantil',
        'Terapia Familiar',
        'Psicología Laboral',
      ],
      modalidades: ['PRESENCIAL', 'ONLINE'],
      tiempoMaximoRespuesta: 48,
      comisionDerivacion: 10,
    };
    config.configuracionSuscripciones = {
      periodosRenovacion: [1, 3, 6, 12],
      descuentosRenovacion: [
        { periodo: 3, descuento: 5 },
        { periodo: 6, descuento: 10 },
        { periodo: 12, descuento: 15 },
      ],
    };
    config.configuracionNotificaciones = {
      emailsHabilitados: true,
      plantillasEmail: {
        bienvenida: {
          asunto: '¡Bienvenido a PsicoEspacios!',
          plantilla: 'Plantilla de bienvenida por defecto',
        },
        reservaConfirmada: {
          asunto: 'Tu reserva ha sido confirmada',
          plantilla: 'Plantilla de confirmación por defecto',
        },
      },
    };
    await configRepo.save(config);

    console.log('¡Base de datos poblada exitosamente!');
  } catch (error) {
    console.error('Error al poblar la base de datos:', error);
    throw error;
  } finally {
    await app.close();
  }
}

seed();