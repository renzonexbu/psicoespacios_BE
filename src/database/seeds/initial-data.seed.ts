import { Factory, Seeder } from 'typeorm-seeding';
import { Connection } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../common/entities/user.entity';
import { Plan, TipoPlan } from '../../common/entities/plan.entity';
import { Sede } from '../../common/entities/sede.entity';
import { Box } from '../../common/entities/box.entity';
import { ConfiguracionSistema } from '../../common/entities/configuracion-sistema.entity';

export default class InitialDataSeed implements Seeder {
  public async run(factory: Factory, connection: Connection): Promise<void> {
    // Crear usuario administrador
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await connection
      .createQueryBuilder()
      .insert()
      .into(User)
      .values([
        {
          email: 'admin@psicoespacios.cl',
          password: adminPassword,
          firstName: 'Admin',
          lastName: 'Sistema',
          role: 'ADMIN',
          estado: 'ACTIVO',
          verificado: true,
        },
      ])
      .execute();

    // Crear planes base
    const planes = await connection
      .createQueryBuilder()
      .insert()
      .into(Plan)
      .values([
        {
          tipo: TipoPlan.BASICO,
          nombre: 'Plan Básico',
          descripcion: 'Plan ideal para comenzar',
          precio: 29990,
          duracionMeses: 1,
          caracteristicas: [
            { nombre: 'Reservas de box', descripcion: 'Hasta 20 horas mensuales', incluido: true },
            { nombre: 'Derivaciones', descripcion: 'Sistema de derivación básico', incluido: true },
            { nombre: 'Reportes', descripcion: 'Reportes básicos', incluido: true },
          ],
          descuento: 0,
          activo: true,
        },
        {
          tipo: TipoPlan.INTERMEDIO,
          nombre: 'Plan Profesional',
          descripcion: 'Para profesionales establecidos',
          precio: 49990,
          duracionMeses: 1,
          caracteristicas: [
            { nombre: 'Reservas de box', descripcion: 'Hasta 40 horas mensuales', incluido: true },
            { nombre: 'Derivaciones', descripcion: 'Sistema de derivación avanzado', incluido: true },
            { nombre: 'Reportes', descripcion: 'Reportes avanzados', incluido: true },
            { nombre: 'Fichas clínicas', descripcion: 'Sistema de fichas ilimitado', incluido: true },
          ],
          descuento: 0,
          activo: true,
        },
        {
          tipo: TipoPlan.PREMIUM,
          nombre: 'Plan Premium',
          descripcion: 'Todas las características disponibles',
          precio: 79990,
          duracionMeses: 1,
          caracteristicas: [
            { nombre: 'Reservas de box', descripcion: 'Horas ilimitadas', incluido: true },
            { nombre: 'Derivaciones', descripcion: 'Sistema de derivación premium', incluido: true },
            { nombre: 'Reportes', descripcion: 'Reportes personalizados', incluido: true },
            { nombre: 'Fichas clínicas', descripcion: 'Sistema de fichas avanzado', incluido: true },
            { nombre: 'Soporte prioritario', descripcion: 'Atención 24/7', incluido: true },
          ],
          descuento: 0,
          activo: true,
        },
      ])
      .execute();

    // Crear sede demo
    const sede = await connection
      .createQueryBuilder()
      .insert()
      .into(Sede)
      .values([
        {
          nombre: 'Sede Central Santiago',
          direccion: 'Av. Providencia 1234',
          ciudad: 'Santiago',
          comuna: 'Providencia',
          descripcion: 'Sede principal ubicada en el corazón de Providencia',
          activa: true,
          telefono: '+56229876543',
          email: 'sede.central@psicoespacios.cl',
          horarioAtencion: {
            diasHabiles: ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES'],
            horaApertura: '09:00',
            horaCierre: '20:00',
          },
        },
      ])
      .execute();

    // Crear boxes para la sede demo
    await connection
      .createQueryBuilder()
      .insert()
      .into(Box)
      .values([
        {
          numero: '101',
          piso: 1,
          descripcion: 'Box amplio con vista exterior',
          capacidad: 3,
          precioHora: 15000,
          precioJornada: 80000,
          equipamiento: [
            { nombre: 'Sillón terapéutico', cantidad: 1 },
            { nombre: 'Sillas', cantidad: 2 },
            { nombre: 'Escritorio', cantidad: 1 },
          ],
          dimensiones: {
            largo: 4,
            ancho: 3,
            alto: 2.5,
            unidad: 'metros',
          },
          activo: true,
          caracteristicas: ['Ventilación natural', 'Iluminación LED', 'Aislación acústica'],
          sede: { id: sede.identifiers[0].id },
        },
        {
          numero: '102',
          piso: 1,
          descripcion: 'Box ideal para terapia individual',
          capacidad: 2,
          precioHora: 12000,
          precioJornada: 65000,
          equipamiento: [
            { nombre: 'Sillón terapéutico', cantidad: 1 },
            { nombre: 'Silla', cantidad: 1 },
            { nombre: 'Escritorio', cantidad: 1 },
          ],
          dimensiones: {
            largo: 3,
            ancho: 2.5,
            alto: 2.5,
            unidad: 'metros',
          },
          activo: true,
          caracteristicas: ['Aislación acústica', 'Iluminación LED'],
          sede: { id: sede.identifiers[0].id },
        },
      ])
      .execute();

    // Crear configuración inicial del sistema
    await connection
      .createQueryBuilder()
      .insert()
      .into(ConfiguracionSistema)
      .values([
        {
          configuracionGeneral: {
            nombreSistema: 'PsicoEspacios',
            colorPrimario: '#4A90E2',
            colorSecundario: '#50E3C2',
            contactoSoporte: 'soporte@psicoespacios.cl',
          },
          configuracionReservas: {
            tiempoMinimoReserva: 30,
            tiempoMaximoReserva: 120,
            anticipacionMinima: 24,
            anticipacionMaxima: 720,
            intervaloHorario: [9, 20],
          },
          configuracionPagos: {
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
          },
          configuracionDerivacion: {
            especialidades: [
              'Psicología Clínica',
              'Psicología Infantil',
              'Terapia Familiar',
              'Psicología Laboral',
            ],
            modalidades: ['PRESENCIAL', 'ONLINE'],
            tiempoMaximoRespuesta: 48,
            comisionDerivacion: 10,
          },
          configuracionSuscripciones: {
            periodosRenovacion: [1, 3, 6, 12],
            descuentosRenovacion: [
              { periodo: 3, descuento: 5 },
              { periodo: 6, descuento: 10 },
              { periodo: 12, descuento: 15 },
            ],
          },
          configuracionNotificaciones: {
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
          },
        },
      ])
      .execute();
  }
}