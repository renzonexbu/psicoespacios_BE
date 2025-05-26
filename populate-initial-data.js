const { Client } = require('pg');
require('dotenv').config();

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DATABASE_HOST || 'localhost',
  port: process.env.DATABASE_PORT || 5432,
  user: process.env.DATABASE_USER || 'psicoespacios_user',
  password: process.env.DATABASE_PASSWORD || 'psicoespacios_password',
  database: process.env.DATABASE_NAME || 'psicoespacios',
};

console.log('🌱 Iniciando población de datos iniciales...');

async function populateDatabase() {
  const client = new Client(dbConfig);

  try {
    await client.connect();
    console.log('✅ Conexión a la base de datos establecida');

    // 1. Insertar configuración del sistema
    console.log('🔧 Insertando configuración del sistema...');
    await client.query(`
      INSERT INTO configuracion_sistema (
        "configuracionGeneral",
        "configuracionReservas",
        "configuracionPagos",
        "configuracionDerivacion",
        "configuracionSuscripciones",
        "configuracionNotificaciones"
      ) VALUES (
        '{"nombreSistema":"PsicoEspacios","colorPrimario":"#3f51b5","colorSecundario":"#f50057","contactoSoporte":"contacto@psicoespacios.com","version":"1.0.0"}',
        '{"tiempoMinimoReserva":60,"tiempoMaximoReserva":240,"anticipacionMinima":24,"anticipacionMaxima":720,"intervaloHorario":[9,19],"diasSemana":[1,2,3,4,5]}',
        '{"moneda":"CLP","comisionPlataforma":5,"metodosHabilitados":["TARJETA","TRANSFERENCIA"],"cuentaBanco":{"banco":"Banco de Chile","numeroCuenta":"123456789"}}',
        '{"especialidades":["Psicología Clínica","Psicología Educacional","Neuropsicología","Terapia Familiar"],"modalidades":["Presencial","Online","Híbrida"],"tiempoMaximoRespuesta":48,"comisionDerivacion":10}',
        '{"periodosRenovacion":[1,3,6,12],"descuentosRenovacion":[{"meses":3,"descuento":5},{"meses":6,"descuento":10},{"meses":12,"descuento":15}]}',
        '{"emailsHabilitados":true,"plantillasEmail":{"bienvenida":"Bienvenido a PsicoEspacios","reservaConfirmada":"Su reserva ha sido confirmada","recordatorioSesion":"Recordatorio: Tiene una sesión programada"}}'
      )
      ON CONFLICT DO NOTHING
    `);

    // 2. Insertar usuarios administradores y psicólogos
    console.log('👥 Insertando usuarios...');

    // Admin principal
    await client.query(`
      INSERT INTO users (
        nombre, apellido, email, password, role, telefono, rut, estado
      ) VALUES (
        'Admin', 'Principal', 'admin@psicoespacios.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ADMIN', '+56912345678', '12345678-9', 'ACTIVO'
      )
      ON CONFLICT (email) DO NOTHING
    `);

    // Psicólogos de ejemplo
    const psicologos = [
      {
        nombre: 'María',
        apellido: 'González',
        email: 'maria.gonzalez@psicoespacios.com',
        telefono: '+56987654321',
        rut: '15678234-5',
        especialidad: 'Psicología Clínica',
        numeroRegistroProfesional: 'PSI-001',
        experiencia:
          '5 años de experiencia en terapia cognitivo-conductual y trastornos de ansiedad.',
      },
      {
        nombre: 'Carlos',
        apellido: 'Rodríguez',
        email: 'carlos.rodriguez@psicoespacios.com',
        telefono: '+56976543210',
        rut: '16789345-6',
        especialidad: 'Psicología Educacional',
        numeroRegistroProfesional: 'PSI-002',
        experiencia:
          '8 años trabajando con niños y adolescentes con dificultades de aprendizaje.',
      },
      {
        nombre: 'Ana',
        apellido: 'Martínez',
        email: 'ana.martinez@psicoespacios.com',
        telefono: '+56965432109',
        rut: '17890456-7',
        especialidad: 'Neuropsicología',
        numeroRegistroProfesional: 'PSI-003',
        experiencia:
          '6 años especializándose en evaluaciones neuropsicológicas y rehabilitación cognitiva.',
      },
    ];

    for (const psicologo of psicologos) {
      await client.query(
        `
        INSERT INTO users (
          nombre, apellido, email, password, role, telefono, rut, especialidad, "numeroRegistroProfesional", experiencia, estado
        ) VALUES (
          $1, $2, $3, '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'PSICOLOGO', $4, $5, $6, $7, $8, 'ACTIVO'
        )
        ON CONFLICT (email) DO NOTHING
      `,
        [
          psicologo.nombre,
          psicologo.apellido,
          psicologo.email,
          psicologo.telefono,
          psicologo.rut,
          psicologo.especialidad,
          psicologo.numeroRegistroProfesional,
          psicologo.experiencia,
        ],
      );
    }

    // Usuarios pacientes/clientes
    const usuarios = [
      {
        nombre: 'Juan',
        apellido: 'Pérez',
        email: 'juan.perez@email.com',
        telefono: '+56912345001',
        rut: '18901567-8',
      },
      {
        nombre: 'Laura',
        apellido: 'Silva',
        email: 'laura.silva@email.com',
        telefono: '+56912345002',
        rut: '19012678-9',
      },
      {
        nombre: 'Diego',
        apellido: 'López',
        email: 'diego.lopez@email.com',
        telefono: '+56912345003',
        rut: '20123789-0',
      },
    ];

    for (const usuario of usuarios) {
      await client.query(
        `
        INSERT INTO users (
          nombre, apellido, email, password, role, telefono, rut, estado
        ) VALUES (
          $1, $2, $3, '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'USUARIO', $4, $5, 'ACTIVO'
        )
        ON CONFLICT (email) DO NOTHING
      `,
        [
          usuario.nombre,
          usuario.apellido,
          usuario.email,
          usuario.telefono,
          usuario.rut,
        ],
      );
    }

    // 3. Insertar sedes
    console.log('🏢 Insertando sedes...');
    const sedes = [
      {
        nombre: 'Sede Las Condes',
        direccion: 'Av. Apoquindo 3000, Las Condes, Santiago',
        telefono: '+56223456789',
        email: 'lascondes@psicoespacios.com',
        horarioAtencion:
          '{"lunes":{"inicio":"09:00","fin":"19:00"},"martes":{"inicio":"09:00","fin":"19:00"},"miercoles":{"inicio":"09:00","fin":"19:00"},"jueves":{"inicio":"09:00","fin":"19:00"},"viernes":{"inicio":"09:00","fin":"19:00"},"sabado":{"inicio":"09:00","fin":"14:00"}}',
        serviciosDisponibles: [
          'Terapia Individual',
          'Terapia Familiar',
          'Evaluación Psicológica',
          'Neuropsicología',
        ],
      },
      {
        nombre: 'Sede Providencia',
        direccion: 'Av. Providencia 1500, Providencia, Santiago',
        telefono: '+56234567890',
        email: 'providencia@psicoespacios.com',
        horarioAtencion:
          '{"lunes":{"inicio":"08:00","fin":"20:00"},"martes":{"inicio":"08:00","fin":"20:00"},"miercoles":{"inicio":"08:00","fin":"20:00"},"jueves":{"inicio":"08:00","fin":"20:00"},"viernes":{"inicio":"08:00","fin":"20:00"}}',
        serviciosDisponibles: [
          'Terapia Individual',
          'Terapia de Pareja',
          'Psicología Educacional',
        ],
      },
    ];

    for (const sede of sedes) {
      await client.query(
        `
        INSERT INTO sedes (
          nombre, direccion, telefono, email, "horarioAtencion", "serviciosDisponibles", estado
        ) VALUES (
          $1, $2, $3, $4, $5, $6, 'ACTIVA'
        )
        ON CONFLICT DO NOTHING
      `,
        [
          sede.nombre,
          sede.direccion,
          sede.telefono,
          sede.email,
          sede.horarioAtencion,
          sede.serviciosDisponibles,
        ],
      );
    }

    // 4. Insertar boxes
    console.log('📦 Insertando boxes...');

    // Obtener IDs de las sedes
    const sedesResult = await client.query(
      'SELECT id, nombre FROM sedes ORDER BY nombre',
    );

    for (const sede of sedesResult.rows) {
      const numBoxes = sede.nombre.includes('Las Condes') ? 5 : 3;

      for (let i = 1; i <= numBoxes; i++) {
        await client.query(
          `
          INSERT INTO boxes (
            numero, nombre, capacidad, equipamiento, estado, "sedeId"
          ) VALUES (
            $1, $2, $3, $4, 'DISPONIBLE', $5
          )
          ON CONFLICT DO NOTHING
        `,
          [
            `${i.toString().padStart(2, '0')}`,
            `Box ${i} - ${sede.nombre}`,
            2,
            [
              'Escritorio',
              'Sillas cómodas',
              'Pizarra',
              'Equipo de videoconferencia',
            ],
            sede.id,
          ],
        );
      }
    }

    // 5. Insertar planes
    console.log('💳 Insertando planes...');
    const planes = [
      {
        nombre: 'Plan Básico',
        descripcion: 'Plan ideal para iniciar tu proceso terapéutico',
        precio: 149990,
        duracion: 30,
        tipo: 'BASICO',
        horasIncluidas: 4,
        beneficios: [
          '4 sesiones mensuales',
          'Acceso a plataforma online',
          'Soporte básico',
        ],
      },
      {
        nombre: 'Plan Estándar',
        descripcion: 'Plan completo con mayor flexibilidad',
        precio: 249990,
        duracion: 30,
        tipo: 'ESTANDAR',
        horasIncluidas: 8,
        beneficios: [
          '8 sesiones mensuales',
          'Acceso a plataforma online',
          'Soporte prioritario',
          'Sesiones online incluidas',
        ],
      },
      {
        nombre: 'Plan Premium',
        descripcion: 'Plan completo con todos los beneficios',
        precio: 399990,
        duracion: 30,
        tipo: 'PREMIUM',
        horasIncluidas: 12,
        beneficios: [
          '12 sesiones mensuales',
          'Acceso completo a plataforma',
          'Soporte 24/7',
          'Sesiones online ilimitadas',
          'Evaluaciones incluidas',
        ],
      },
    ];

    for (const plan of planes) {
      await client.query(
        `
        INSERT INTO planes (
          nombre, descripcion, precio, duracion, tipo, "horasIncluidas", beneficios, activo
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, true
        )
        ON CONFLICT DO NOTHING
      `,
        [
          plan.nombre,
          plan.descripcion,
          plan.precio,
          plan.duracion,
          plan.tipo,
          plan.horasIncluidas,
          plan.beneficios,
        ],
      );
    }

    // 6. Crear perfiles de derivación para los psicólogos
    console.log('👨‍⚕️ Creando perfiles de derivación...');
    const psicologosResult = await client.query(`
      SELECT id, nombre, apellido, especialidad 
      FROM users 
      WHERE role = 'PSICOLOGO'
    `);

    for (const psicologo of psicologosResult.rows) {
      const perfiles = {
        'Psicología Clínica': {
          especialidades:
            'Trastornos de Ansiedad, Depresión, Terapia Cognitivo-Conductual',
          modalidades: 'Presencial, Online',
          descripcion:
            'Especialista en terapia individual para adultos con enfoque cognitivo-conductual',
          tarifaHora: 45000,
          sedesAtencion: 'Las Condes, Providencia',
        },
        'Psicología Educacional': {
          especialidades: 'Dificultades de Aprendizaje, TDAH, Apoyo Escolar',
          modalidades: 'Presencial, Online, Domicilio',
          descripcion:
            'Especialista en evaluación e intervención en dificultades de aprendizaje',
          tarifaHora: 50000,
          sedesAtencion: 'Las Condes, Providencia',
        },
        Neuropsicología: {
          especialidades:
            'Evaluación Neuropsicológica, Rehabilitación Cognitiva, Demencias',
          modalidades: 'Presencial',
          descripcion:
            'Especialista en evaluación y rehabilitación de funciones cognitivas',
          tarifaHora: 55000,
          sedesAtencion: 'Las Condes',
        },
      };

      const perfil =
        perfiles[psicologo.especialidad] || perfiles['Psicología Clínica'];

      await client.query(
        `
        INSERT INTO perfiles_derivacion (
          especialidades, modalidades, descripcion, experiencia, "horariosAtencion", "sedesAtencion", "tarifaHora", aprobado, "psicologoId"
        ) VALUES (
          $1, $2, $3, 'Experiencia comprobada en el área', $4, $5, $6, true, $7
        )
        ON CONFLICT ("psicologoId") DO NOTHING
      `,
        [
          perfil.especialidades,
          perfil.modalidades,
          perfil.descripcion,
          '{"lunes":{"inicio":"09:00","fin":"18:00"},"martes":{"inicio":"09:00","fin":"18:00"},"miercoles":{"inicio":"09:00","fin":"18:00"},"jueves":{"inicio":"09:00","fin":"18:00"},"viernes":{"inicio":"09:00","fin":"15:00"}}',
          perfil.sedesAtencion,
          perfil.tarifaHora,
          psicologo.id,
        ],
      );
    }

    // 7. Crear algunas suscripciones de ejemplo
    console.log('📋 Creando suscripciones de ejemplo...');
    const usuariosResult = await client.query(`
      SELECT id, nombre, apellido 
      FROM users 
      WHERE role = 'USUARIO' 
      LIMIT 2
    `);

    const planesResult = await client.query(
      'SELECT id, "horasIncluidas" FROM planes ORDER BY precio LIMIT 2',
    );

    if (usuariosResult.rows.length > 0 && planesResult.rows.length > 0) {
      const fechaInicio = new Date();
      const fechaFin = new Date();
      fechaFin.setMonth(fechaFin.getMonth() + 1);

      await client.query(
        `
        INSERT INTO suscripciones (
          "fechaInicio", "fechaFin", estado, "precioTotal", "horasConsumidas", "horasDisponibles", "planId", "usuarioId"
        ) VALUES (
          $1, $2, 'ACTIVA', 149990, 1, $3, $4, $5
        )
        ON CONFLICT DO NOTHING
      `,
        [
          fechaInicio,
          fechaFin,
          planesResult.rows[0].horasIncluidas - 1,
          planesResult.rows[0].id,
          usuariosResult.rows[0].id,
        ],
      );
    }

    console.log('✅ Población de datos iniciales completada exitosamente');

    // Verificar datos insertados
    console.log('📊 Verificando datos insertados...');
    const verificaciones = [
      {
        tabla: 'users',
        query: 'SELECT COUNT(*) as count, role FROM users GROUP BY role',
      },
      { tabla: 'sedes', query: 'SELECT COUNT(*) as count FROM sedes' },
      { tabla: 'boxes', query: 'SELECT COUNT(*) as count FROM boxes' },
      { tabla: 'planes', query: 'SELECT COUNT(*) as count FROM planes' },
      {
        tabla: 'perfiles_derivacion',
        query: 'SELECT COUNT(*) as count FROM perfiles_derivacion',
      },
      {
        tabla: 'suscripciones',
        query: 'SELECT COUNT(*) as count FROM suscripciones',
      },
    ];

    for (const verificacion of verificaciones) {
      const result = await client.query(verificacion.query);
      console.log(`   📋 ${verificacion.tabla}:`, result.rows);
    }
  } catch (error) {
    console.error('❌ Error durante la población:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Ejecutar población
if (require.main === module) {
  populateDatabase()
    .then(() => {
      console.log('🎉 ¡Población de base de datos completada exitosamente!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { populateDatabase };
