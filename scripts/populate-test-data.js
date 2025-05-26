#!/usr/bin/env node
// populate-test-data.js - Script para insertar datos de prueba en todas las tablas principales
const { Client } = require('pg');
require('dotenv').config();

async function populateTestData() {
  console.log('Iniciando inserción de datos de prueba...');

  // Configuración explícita para desarrollo local
  const config = {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    database: process.env.DATABASE_NAME || 'psicoespacios',
    user: process.env.DATABASE_USERNAME || 'psicoespacios_user',
    password: process.env.DATABASE_PASSWORD || 'psicoespacios_password',
  };

  // Usar DATABASE_URL si está definida (para producción)
  if (process.env.DATABASE_URL) {
    console.log('Usando DATABASE_URL para conectar a la base de datos');
    config.connectionString = process.env.DATABASE_URL;

    // Añadir SSL solo si estamos en producción
    if (
      (process.env.DATABASE_URL.startsWith('postgres://') ||
        process.env.DATABASE_URL.startsWith('postgresql://')) &&
      process.env.NODE_ENV === 'production'
    ) {
      config.ssl = {
        rejectUnauthorized: false,
      };
    }
  }

  // Crear cliente de PostgreSQL
  const client = new Client(config);

  try {
    // Conectar a la base de datos
    console.log(
      'Intentando conectar a',
      config.connectionString || `${config.host}:${config.port}`,
    );
    await client.connect();
    console.log('Conexión a la base de datos establecida');

    // 1. Insertar datos en la tabla configuracion_sistema
    console.log('Poblando tabla configuracion_sistema...');
    await client.query(`
      DELETE FROM configuracion_sistema;
      INSERT INTO configuracion_sistema 
      ("configuracionGeneral", "configuracionReservas", "configuracionPagos", "configuracionDerivacion", "configuracionSuscripciones", "configuracionNotificaciones") 
      VALUES 
      (
        '{"nombreSistema":"PsicoEspacios","logotipo":"https://example.com/logo.png","colorPrimario":"#3f51b5","colorSecundario":"#f50057","contactoSoporte":"contacto@psicoespacios.com"}',
        '{"tiempoMinimoReserva":60,"tiempoMaximoReserva":240,"anticipacionMinima":24,"anticipacionMaxima":720,"intervaloHorario":[9,19]}',
        '{"moneda":"CLP","comisionPlataforma":5,"metodosHabilitados":["TARJETA","TRANSFERENCIA"],"datosTransferencia":{"banco":"Banco Estado","tipoCuenta":"Corriente","numeroCuenta":"123456789","titular":"PsicoEspacios SpA","rut":"76.123.456-7","email":"pagos@psicoespacios.com"}}',
        '{"especialidades":["Psicología Clínica","Psicología Infantil","Terapia de Pareja","Terapia Familiar"],"modalidades":["Presencial","Online"],"tiempoMaximoRespuesta":48,"comisionDerivacion":10}',
        '{"periodosRenovacion":[1,3,6,12],"descuentosRenovacion":[{"periodo":3,"descuento":5},{"periodo":6,"descuento":10},{"periodo":12,"descuento":15}]}',
        '{"emailsHabilitados":true,"plantillasEmail":{"bienvenida":{"asunto":"Bienvenido a PsicoEspacios","plantilla":"Bienvenido a nuestra plataforma..."}}}'
      );
    `);
    console.log('✅ Datos insertados en configuracion_sistema');

    // 2. Insertar datos en la tabla sedes
    console.log('Poblando tabla sedes...');
    await client.query(`
      DELETE FROM sedes;
      INSERT INTO sedes 
      (nombre, direccion, ciudad, comuna, telefono, email, descripcion, coordenadas, estado) 
      VALUES 
      ('PsicoEspacios Providencia', 'Av. Providencia 1234', 'Santiago', 'Providencia', '+56912345678', 'providencia@psicoespacios.com', 'Sede principal en el corazón de Providencia', '{"lat": -33.4289, "lng": -70.6093}', 'ACTIVA'),
      ('PsicoEspacios Las Condes', 'Av. Apoquindo 4500', 'Santiago', 'Las Condes', '+56923456789', 'lascondes@psicoespacios.com', 'Sede moderna en el sector financiero', '{"lat": -33.4103, "lng": -70.5831}', 'ACTIVA'),
      ('PsicoEspacios Ñuñoa', 'Av. Irarrázaval 3400', 'Santiago', 'Ñuñoa', '+56934567890', 'nunoa@psicoespacios.com', 'Sede acogedora en barrio residencial', '{"lat": -33.4563, "lng": -70.5934}', 'ACTIVA'),
      ('PsicoEspacios Vitacura', 'Av. Vitacura 2900', 'Santiago', 'Vitacura', '+56945678901', 'vitacura@psicoespacios.com', 'Sede exclusiva en zona premium', '{"lat": -33.3995, "lng": -70.5986}', 'ACTIVA'),
      ('PsicoEspacios Santiago Centro', 'Estado 336', 'Santiago', 'Santiago', '+56956789012', 'centro@psicoespacios.com', 'Sede céntrica de fácil acceso', '{"lat": -33.4403, "lng": -70.6531}', 'ACTIVA'),
      ('PsicoEspacios La Florida', 'Av. Vicuña Mackenna 7110', 'Santiago', 'La Florida', '+56967890123', 'laflorida@psicoespacios.com', 'Sede amplia con estacionamiento gratuito', '{"lat": -33.5163, "lng": -70.6013}', 'ACTIVA'),
      ('PsicoEspacios Maipú', 'Av. Pajaritos 2700', 'Santiago', 'Maipú', '+56978901234', 'maipu@psicoespacios.com', 'Sede comunitaria accesible', '{"lat": -33.5027, "lng": -70.7738}', 'ACTIVA'),
      ('PsicoEspacios Viña del Mar', 'Av. San Martín 700', 'Viña del Mar', 'Viña del Mar', '+56989012345', 'vina@psicoespacios.com', 'Sede con vista al mar', '{"lat": -33.0153, "lng": -71.5517}', 'ACTIVA'),
      ('PsicoEspacios Concepción', 'Av. Arturo Prat 199', 'Concepción', 'Concepción', '+56990123456', 'concepcion@psicoespacios.com', 'Sede central en Concepción', '{"lat": -36.8270, "lng": -73.0319}', 'ACTIVA'),
      ('PsicoEspacios Recoleta', 'Av. Recoleta 2500', 'Santiago', 'Recoleta', '+56901234567', 'recoleta@psicoespacios.com', 'Sede en corazón multicultural', '{"lat": -33.4000, "lng": -70.6400}', 'ACTIVA');
    `);
    console.log('✅ Datos insertados en sedes');

    // 3. Insertar datos en la tabla planes
    console.log('Poblando tabla planes...');
    await client.query(`
      DELETE FROM planes;
      INSERT INTO planes 
      (nombre, descripcion, precio, "duracionMeses", tipo, caracteristicas, "horasIncluidas", "descuentoHoraAdicional", estado) 
      VALUES 
      ('Plan Básico', 'Plan ideal para psicólogos que inician su práctica.', 50000, 1, 'BASICO', '["Acceso a boxes 10h","Wi-Fi","Áreas comunes"]', 10, 0, 'ACTIVO'),
      ('Plan Estándar', 'Para psicólogos con práctica regular.', 90000, 1, 'INTERMEDIO', '["Acceso a boxes 20h","Wi-Fi","Áreas comunes","Descuento horas extra"]', 20, 10, 'ACTIVO'),
      ('Plan Premium', 'Para profesionales con alta demanda de pacientes.', 150000, 1, 'PREMIUM', '["Acceso a boxes 40h","Wi-Fi","Áreas comunes","Mayor descuento","Boxes premium"]', 40, 20, 'ACTIVO'),
      ('Plan Básico Trimestral', 'Plan básico con duración trimestral.', 135000, 3, 'BASICO', '["Acceso a boxes 10h/mes","Wi-Fi","Descuento 10%"]', 30, 0, 'ACTIVO'),
      ('Plan Estándar Trimestral', 'Plan estándar con duración trimestral.', 245000, 3, 'INTERMEDIO', '["Acceso a boxes 20h/mes","Wi-Fi","Áreas comunes","Descuento"]', 60, 10, 'ACTIVO'),
      ('Plan Premium Trimestral', 'Plan premium con duración trimestral.', 405000, 3, 'PREMIUM', '["Acceso a boxes 40h/mes","Wi-Fi","Descuento 15%"]', 120, 20, 'ACTIVO'),
      ('Plan Semestral', 'Plan de 6 meses con máximo ahorro.', 459000, 6, 'INTERMEDIO', '["Acceso a boxes 20h/mes","Wi-Fi","Descuento 15%"]', 120, 15, 'ACTIVO'),
      ('Plan Anual Básico', 'Plan básico con compromiso anual.', 540000, 12, 'BASICO', '["Acceso a boxes 10h/mes","Wi-Fi","Descuento 25%"]', 120, 5, 'ACTIVO'),
      ('Plan Anual Premium', 'Máximo ahorro con compromiso anual.', 1530000, 12, 'PREMIUM', '["Acceso a boxes 40h/mes","Wi-Fi","Descuento 30%"]', 480, 25, 'ACTIVO'),
      ('Plan Corporativo', 'Para grupos de profesionales.', 350000, 1, 'PREMIUM', '["Acceso a boxes 80h/mes","Wi-Fi","Sala reuniones","Secretaría"]', 80, 30, 'ACTIVO');
    `);
    console.log('✅ Datos insertados en planes');

    // 4. Insertar datos en la tabla users
    console.log('Poblando tabla users...');
    // Hashear la contraseña (hardcodeada para simplificar)
    // En un entorno real se haría con bcrypt: await bcrypt.hash('password', 10)
    const hashedPassword =
      '$2b$10$vKsvytz0FPRhwmaX7XTfhO8FGD127iiGdumLl2HqLTGxjQTXJ5.Tq'; // 'password123'

    await client.query(`
      DELETE FROM users;
      INSERT INTO users 
      (email, password, nombre, apellido, rut, telefono, role, especialidad, bio, estado) 
      VALUES 
      ('admin@psicoespacios.com', '${hashedPassword}', 'Administrador', 'Sistema', '11111111-1', '+56911111111', 'ADMIN', NULL, 'Administrador del sistema', 'ACTIVO'),
      ('maria@psicoespacios.com', '${hashedPassword}', 'María', 'Rodríguez', '12345678-9', '+56912345678', 'PSICOLOGO', 'Psicología Clínica', 'Psicóloga clínica con 10 años de experiencia', 'ACTIVO'),
      ('juan@psicoespacios.com', '${hashedPassword}', 'Juan', 'Pérez', '23456789-0', '+56923456789', 'PSICOLOGO', 'Psicología Infantil', 'Especialista en desarrollo infantil', 'ACTIVO'),
      ('ana@psicoespacios.com', '${hashedPassword}', 'Ana', 'Gómez', '34567890-1', '+56934567890', 'PSICOLOGO', 'Terapia de Pareja', 'Terapeuta con enfoque sistémico', 'ACTIVO'),
      ('carlos@psicoespacios.com', '${hashedPassword}', 'Carlos', 'Muñoz', '45678901-2', '+56945678901', 'PSICOLOGO', 'Psicología Laboral', 'Especialista en estrés laboral', 'ACTIVO'),
      ('patricia@psicoespacios.com', '${hashedPassword}', 'Patricia', 'Soto', '56789012-3', '+56956789012', 'PSICOLOGO', 'Neuropsicología', 'Especialista en evaluación cognitiva', 'ACTIVO'),
      ('roberto@psicoespacios.com', '${hashedPassword}', 'Roberto', 'Díaz', '67890123-4', '+56967890123', 'PSICOLOGO', 'Psicología Forense', 'Experto en peritajes psicológicos', 'ACTIVO'),
      ('cliente1@example.com', '${hashedPassword}', 'Claudia', 'Vargas', '78901234-5', '+56978901234', 'USUARIO', NULL, NULL, 'ACTIVO'),
      ('cliente2@example.com', '${hashedPassword}', 'Rodrigo', 'Silva', '89012345-6', '+56989012345', 'USUARIO', NULL, NULL, 'ACTIVO'),
      ('soporte@psicoespacios.com', '${hashedPassword}', 'Soporte', 'Técnico', '90123456-7', '+56990123456', 'SOPORTE', NULL, 'Equipo de soporte técnico', 'ACTIVO');
    `);
    console.log('✅ Datos insertados en users');

    // 5. Insertar datos en la tabla boxes
    console.log('Poblando tabla boxes...');

    // Obtener IDs de las sedes
    const sedes = await client.query('SELECT id FROM sedes LIMIT 10');

    if (sedes.rows.length > 0) {
      // Crear boxes para cada sede
      for (let i = 0; i < sedes.rows.length; i++) {
        const sedeId = sedes.rows[i].id;
        // Crear al menos un box para cada sede
        await client.query(`
          INSERT INTO boxes 
          (nombre, descripcion, capacidad, precio, "precioHora", caracteristicas, imagenes, estado, "sedeId") 
          VALUES 
          ('Box ${i * 3 + 1}', 'Box confortable ideal para terapia individual.', 2, ${15000 + i * 1000}, ${8000 + i * 500}, 
          '["Luz natural","Aire acondicionado","Insonorizado"]', 
          '["https://example.com/box${i * 3 + 1}_1.jpg","https://example.com/box${i * 3 + 1}_2.jpg"]', 
          'DISPONIBLE', '${sedeId}'),
          
          ('Box ${i * 3 + 2}', 'Box amplio para terapia de pareja o familiar.', 4, ${25000 + i * 1000}, ${12000 + i * 500}, 
          '["Luz natural","Aire acondicionado","Insonorizado","Sofá amplio"]', 
          '["https://example.com/box${i * 3 + 2}_1.jpg","https://example.com/box${i * 3 + 2}_2.jpg"]', 
          'DISPONIBLE', '${sedeId}'),
          
          ('Sala ${i * 3 + 3}', 'Sala para talleres o terapias grupales.', 8, ${40000 + i * 1000}, ${20000 + i * 500}, 
          '["Proyector","Pizarra","Sistema de audio","Sillas modulares"]', 
          '["https://example.com/sala${i * 3 + 3}_1.jpg","https://example.com/sala${i * 3 + 3}_2.jpg"]', 
          'DISPONIBLE', '${sedeId}');
        `);
      }
      console.log('✅ Datos insertados en boxes');
    } else {
      console.log('❌ No se pudieron insertar boxes porque no hay sedes');
    }

    // 6. Insertar datos en la tabla contactos
    console.log('Poblando tabla contactos...');
    await client.query(`
      DELETE FROM contactos;
      INSERT INTO contactos 
      (nombre, tipo, email, telefono, mensaje, fecha, estado) 
      VALUES 
      ('Alejandro Morales', 'CONSULTA', 'alejandro.m@example.com', '+56912345678', 'Me gustaría recibir más información sobre los planes disponibles.', '2025-04-15T10:30:00Z', 'NUEVA'),
      ('Patricia Vásquez', 'RECLAMO', 'patricia.v@example.com', '+56923456789', 'El aire acondicionado del box 102 no funcionaba correctamente.', '2025-04-16T15:20:00Z', 'EN_PROCESO'),
      ('Manuel Soto', 'SUGERENCIA', 'manuel.s@example.com', '+56934567890', 'Sería útil implementar un sistema de café para psicólogos y pacientes.', '2025-04-17T11:45:00Z', 'VISTA'),
      ('Carolina Mendoza', 'CONSULTA', 'carolina.m@example.com', '+56945678901', '¿Qué documentos necesito para registrarme como psicólogo?', '2025-04-18T09:15:00Z', 'RESPONDIDA'),
      ('Roberto Fuentes', 'CONSULTA', 'roberto.f@example.com', '+56956789012', '¿Tienen disponibilidad de boxes en Las Condes?', '2025-04-19T14:30:00Z', 'NUEVA'),
      ('Andrea Castro', 'RECLAMO', 'andrea.c@example.com', '+56967890123', 'Mi reserva fue cancelada sin previo aviso.', '2025-04-20T16:10:00Z', 'SOLUCIONADA'),
      ('Felipe Torres', 'SUGERENCIA', 'felipe.t@example.com', '+56978901234', 'Podrían ampliar el horario de atención los sábados.', '2025-04-21T10:05:00Z', 'VISTA'),
      ('Daniela Rojas', 'CONSULTA', 'daniela.r@example.com', '+56989012345', '¿Ofrecen algún descuento para grupos de psicólogos?', '2025-04-22T11:20:00Z', 'NUEVA'),
      ('Gabriel Martínez', 'RECLAMO', 'gabriel.m@example.com', '+56990123456', 'La wifi no funcionaba durante mi sesión del martes.', '2025-04-23T15:40:00Z', 'EN_PROCESO'),
      ('Valentina López', 'SUGERENCIA', 'valentina.l@example.com', '+56901234567', 'Sería útil tener una máquina dispensadora de agua en cada piso.', '2025-04-24T13:25:00Z', 'NUEVA');
    `);
    console.log('✅ Datos insertados en contactos');

    // 7. Crear suscripciones para los psicólogos
    console.log('Poblando tabla suscripciones...');

    // Obtener IDs de los psicólogos
    const psicologos = await client.query(
      "SELECT id FROM users WHERE role = 'PSICOLOGO' LIMIT 6",
    );

    // Obtener IDs de los planes
    const planes = await client.query(
      'SELECT id, "horasIncluidas", precio FROM planes LIMIT 6',
    );

    if (psicologos.rows.length > 0 && planes.rows.length > 0) {
      const hoy = new Date();
      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

      // Crear suscripciones
      for (
        let i = 0;
        i < Math.min(psicologos.rows.length, planes.rows.length);
        i++
      ) {
        const psicologoId = psicologos.rows[i].id;
        const planId = planes.rows[i].id;
        const horasIncluidas = planes.rows[i].horasIncluidas;
        const precio = planes.rows[i].precio;

        await client.query(`
          INSERT INTO suscripciones
          ("fechaInicio", "fechaFin", estado, "precioTotal", "planId", "usuarioId", "horasConsumidas", "horasDisponibles")
          VALUES
          ('${inicioMes.toISOString()}', '${finMes.toISOString()}', 'ACTIVA', ${precio}, '${planId}', '${psicologoId}', ${Math.floor(Math.random() * horasIncluidas)}, ${horasIncluidas / 2})
        `);
      }
      console.log('✅ Datos insertados en suscripciones');
    } else {
      console.log(
        '❌ No se pudieron insertar suscripciones porque faltan psicólogos o planes',
      );
    }

    // 8. Crear reservas
    console.log('Poblando tabla reservas...');

    // Obtener IDs de los boxes
    const boxes = await client.query('SELECT id, "sedeId" FROM boxes LIMIT 10');

    // Obtener IDs de las suscripciones
    const suscripciones = await client.query(
      'SELECT id, "usuarioId" FROM suscripciones WHERE estado = \'ACTIVA\'',
    );

    if (psicologos.rows.length > 0 && boxes.rows.length > 0) {
      const hoy = new Date();

      // Crear reservas (pasadas, actuales y futuras)
      for (let i = 0; i < 10; i++) {
        const psicologoIndex = i % psicologos.rows.length;
        const boxIndex = i % boxes.rows.length;

        const psicologoId = psicologos.rows[psicologoIndex].id;
        const boxId = boxes.rows[boxIndex].id;

        // Encontrar la suscripción correspondiente a este psicólogo (si existe)
        const suscripcion = suscripciones.rows.find(
          (s) => s.usuarioId === psicologoId,
        );
        const suscripcionId = suscripcion ? suscripcion.id : null;

        // Crear fechas para la reserva
        let fechaInicio, fechaFin, estado;

        if (i < 3) {
          // Reservas pasadas
          fechaInicio = new Date(hoy);
          fechaInicio.setDate(hoy.getDate() - (10 - i));
          fechaInicio.setHours(10 + i, 0, 0, 0);

          fechaFin = new Date(fechaInicio);
          fechaFin.setHours(fechaInicio.getHours() + 1);

          estado = i === 0 ? 'CANCELADA' : 'COMPLETADA';
        } else if (i < 6) {
          // Reservas para hoy o mañana
          fechaInicio = new Date(hoy);
          fechaInicio.setDate(hoy.getDate() + (i === 3 ? 0 : 1));
          fechaInicio.setHours(10 + i, 0, 0, 0);

          fechaFin = new Date(fechaInicio);
          fechaFin.setHours(fechaInicio.getHours() + 1);

          estado = 'CONFIRMADA';
        } else {
          // Reservas futuras
          fechaInicio = new Date(hoy);
          fechaInicio.setDate(hoy.getDate() + (i - 3));
          fechaInicio.setHours(10 + (i % 8), 0, 0, 0);

          fechaFin = new Date(fechaInicio);
          fechaFin.setHours(fechaInicio.getHours() + 1);

          estado = i < 8 ? 'CONFIRMADA' : 'PENDIENTE';
        }

        if (suscripcionId) {
          await client.query(`
            INSERT INTO reservas
            ("fechaInicio", "fechaFin", estado, notas, "psicologoId", "boxId", "suscripcionId")
            VALUES
            ('${fechaInicio.toISOString()}', '${fechaFin.toISOString()}', '${estado}', 'Sesión ${i + 1}', '${psicologoId}', '${boxId}', '${suscripcionId}')
          `);
        } else {
          await client.query(`
            INSERT INTO reservas
            ("fechaInicio", "fechaFin", estado, notas, "psicologoId", "boxId")
            VALUES
            ('${fechaInicio.toISOString()}', '${fechaFin.toISOString()}', '${estado}', 'Sesión ${i + 1}', '${psicologoId}', '${boxId}')
          `);
        }
      }
      console.log('✅ Datos insertados en reservas');
    } else {
      console.log(
        '❌ No se pudieron insertar reservas porque faltan psicólogos o boxes',
      );
    }

    console.log('✅ Población de datos de prueba completada exitosamente');
    await client.end();
    return true;
  } catch (error) {
    console.error('Error durante la población de datos:', error);
    try {
      await client.end();
    } catch (e) {
      // Ignorar errores al cerrar conexión
    }
    return false;
  }
}

// Ejecutar el script directamente
if (require.main === module) {
  populateTestData()
    .then((success) => {
      if (success) {
        console.log('✅ Script de población completado exitosamente');
        process.exit(0);
      } else {
        console.error('❌ Falló la población de datos');
        process.exit(1);
      }
    })
    .catch((err) => {
      console.error('Error fatal en el script:', err);
      process.exit(1);
    });
}

module.exports = { populateTestData };
