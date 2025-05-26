import { faker } from '@faker-js/faker';
import { User } from '../../common/entities/user.entity';
import { hashSync } from 'bcrypt';
import { Role } from '../../common/enums/role.enum';
import { EstadoUsuario } from '../../common/enums/estado-usuario.enum';
import { Sede } from '../../common/entities/sede.entity';
import { Contacto } from '../../common/entities/contacto.entity';
import { ContactoEstado } from '../../common/enums/contacto-estado.enum';
import { Box } from '../../common/entities/box.entity';
import { Plan } from '../../common/entities/plan.entity';
import { EstadoPlan } from '../../common/enums/estado-plan.enum';
import { TipoPlan } from '../../common/enums/tipo-plan.enum';


// Usuarios iniciales
export const initialUsers: Partial<User>[] = [
  {
    email: 'admin@psicoespacios.com',
    password: hashSync('admin123', 10),
    nombre: 'Admin',
    apellido: 'Principal',
    rut: '12345678-9',
    telefono: '+56912345678',
    fechaNacimiento: new Date('1990-01-01'),
    role: Role.ADMIN,
    estado: EstadoUsuario.ACTIVO,
  },
  {
    email: 'terapeuta@psicoespacios.com',
    password: hashSync('terapia123', 10),
    nombre: 'Teresa',
    apellido: 'Psicóloga',
    rut: '98765432-1',
    telefono: '+56987654321',
    fechaNacimiento: new Date('1985-05-15'),
    role: Role.TERAPEUTA,
    estado: EstadoUsuario.ACTIVO,
  },
  {
    email: 'paciente@psicoespacios.com',
    password: hashSync('paciente123', 10),
    nombre: 'Pablo',
    apellido: 'Paciente',
    rut: '11223344-5',
    telefono: '+56911223344',
    fechaNacimiento: new Date('1992-10-20'),
    role: Role.PACIENTE,
    estado: EstadoUsuario.ACTIVO,
  }
];

// Sedes iniciales
export const initialSedes: Partial<Sede>[] = [
  {
    nombre: 'Sede Central',
    direccion: 'Av. Providencia 1234, Providencia',
    estado: 'ACTIVA',
    serviciosDisponibles: ['Terapia Individual', 'Terapia de Pareja', 'Talleres Grupales']
  },
  {
    nombre: 'Sede Norte',
    direccion: 'Av. Independencia 567, Independencia',
    estado: 'ACTIVA',
    serviciosDisponibles: ['Terapia Individual', 'Evaluación Psicológica']
  }
];

// Contactos iniciales
export const initialContactos: Partial<Contacto>[] = [
  {
    nombre: 'Juan Pérez',
    email: 'juan@example.com',
    telefono: '+56922334455',
    mensaje: 'Me interesa agendar una sesión para terapia individual',
    estado: ContactoEstado.NUEVA,
  },
  {
    nombre: 'María González',
    email: 'maria@example.com',
    telefono: '+56933445566',
    mensaje: 'Quisiera información sobre los talleres grupales',
    estado: ContactoEstado.PENDIENTE,
  }
];

// Planes iniciales
export const initialPlanes: Partial<Plan>[] = [
  {
    nombre: 'Plan Básico',
    precio: 30000,
    duracion: 1, // en meses
    horasIncluidas: 8,
    beneficios: [
      'Acceso a boxes durante 8 horas mensuales',
      'Reserva con 48 horas de anticipación',
      'Acceso a WiFi'
    ]
  },
  {
    nombre: 'Plan Estándar',
    precio: 50000,
    duracion: 1,
    horasIncluidas: 15,
    beneficios: [
      'Acceso a boxes durante 15 horas mensuales',
      'Reserva con 72 horas de anticipación',
      'Acceso a WiFi',
      'Uso de áreas comunes'
    ]
  },
  {
    nombre: 'Plan Premium',
    precio: 90000,
    duracion: 1,
    horasIncluidas: 30,
    beneficios: [
      'Acceso a boxes durante 30 horas mensuales',
      'Reserva hasta con 1 mes de anticipación',
      'Acceso a WiFi',
      'Uso de áreas comunes',
      'Acceso preferencial a boxes premium'
    ]
  }
];

// Función para crear boxes iniciales
export const createInitialBoxes = (sedes: Sede[]): Partial<Box>[] => {
  const boxes: Partial<Box>[] = [];
  
  sedes.forEach(sede => {
    for (let i = 1; i <= 3; i++) {
      boxes.push({
        numero: `${i}`,
        nombre: `Box ${i}`,
        capacidad: Math.floor(Math.random() * 3) + 2, // Entre 2 y 4
        equipamiento: [
          'Sillones: 2',
          'Escritorio: 1',
          'Material terapéutico: 1'
        ],
        estado: 'DISPONIBLE',
        sede: sede
      });
    }
  });
  
  return boxes;
};

// Configuración del sistema inicial
export const initialConfiguracion = {
  configuracionGeneral: {
    nombreSistema: 'PsicoEspacios',
    colorPrimario: '#3f51b5',
    colorSecundario: '#f50057',
    contactoSoporte: 'contacto@psicoespacios.com'
  },
  configuracionReservas: {
    tiempoMinimoReserva: 60,
    tiempoMaximoReserva: 240,
    anticipacionMinima: 24,
    anticipacionMaxima: 720,
    intervaloHorario: [9, 19]
  },
  configuracionPagos: {
    moneda: 'CLP',
    comisionPlataforma: 5,
    metodosHabilitados: ['TARJETA', 'TRANSFERENCIA'],
    datosTransferencia: {
      banco: 'Banco Estado',
      tipoCuenta: 'Corriente',
      numeroCuenta: '123456789',
      titular: 'PsicoEspacios SpA',
      rut: '76.123.456-7',
      email: 'pagos@psicoespacios.com'
    }
  },
  configuracionDerivacion: {
    especialidades: [
      'Psicología Clínica',
      'Psicología Infantil',
      'Terapia de Pareja',
      'Terapia Familiar'
    ],
    modalidades: ['Presencial', 'Online'],
    tiempoMaximoRespuesta: 48,
    comisionDerivacion: 10
  },
  configuracionSuscripciones: {
    periodosRenovacion: [1, 3, 6, 12],
    descuentosRenovacion: [
      {periodo: 3, descuento: 5},
      {periodo: 6, descuento: 10},
      {periodo: 12, descuento: 15}
    ]
  },
  configuracionNotificaciones: {
    emailsHabilitados: true,
    plantillasEmail: {
      bienvenida: {
        asunto: 'Bienvenido a PsicoEspacios',
        plantilla: 'Bienvenido a nuestra plataforma...'
      }
    }
  }
};