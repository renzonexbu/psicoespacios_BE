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
  }
];

// Función para crear boxes iniciales

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