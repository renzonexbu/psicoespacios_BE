import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { User } from '../../common/entities/user.entity';
import { Plan, TipoPlan } from '../../common/entities/plan.entity';
import { Sede } from '../../common/entities/sede.entity';
import { Box } from '../../common/entities/box.entity';
import { ConfiguracionSistema } from '../../common/entities/configuracion-sistema.entity';
import { Dimension } from '../../common/entities/box.entity';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  try {
    // Crear usuario administrador
    const adminPassword = await bcrypt.hash('admin123', 10);
    const userRepo = dataSource.getRepository(User);
    const admin = new User();
    admin.email = 'admin@psicoespacios.cl';
    admin.password = adminPassword;
    admin.firstName = 'Admin';
    admin.lastName = 'Sistema';
    admin.role = 'ADMIN';
    admin.estado = 'ACTIVO';
    admin.verificado = true;
    await userRepo.save(admin);

    // Crear planes base
    const planRepo = dataSource.getRepository(Plan);
    const planes = [
      {
        tipo: TipoPlan.BASICO,
        nombre: 'Plan Básico',
        descripcion: 'Plan ideal para comenzar',
        precio: 29990,
        duracionMeses: 1,
        caracteristicas: JSON.stringify([
          { nombre: 'Reservas de box', descripcion: 'Hasta 20 horas mensuales', incluido: true },
          { nombre: 'Derivaciones', descripcion: 'Sistema de derivación básico', incluido: true },
          { nombre: 'Reportes', descripcion: 'Reportes básicos', incluido: true },
        ]),
        descuento: 0,
        activo: true,
      },
      {
        tipo: TipoPlan.INTERMEDIO,
        nombre: 'Plan Profesional',
        descripcion: 'Para profesionales establecidos',
        precio: 49990,
        duracionMeses: 1,
        caracteristicas: JSON.stringify([
          { nombre: 'Reservas de box', descripcion: 'Hasta 40 horas mensuales', incluido: true },
          { nombre: 'Derivaciones', descripcion: 'Sistema de derivación avanzado', incluido: true },
          { nombre: 'Reportes', descripcion: 'Reportes avanzados', incluido: true },
          { nombre: 'Fichas clínicas', descripcion: 'Sistema de fichas ilimitado', incluido: true },
        ]),
        descuento: 0,
        activo: true,
      },
      {
        tipo: TipoPlan.PREMIUM,
        nombre: 'Plan Premium',
        descripcion: 'Todas las características disponibles',
        precio: 79990,
        duracionMeses: 1,
        caracteristicas: JSON.stringify([
          { nombre: 'Reservas de box', descripcion: 'Horas ilimitadas', incluido: true },
          { nombre: 'Derivaciones', descripcion: 'Sistema de derivación premium', incluido: true },
          { nombre: 'Reportes', descripcion: 'Reportes personalizados', incluido: true },
          { nombre: 'Fichas clínicas', descripcion: 'Sistema de fichas avanzado', incluido: true },
          { nombre: 'Soporte prioritario', descripcion: 'Atención 24/7', incluido: true },
        ]),
        descuento: 0,
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
    sede.direccion = 'Av. Providencia 1234';
    sede.ciudad = 'Santiago';
    sede.comuna = 'Providencia';
    sede.descripcion = 'Sede principal ubicada en el corazón de Providencia';
    sede.activa = true;
    sede.telefono = '+56229876543';
    sede.email = 'sede.central@psicoespacios.cl';
    sede.horarioAtencion = {
      diasHabiles: ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES'],
      horaApertura: '09:00',
      horaCierre: '20:00',
    };
    await sedeRepo.save(sede);

    // Crear boxes para la sede demo
    const boxRepo = dataSource.getRepository(Box);
    const boxes = [
      {
        numero: '101',
        piso: 1,
        descripcion: 'Box amplio con vista exterior',
        capacidad: 3,
        precioHora: 15000,
        precioJornada: 80000,
        equipamiento: JSON.stringify([
          { nombre: 'Sillón terapéutico', cantidad: 1 },
          { nombre: 'Sillas', cantidad: 2 },
          { nombre: 'Escritorio', cantidad: 1 },
        ]),
        dimensiones: {
          largo: 4,
          ancho: 3,
          alto: 2.5,
          unidad: 'metros',
        } as Dimension,
        activo: true,
        caracteristicas: ['Ventilación natural', 'Iluminación LED', 'Aislación acústica'],
        sede: sede,
      },
      {
        numero: '102',
        piso: 1,
        descripcion: 'Box ideal para terapia individual',
        capacidad: 2,
        precioHora: 12000,
        precioJornada: 65000,
        equipamiento: JSON.stringify([
          { nombre: 'Sillón terapéutico', cantidad: 1 },
          { nombre: 'Silla', cantidad: 1 },
          { nombre: 'Escritorio', cantidad: 1 },
        ]),
        dimensiones: {
          largo: 3,
          ancho: 2.5,
          alto: 2.5,
          unidad: 'metros',
        } as Dimension,
        activo: true,
        caracteristicas: ['Aislación acústica', 'Iluminación LED'],
        sede: sede,
      },
    ];

    for (const boxData of boxes) {
      const box = new Box();
      Object.assign(box, boxData);
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