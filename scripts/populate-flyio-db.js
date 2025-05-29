/**
 * Script para poblar la base de datos en fly.io
 * Este script se encarga de crear registros de ejemplo para todas las tablas
 * con validación para evitar errores si ya existen
 */
const { Pool } = require('pg');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

// Obtener configuración de conexión a la base de datos desde variables de entorno
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false, // Desactivar SSL para conexiones locales a través de proxy
});

// Función para ejecutar consultas SQL
async function executeQuery(query, params = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(query, params);
    return result;
  } catch (error) {
    console.error('Error ejecutando consulta:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

// Función principal para poblar la base de datos
async function populateDatabase() {
  console.log('Iniciando población de la base de datos...');

  try {
    // Insertar datos en las tablas en el orden correcto de dependencias
    await populateUsers();
    await populateConfiguracionSistema();
    await populateSedes();
    await populateBoxes();
    await populatePlanes();
    await populatePerfilesDerivacion(); // Depende de users
    await populatePacientes(); // Depende de users
    await populateSuscripciones(); // Depende de users, planes
    await populateReservas(); // Depende de users, boxes, suscripciones
    await populateFichasSesion(); // Depende de pacientes, users, reservas
    await populateSolicitudesDerivacion(); // Depende de users, pacientes, perfiles_derivacion
    await populatePagos(); // Depende de users, suscripciones, solicitudes_derivacion
    await populateContactos();

    console.log('Población de la base de datos completada con éxito.');
  } catch (error) {
    console.error('Error al poblar la base de datos:', error);
  } finally {
    // Cerrar la conexión del pool
    await pool.end();
  }
}

// Función para poblar tabla de contactos
async function populateContactos() {
  console.log('Poblando tabla de contactos...');

  // Comprobar si ya existen contactos
  const existingContactos = await executeQuery(
    'SELECT COUNT(*) FROM contactos',
  );

  if (parseInt(existingContactos.rows[0].count) > 0) {
    console.log('La tabla de contactos ya tiene datos. Omitiendo inserción.');
    return;
  }

  // Función para generar fechas aleatorias en el pasado (entre 1 y maxDays días)
  function getPastDate(maxDays = 90) {
    const now = new Date();
    const pastDate = new Date(now);
    pastDate.setDate(now.getDate() - Math.floor(Math.random() * maxDays) - 1);
    return pastDate;
  }

  // Array de contactos a insertar
  const contactos = [
    {
      nombre: 'Alejandro Morales',
      tipo: 'CONSULTA',
      email: 'alejandro.morales@mail.com',
      telefono: '+56912345678',
      mensaje:
        'Me gustaría recibir más información sobre los servicios de alquiler de boxes para psicólogos. ¿Cuáles son los precios y disponibilidad en la sede de Providencia?',
      fecha: getPastDate(10),
      estado: 'NUEVA',
    },
    {
      nombre: 'Patricia Vásquez',
      tipo: 'RECLAMO',
      email: 'patricia.vasquez@mail.com',
      telefono: '+56923456789',
      mensaje:
        'El aire acondicionado del box 102 de la sede Las Condes no funcionaba correctamente durante mi sesión del día 15 de mayo. Solicito una compensación o descuento en mi próxima reserva.',
      fecha: getPastDate(15),
      estado: 'VISTA',
    },
    {
      nombre: 'Manuel Soto',
      tipo: 'SUGERENCIA',
      email: 'manuel.soto@mail.com',
      telefono: '+56934567890',
      mensaje:
        'Sería excelente que implementaran un sistema de café/té para los psicólogos que alquilan los boxes. Mejoraría mucho la experiencia tanto para profesionales como para pacientes.',
      fecha: getPastDate(20),
      estado: 'SOLUCIONADA',
    },
    {
      nombre: 'Carolina López',
      tipo: 'CONSULTA',
      email: 'carolina.lopez@mail.com',
      telefono: '+56945678901',
      mensaje:
        '¿Ofrecen descuentos para psicólogos que están empezando su práctica? Me interesa alquilar un box dos veces por semana, pero los precios actuales son un poco altos para mí.',
      fecha: getPastDate(25),
      estado: 'SOLUCIONADA',
    },
    {
      nombre: 'Rodrigo Muñoz',
      tipo: 'OTRO',
      email: 'rodrigo.munoz@mail.com',
      telefono: '+56956789012',
      mensaje:
        'Soy representante de una asociación de psicólogos y nos gustaría establecer una alianza con PsicoEspacios. ¿Podríamos coordinar una reunión para discutir posibilidades de colaboración?',
      fecha: getPastDate(30),
      estado: 'VISTA',
    },
    {
      nombre: 'Isabel Torres',
      tipo: 'RECLAMO',
      email: 'isabel.torres@mail.com',
      telefono: '+56967890123',
      mensaje:
        'Reservé un box para el día 10 de mayo pero al llegar me informaron que ya estaba ocupado, a pesar de tener mi confirmación. Tuve que atender a mi paciente en un café cercano. Exijo una explicación y compensación.',
      fecha: getPastDate(35),
      estado: 'SOLUCIONADA',
    },
    {
      nombre: 'Fernando Díaz',
      tipo: 'CONSULTA',
      email: 'fernando.diaz@mail.com',
      telefono: '+56978901234',
      mensaje:
        '¿Tienen alguna sede en Valparaíso o están planeando expandirse a esa ciudad? Soy psicólogo y me interesa utilizar sus servicios.',
      fecha: getPastDate(40),
      estado: 'VISTA',
    },
    {
      nombre: 'Marcela Godoy',
      tipo: 'SUGERENCIA',
      email: 'marcela.godoy@mail.com',
      telefono: '+56989012345',
      mensaje:
        'Sería útil contar con una aplicación móvil para gestionar las reservas y recibir notificaciones sobre disponibilidad de boxes.',
      fecha: getPastDate(45),
      estado: 'NUEVA',
    },
    {
      nombre: 'Cristián Navarro',
      tipo: 'CONSULTA',
      email: 'cristian.navarro@mail.com',
      telefono: '+56990123456',
      mensaje:
        'Estoy interesado en los planes de suscripción. ¿Pueden enviarme más detalles sobre las ventajas del plan Premium y qué incluye?',
      fecha: getPastDate(50),
      estado: 'NUEVA',
    },
    {
      nombre: 'Verónica Campos',
      tipo: 'OTRO',
      email: 'veronica.campos@mail.com',
      telefono: '+56901234567',
      mensaje:
        'Soy periodista de una revista especializada en salud mental y me gustaría hacer un reportaje sobre PsicoEspacios. ¿Podría contactar con alguien del área de comunicaciones?',
      fecha: getPastDate(55),
      estado: 'VISTA',
    },
  ];

  // Insertar los contactos
  for (const contacto of contactos) {
    const query = `
      INSERT INTO contactos 
      (nombre, tipo, email, telefono, mensaje, fecha, estado) 
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;

    const values = [
      contacto.nombre,
      contacto.tipo,
      contacto.email,
      contacto.telefono,
      contacto.mensaje,
      contacto.fecha,
      contacto.estado,
    ];

    await executeQuery(query, values);
  }

  console.log('Tabla de contactos poblada exitosamente con 10 contactos.');
}

// Función para poblar tabla de pagos
async function populatePagos() {
  console.log('Poblando tabla de pagos...');

  // Comprobar si ya existen pagos
  const existingPagos = await executeQuery('SELECT COUNT(*) FROM pagos');

  if (parseInt(existingPagos.rows[0].count) > 0) {
    console.log('La tabla de pagos ya tiene datos. Omitiendo inserción.');
    return;
  }

  // Obtener IDs de usuarios
  const usuarios = await executeQuery('SELECT id FROM users');

  if (usuarios.rows.length === 0) {
    console.log(
      'No se encontraron usuarios para crear pagos. Omitiendo inserción.',
    );
    return;
  }

  // Obtener IDs de suscripciones
  const suscripciones = await executeQuery(
    'SELECT id, "precioTotal" FROM suscripciones WHERE estado != $1',
    ['CANCELADA'],
  );

  // Obtener IDs de solicitudes de derivación
  const solicitudes = await executeQuery(
    'SELECT id, "montoPrimeraSesion" FROM solicitudes_derivacion WHERE estado IN ($1, $2)',
    ['ACEPTADA', 'PAGADA'],
  );

  if (suscripciones.rows.length === 0 && solicitudes.rows.length === 0) {
    console.log(
      'No se encontraron suscripciones o solicitudes para crear pagos. Omitiendo inserción.',
    );
    return;
  }

  // Función para generar fechas aleatorias en el pasado (entre 1 y maxDays días)
  function getPastDate(maxDays = 180) {
    const now = new Date();
    const pastDate = new Date(now);
    pastDate.setDate(now.getDate() - Math.floor(Math.random() * maxDays) - 1);
    return pastDate;
  }

  // Array de pagos a insertar
  const pagos = [];

  // Crear pagos para suscripciones
  for (let i = 0; i < Math.min(suscripciones.rows.length, 5); i++) {
    const usuarioIndex = i % usuarios.rows.length;
    const suscripcionId = suscripciones.rows[i].id;
    const monto = parseFloat(suscripciones.rows[i].precioTotal);

    // Diferentes estados de pago
    let estado;
    let fechaCompletado = null;
    let fechaReembolso = null;
    let notasReembolso = null;

    if (i === 0) {
      estado = 'PENDIENTE';
    } else if (i === 1) {
      estado = 'PROCESANDO';
    } else if (i === 2) {
      estado = 'FALLIDO';
    } else if (i === 3) {
      estado = 'REEMBOLSADO';
      fechaCompletado = getPastDate(30);
      fechaReembolso = getPastDate(15);
      notasReembolso = 'Reembolso por cancelación anticipada.';
    } else {
      estado = 'COMPLETADO';
      fechaCompletado = getPastDate(60);
    }

    // Datos de transacción según método de pago
    const metodoPago = i % 2 === 0 ? 'TARJETA' : 'TRANSFERENCIA';
    let datosTransaccion;

    if (metodoPago === 'TARJETA') {
      datosTransaccion = {
        metodoPago: 'TARJETA',
        referencia: `TRX-${300000 + i}`,
        datosTarjeta: {
          ultimos4: `${4000 + i}`,
          marca: i % 2 === 0 ? 'VISA' : 'MASTERCARD',
        },
        fechaTransaccion: getPastDate(90),
      };
    } else {
      datosTransaccion = {
        metodoPago: 'TRANSFERENCIA',
        referencia: `TR-${400000 + i}`,
        datosTransferencia: {
          banco: 'Banco Estado',
          numeroOperacion: `${500000 + i}`,
        },
        fechaTransaccion: getPastDate(90),
      };
    }

    pagos.push({
      usuarioId: usuarios.rows[usuarioIndex].id,
      suscripcionId: suscripcionId,
      solicitudDerivacionId: null,
      tipo: 'SUSCRIPCION',
      monto: monto,
      estado: estado,
      datosTransaccion: datosTransaccion,
      notasReembolso: notasReembolso,
      metadatos: {
        plataforma: 'web',
        ipCliente: `192.168.1.${i + 1}`,
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124',
      },
      fechaCompletado: fechaCompletado,
      fechaReembolso: fechaReembolso,
    });
  }

  // Crear pagos para solicitudes de derivación
  for (let i = 0; i < Math.min(solicitudes.rows.length, 5); i++) {
    const usuarioIndex = (i + 5) % usuarios.rows.length;
    const solicitudId = solicitudes.rows[i].id;
    const monto = parseFloat(solicitudes.rows[i].montoPrimeraSesion);

    // Diferentes estados de pago
    let estado;
    let fechaCompletado = null;

    if (i === 0) {
      estado = 'PENDIENTE';
    } else if (i === 1) {
      estado = 'PROCESANDO';
    } else {
      estado = 'COMPLETADO';
      fechaCompletado = getPastDate(45);
    }

    // Datos de transacción según método de pago
    const metodoPago = i % 2 === 0 ? 'TARJETA' : 'TRANSFERENCIA';
    let datosTransaccion;

    if (metodoPago === 'TARJETA') {
      datosTransaccion = {
        metodoPago: 'TARJETA',
        referencia: `TRX-D-${600000 + i}`,
        datosTarjeta: {
          ultimos4: `${5000 + i}`,
          marca: i % 2 === 0 ? 'VISA' : 'MASTERCARD',
        },
        fechaTransaccion: getPastDate(60),
      };
    } else {
      datosTransaccion = {
        metodoPago: 'TRANSFERENCIA',
        referencia: `TR-D-${700000 + i}`,
        datosTransferencia: {
          banco: 'Banco Santander',
          numeroOperacion: `${800000 + i}`,
        },
        fechaTransaccion: getPastDate(60),
      };
    }

    pagos.push({
      usuarioId: usuarios.rows[usuarioIndex].id,
      suscripcionId: null,
      solicitudDerivacionId: solicitudId,
      tipo: 'DERIVACION',
      monto: monto,
      estado: estado,
      datosTransaccion: datosTransaccion,
      notasReembolso: null,
      metadatos: {
        plataforma: 'web',
        ipCliente: `192.168.1.${i + 10}`,
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
      },
      fechaCompletado: fechaCompletado,
      fechaReembolso: null,
    });
  }

  // Insertar los pagos
  for (const pago of pagos) {
    const query = `
      INSERT INTO pagos 
      ("usuarioId", "suscripcionId", "solicitudDerivacionId", tipo, monto, estado, "datosTransaccion", "notasReembolso", metadatos, "fechaCompletado", "fechaReembolso", "createdAt", "updatedAt") 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
    `;

    const values = [
      pago.usuarioId,
      pago.suscripcionId,
      pago.solicitudDerivacionId,
      pago.tipo,
      pago.monto,
      pago.estado,
      pago.datosTransaccion,
      pago.notasReembolso,
      pago.metadatos,
      pago.fechaCompletado,
      pago.fechaReembolso,
    ];

    await executeQuery(query, values);
  }

  console.log('Tabla de pagos poblada exitosamente con 10 pagos.');
}

// Función para poblar tabla de solicitudes de derivación
async function populateSolicitudesDerivacion() {
  console.log('Poblando tabla de solicitudes de derivación...');

  // Comprobar si ya existen solicitudes de derivación
  const existingSolicitudes = await executeQuery(
    'SELECT COUNT(*) FROM solicitudes_derivacion',
  );

  if (parseInt(existingSolicitudes.rows[0].count) > 0) {
    console.log(
      'La tabla de solicitudes de derivación ya tiene datos. Omitiendo inserción.',
    );
    return;
  }

  // Obtener IDs de psicólogos
  const psicologos = await executeQuery(
    'SELECT id FROM users WHERE role = $1',
    ['PSICOLOGO'],
  );

  if (psicologos.rows.length < 2) {
    console.log(
      'No se encontraron suficientes psicólogos para crear solicitudes de derivación. Omitiendo inserción.',
    );
    return;
  }
  // Obtener IDs de pacientes (usuarios con role PACIENTE)
  const pacientes = await executeQuery('SELECT id FROM users WHERE role = $1', [
    'PACIENTE',
  ]);

  if (pacientes.rows.length === 0) {
    console.log(
      'No se encontraron pacientes (usuarios con role PACIENTE) para crear solicitudes de derivación. Omitiendo inserción.',
    );
    return;
  }

  // Obtener IDs de perfiles de derivación
  const perfiles = await executeQuery(
    'SELECT id, "tarifaHora" FROM perfiles_derivacion WHERE aprobado = true',
  );

  if (perfiles.rows.length === 0) {
    console.log(
      'No se encontraron perfiles de derivación aprobados. Omitiendo inserción.',
    );
    return;
  }

  // Función para generar fechas aleatorias en el pasado (entre 1 y maxDays días)
  function getPastDate(maxDays = 60) {
    const now = new Date();
    const pastDate = new Date(now);
    pastDate.setDate(now.getDate() - Math.floor(Math.random() * maxDays) - 1);
    return pastDate;
  }

  // Función para generar fechas aleatorias en el futuro (entre 1 y maxDays días)
  function getFutureDate(maxDays = 30) {
    const now = new Date();
    const futureDate = new Date(now);
    futureDate.setDate(now.getDate() + Math.floor(Math.random() * maxDays) + 1);
    return futureDate;
  }

  // Array de motivos de derivación
  const motivosDerivacion = [
    'Necesidad de enfoque terapéutico especializado en trastornos de ansiedad',
    'Cambio de domicilio del paciente a otra ciudad',
    'Requerimiento de atención especializada en terapia infantil',
    'El paciente necesita un enfoque diferente al utilizado actualmente',
    'Especialización en terapia de parejas que no puedo proporcionar',
    'Problemas de agenda que no me permiten seguir atendiendo al paciente',
    'El paciente requiere un enfoque en psicología laboral',
    'Derivación por potencial conflicto de interés',
    'El paciente requiere atención en su idioma nativo',
    'Necesidad de terapia familiar sistémica',
  ];

  // Array de solicitudes de derivación a insertar
  const solicitudes = [];

  // Crear 10 solicitudes con diferentes estados
  for (let i = 0; i < 10; i++) {
    const pacienteIndex = i % pacientes.rows.length;
    const psicologoOrigenIndex = i % psicologos.rows.length;
    const perfilIndex = (i + 1) % perfiles.rows.length; // Asegurar que sean diferentes

    let estado;
    let fechaPrimeraSesion = null;
    let montoPrimeraSesion = null;
    // let datosPago = null; // Columna no existe en la tabla
    let notasRechazoValor = null; // Renombrado para evitar confusión con el nombre de la columna

    // Asignar diferentes estados a las solicitudes
    if (i < 2) {
      estado = 'PENDIENTE';
    } else if (i < 4) {
      estado = 'ACEPTADA';
      fechaPrimeraSesion = getFutureDate();
      montoPrimeraSesion = parseFloat(perfiles.rows[perfilIndex].tarifaHora);
    } else if (i < 6) {
      estado = 'PAGADA'; // Asumiendo que PAGADA es un estado válido
      fechaPrimeraSesion = getPastDate(10); // Fecha pasada para simular pago
      montoPrimeraSesion = parseFloat(perfiles.rows[perfilIndex].tarifaHora);
      // datosPago = { metodo: 'TRANSFERENCIA', referencia: `PAGO-DER-${1000 + i}` }; // Comentado
    } else if (i < 8) {
      estado = 'RECHAZADA';
      notasRechazoValor =
        'El psicólogo de destino no tiene disponibilidad en los horarios solicitados por el paciente.';
    } else {
      estado = 'CANCELADA';
      notasRechazoValor =
        'El paciente decidió continuar con su psicólogo actual.';
    }

    solicitudes.push({
      pacienteId: pacientes.rows[pacienteIndex].id,
      psicologoId: psicologos.rows[psicologoOrigenIndex].id,
      perfilDerivacionId: perfiles.rows[perfilIndex].id,
      motivo: motivosDerivacion[i % motivosDerivacion.length], // Cambiado de motivoDerivacion
      // Cambiado de notasAdicionales
      informacionAdicional:
        'Se adjunta resumen de historia clínica con autorización del paciente.',
      estado: estado,
      fechaPrimeraSesion: fechaPrimeraSesion,
      montoPrimeraSesion: montoPrimeraSesion,
      // datosPago: datosPago, // Eliminada esta línea
      notasRechazo: notasRechazoValor, // Cambiado de motivoRechazo y usando la variable renombrada
    });
  }

  // Insertar las solicitudes de derivación
  for (const solicitud of solicitudes) {
    const query = `
      INSERT INTO solicitudes_derivacion
      ("pacienteId", "psicologoId", "perfilDerivacionId", motivo, "informacionAdicional", estado, "fechaPrimeraSesion", "montoPrimeraSesion", "notasRechazo")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `; // Corregidos nombres de columna, eliminados datosPago, createdAt, updatedAt (usarán DEFAULT)

    const values = [
      solicitud.pacienteId,
      solicitud.psicologoId,
      solicitud.perfilDerivacionId,
      solicitud.motivo, // Cambiado de solicitud.motivoDerivacion
      solicitud.informacionAdicional, // Cambiado de solicitud.notasAdicionales
      solicitud.estado,
      solicitud.fechaPrimeraSesion,
      solicitud.montoPrimeraSesion,
      solicitud.notasRechazo, // Cambiado de solicitud.motivoRechazo
      // Se eliminan los NOW() para createdAt y updatedAt, la DB los gestionará con DEFAULT
    ];

    await executeQuery(query, values);
  }

  console.log(
    'Tabla de solicitudes de derivación poblada exitosamente con 10 solicitudes.',
  );
}

// Función para poblar tabla de suscripciones
async function populateSuscripciones() {
  console.log('Poblando tabla de suscripciones...');

  // Comprobar si ya existen suscripciones
  const existingSuscripciones = await executeQuery(
    'SELECT COUNT(*) FROM suscripciones',
  );

  if (parseInt(existingSuscripciones.rows[0].count) > 0) {
    console.log(
      'La tabla de suscripciones ya tiene datos. Omitiendo inserción.',
    );
    return;
  }

  // Obtener IDs de psicólogos
  const psicologos = await executeQuery(
    'SELECT id FROM users WHERE role = $1',
    ['PSICOLOGO'],
  );

  if (psicologos.rows.length === 0) {
    console.log(
      'No se encontraron psicólogos para crear suscripciones. Omitiendo inserción.',
    );
    return;
  }

  // Obtener IDs de planes
  const planes = await executeQuery(
    'SELECT id, precio, "duracionMeses" FROM planes WHERE activo = true',
  );

  if (planes.rows.length === 0) {
    console.log(
      'No se encontraron planes activos para crear suscripciones. Omitiendo inserción.',
    );
    return;
  }

  // Función para generar fechas de inicio aleatorias en el pasado (entre 1 y maxDays días)
  function getPastDate(maxDays = 180) {
    const now = new Date();
    const pastDate = new Date(now);
    pastDate.setDate(now.getDate() - Math.floor(Math.random() * maxDays) - 1);
    return pastDate;
  }

  // Función para calcular fecha de fin basada en fecha de inicio y duración en meses
  function getFechaFin(fechaInicio, duracionMeses) {
    const fechaFin = new Date(fechaInicio);
    fechaFin.setMonth(fechaFin.getMonth() + duracionMeses);
    return fechaFin;
  }

  // Array de estados posibles para las suscripciones
  const estados = ['ACTIVA', 'PENDIENTE_PAGO', 'CANCELADA', 'VENCIDA'];

  // Array de suscripciones a insertar
  const suscripciones = [];

  // Crear 10 suscripciones para diferentes psicólogos y planes
  for (let i = 0; i < 10; i++) {
    const psicologoIndex = i % psicologos.rows.length;
    const planIndex = i % planes.rows.length;
    const fechaInicio = getPastDate();
    const duracionMeses = parseInt(planes.rows[planIndex].duracionMeses);
    const fechaFin = getFechaFin(fechaInicio, duracionMeses);

    // Determinar estado basado en fechas
    let estado;
    const now = new Date();

    if (i === 0) {
      // Primera suscripción pendiente de pago
      estado = 'PENDIENTE_PAGO';
    } else if (i === 1) {
      // Segunda suscripción cancelada
      estado = 'CANCELADA';
    } else if (fechaFin < now) {
      // Si la fecha de fin es pasada, está vencida
      estado = 'VENCIDA';
    } else {
      // Si la fecha de fin es futura, está activa
      estado = 'ACTIVA';
    }

    const datosPago =
      estado === 'ACTIVA' || estado === 'VENCIDA'
        ? {
            metodoPago: i % 2 === 0 ? 'TARJETA' : 'TRANSFERENCIA',
            fechaPago: fechaInicio,
            referenciaPago: `REF-${100000 + i}`,
            monto: parseFloat(planes.rows[planIndex].precio),
          }
        : null;

    suscripciones.push({
      psicologoId: psicologos.rows[psicologoIndex].id,
      planId: planes.rows[planIndex].id,
      fechaInicio: fechaInicio,
      fechaFin: fechaFin,
      estado: estado,
      precioTotal: parseFloat(planes.rows[planIndex].precio),
      datosPago: datosPago,
      notasCancelacion:
        estado === 'CANCELADA' ? 'Cancelada por solicitud del usuario.' : null,
    });
  }

  // Insertar las suscripciones
  for (const suscripcion of suscripciones) {
    const query = `
      INSERT INTO suscripciones 
      ("psicologoId", "planId", "fechaInicio", "fechaFin", estado, "precioTotal", "datosPago", "notasCancelacion", "createdAt", "updatedAt") 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
    `;

    const values = [
      suscripcion.psicologoId,
      suscripcion.planId,
      suscripcion.fechaInicio,
      suscripcion.fechaFin,
      suscripcion.estado,
      suscripcion.precioTotal,
      suscripcion.datosPago,
      suscripcion.notasCancelacion,
    ];

    await executeQuery(query, values);
  }

  console.log(
    'Tabla de suscripciones poblada exitosamente con 10 suscripciones.',
  );
}

// Función para poblar tabla de fichas de sesión
async function populateFichasSesion() {
  console.log('Poblando tabla de fichas de sesión...');

  // Comprobar si ya existen fichas de sesión
  const existingFichas = await executeQuery(
    'SELECT COUNT(*) FROM fichas_sesion',
  );

  if (parseInt(existingFichas.rows[0].count) > 0) {
    console.log(
      'La tabla de fichas de sesión ya tiene datos. Omitiendo inserción.',
    );
    return;
  }

  // Obtener IDs de pacientes
  const pacientes = await executeQuery(
    'SELECT id FROM pacientes WHERE estado = $1',
    ['ACTIVO'],
  );

  if (pacientes.rows.length === 0) {
    console.log(
      'No hay pacientes activos para crear fichas de sesión. Omitiendo.',
    );
    return;
  }

  // Obtener IDs de psicólogos
  const psicologos = await executeQuery(
    'SELECT id FROM users WHERE role = $1',
    ['PSICOLOGO'],
  );

  if (psicologos.rows.length === 0) {
    console.log('No hay psicólogos para crear fichas de sesión. Omitiendo.');
    return;
  }

  // Obtener IDs de reservas (opcional, para vincular)
  const reservas = await executeQuery(
    'SELECT id, "fechaInicio" FROM reservas WHERE estado = $1 ORDER BY "fechaInicio" DESC LIMIT 20',
    ['CONFIRMADA'],
  );

  function getPastDate(maxDays = 180) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * maxDays) - 1);
    return date.toISOString().split('T')[0];
  }

  const motivos = [
    'Ansiedad generalizada',
    'Depresión',
    'Problemas de pareja',
    'Estrés laboral',
    'Duelo',
    'Crisis de pánico',
    'Problemas familiares',
    'Baja autoestima',
    'Dificultades en relaciones interpersonales',
    'Trastornos del sueño',
  ];

  const observaciones = [
    'Paciente muestra avances significativos en el manejo de la ansiedad. Se mantiene plan terapéutico.',
    'Se observa estado de ánimo deprimido. Se sugiere evaluación psiquiátrica complementaria.',
    'Avances en técnicas de comunicación. Paciente aplica herramientas entregadas en sesiones anteriores.',
    'Persisten síntomas de estrés. Se refuerzan técnicas de relajación y mindfulness.',
    'Paciente ha superado fase inicial del duelo. Se trabaja en aceptación.',
    'Disminución en frecuencia e intensidad de ataques de pánico. Se continúa con exposición gradual.',
    'Mejora en dinámica familiar después de implementar pautas de comunicación.',
    'Se trabaja en ejercicios para fortalecer autoestima y autoimagen positiva.',
    'Dificultades para establecer límites en relaciones personales. Se abordan patrones de dependencia.',
    'Mejoría en calidad del sueño tras implementar higiene del sueño.',
  ];

  const tareas = [
    'Practicar técnicas de respiración diafragmática dos veces al día.',
    'Llevar un registro diario de pensamientos automáticos y emociones asociadas.',
    'Realizar actividad física moderada (caminata de 30 minutos) tres veces por semana.',
    'Establecer un horario regular de sueño, acostándose y levantándose a la misma hora.',
    'Leer el capítulo asignado sobre comunicación asertiva y anotar reflexiones.',
    'Practicar un ejercicio de mindfulness de 10 minutos diariamente.',
    'Escribir una carta de despedida como parte del proceso de duelo.',
    'Identificar tres logros personales de la semana y reflexionar sobre ellos.',
    'Realizar una actividad placentera que haya sido postergada.',
    'Poner en práctica una nueva habilidad social en una interacción cotidiana.',
  ];

  const fichas = [];
  const numFichas = Math.min(pacientes.rows.length, psicologos.rows.length, 10);

  for (let i = 0; i < numFichas; i++) {
    const paciente = pacientes.rows[i % pacientes.rows.length];
    const psicologo = psicologos.rows[i % psicologos.rows.length];
    const reserva = reservas.rows.length > i ? reservas.rows[i] : null;

    let fechaFicha;
    if (reserva && new Date(reserva.fechaInicio) < new Date()) {
      fechaFicha = new Date(reserva.fechaInicio).toISOString().split('T')[0];
    } else {
      fechaFicha = getPastDate(Math.floor(Math.random() * 90) + 1);
    }

    fichas.push({
      fecha: fechaFicha,
      duracion: 60,
      motivoConsulta: motivos[i % motivos.length],
      contenidoSesion: `Contenido de la sesión para el paciente ${paciente.id.substring(0, 8)}. Se abordó ${motivos[i % motivos.length]}.`,
      observaciones: observaciones[i % observaciones.length],
      tareas:
        tareas.length > 0
          ? tareas[i % tareas.length]
          : 'Revisar material entregado y practicar ejercicios de respiración.',
      psicologoId: psicologo.id,
      pacienteId: paciente.id,
      reservaId: reserva ? reserva.id : null,
      estado: 'COMPLETA',
    });
  }

  for (const ficha of fichas) {
    const insertQuery = `
      INSERT INTO fichas_sesion (
        fecha, duracion, "motivoConsulta", "contenidoSesion", 
        observaciones, tareas, "psicologoId", "pacienteId", "reservaId", 
        estado, "fechaCreacion", "fechaActualizacion"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW()
      ) RETURNING id;
    `;
    await executeQuery(insertQuery, [
      ficha.fecha,
      ficha.duracion,
      ficha.motivoConsulta,
      ficha.contenidoSesion,
      ficha.observaciones,
      ficha.tareas,
      ficha.psicologoId,
      ficha.pacienteId,
      ficha.reservaId,
      ficha.estado,
    ]);
  }

  console.log(
    `Tabla de fichas de sesión poblada exitosamente con ${fichas.length} fichas.`,
  );
}

// Función para poblar tabla de reservas
async function populateReservas() {
  console.log('Poblando tabla de reservas...');

  // Comprobar si ya existen reservas
  const existingReservas = await executeQuery('SELECT COUNT(*) FROM reservas');

  if (parseInt(existingReservas.rows[0].count) > 0) {
    console.log('La tabla de reservas ya tiene datos. Omitiendo inserción.');
    return;
  }

  // Obtener IDs de boxes
  const boxes = await executeQuery(
    'SELECT id, "precioHora", "precioJornada" FROM boxes WHERE activo = true',
  );

  if (boxes.rows.length === 0) {
    console.log(
      'No se encontraron boxes activos para crear reservas. Omitiendo inserción.',
    );
    return;
  }

  // Obtener IDs de psicólogos
  const psicologos = await executeQuery(
    'SELECT id FROM users WHERE role = $1 AND estado = $2',
    ['PSICOLOGO', 'ACTIVO'],
  );

  if (psicologos.rows.length === 0) {
    console.log(
      'No se encontraron psicólogos activos para crear reservas. Omitiendo inserción.',
    );
    return;
  }

  // Función para generar fechas aleatorias en el futuro (entre 1 y maxDays días)
  function getFutureDate(maxDays = 30) {
    const now = new Date();
    const futureDate = new Date(now);
    futureDate.setDate(now.getDate() + Math.floor(Math.random() * maxDays) + 1);
    return futureDate;
  }

  // Función para generar fechas pasadas aleatorias (entre 1 y maxDays días atrás)
  function getPastDate(maxDays = 30) {
    const now = new Date();
    const pastDate = new Date(now);
    pastDate.setDate(now.getDate() - Math.floor(Math.random() * maxDays) - 1);
    return pastDate;
  }

  // Función para agregar horas a una fecha
  function addHours(date, hours) {
    const newDate = new Date(date);
    newDate.setHours(newDate.getHours() + hours);
    return newDate;
  }

  // Array de reservas a insertar
  const reservas = [];

  // Crear 10 reservas con diferentes estados y fechas
  // 4 reservas futuras confirmadas
  for (let i = 0; i < 4; i++) {
    const boxIndex = Math.floor(Math.random() * boxes.rows.length);
    const psicologoIndex = Math.floor(Math.random() * psicologos.rows.length);
    const startDate = getFutureDate();
    const tipo = Math.random() > 0.3 ? 'HORA' : 'JORNADA';
    const duracion = tipo === 'HORA' ? 1 : 8;

    reservas.push({
      boxId: boxes.rows[boxIndex].id,
      psicologoId: psicologos.rows[psicologoIndex].id,
      fechaInicio: startDate,
      fechaFin: addHours(startDate, duracion),
      tipo: tipo,
      estado: 'CONFIRMADA',
      precio:
        tipo === 'HORA'
          ? parseFloat(boxes.rows[boxIndex].precioHora)
          : parseFloat(boxes.rows[boxIndex].precioJornada),
    });
  }

  // 3 reservas futuras pendientes
  for (let i = 0; i < 3; i++) {
    const boxIndex = Math.floor(Math.random() * boxes.rows.length);
    const psicologoIndex = Math.floor(Math.random() * psicologos.rows.length);
    const startDate = getFutureDate();
    const tipo = 'HORA';

    reservas.push({
      boxId: boxes.rows[boxIndex].id,
      psicologoId: psicologos.rows[psicologoIndex].id,
      fechaInicio: startDate,
      fechaFin: addHours(startDate, 1),
      tipo: tipo,
      estado: 'PENDIENTE',
      precio: parseFloat(boxes.rows[boxIndex].precioHora),
    });
  }

  // 2 reservas pasadas confirmadas
  for (let i = 0; i < 2; i++) {
    const boxIndex = Math.floor(Math.random() * boxes.rows.length);
    const psicologoIndex = Math.floor(Math.random() * psicologos.rows.length);
    const startDate = getPastDate();
    const tipo = 'HORA';

    reservas.push({
      boxId: boxes.rows[boxIndex].id,
      psicologoId: psicologos.rows[psicologoIndex].id,
      fechaInicio: startDate,
      fechaFin: addHours(startDate, 1),
      tipo: tipo,
      estado: 'CONFIRMADA',
      precio: parseFloat(boxes.rows[boxIndex].precioHora),
    });
  }

  // 1 reserva cancelada
  const boxIndex = Math.floor(Math.random() * boxes.rows.length);
  const psicologoIndex = Math.floor(Math.random() * psicologos.rows.length);
  const startDate = getFutureDate(7);

  reservas.push({
    boxId: boxes.rows[boxIndex].id,
    psicologoId: psicologos.rows[psicologoIndex].id,
    fechaInicio: startDate,
    fechaFin: addHours(startDate, 1),
    tipo: 'HORA',
    estado: 'CANCELADA',
    precio: parseFloat(boxes.rows[boxIndex].precioHora),
    notasCancelacion: 'Cancelada por imprevisto del psicólogo.',
  });

  // Insertar las reservas
  for (const reserva of reservas) {
    const query = `
      INSERT INTO reservas 
      ("boxId", "psicologoId", "fechaInicio", "fechaFin", tipo, estado, precio, "notasCancelacion", "createdAt", "updatedAt") 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
    `;

    const values = [
      reserva.boxId,
      reserva.psicologoId,
      reserva.fechaInicio,
      reserva.fechaFin,
      reserva.tipo,
      reserva.estado,
      reserva.precio,
      reserva.notasCancelacion || null,
    ];

    await executeQuery(query, values);
  }

  console.log('Tabla de reservas poblada exitosamente con 10 reservas.');
}

// Función para poblar tabla de pacientes
async function populatePacientes() {
  console.log('Poblando tabla de pacientes...');

  // Comprobar si ya existen pacientes
  const existingPacientes = await executeQuery(
    'SELECT COUNT(*) FROM pacientes',
  );

  if (parseInt(existingPacientes.rows[0].count) > 0) {
    console.log('La tabla de pacientes ya tiene datos. Omitiendo inserción.');
    return;
  }

  // Obtener IDs de psicólogos
  const psicologos = await executeQuery(
    'SELECT id, email FROM users WHERE role = $1',
    ['PSICOLOGO'],
  );

  if (psicologos.rows.length === 0) {
    console.log(
      'No se encontraron psicólogos para asociar a los pacientes. Omitiendo inserción.',
    );
    return;
  }

  // Array de pacientes a insertar
  const pacientes = [
    {
      psicologo: psicologos.rows[0].id,
      nombre: 'Roberto',
      apellido: 'Gómez',
      email: 'roberto.gomez@mail.com',
      telefono: '+56912345678',
      fechaNacimiento: '1985-06-15',
      estado: 'ACTIVO',
      notas: 'Paciente con ansiedad social. Asiste a terapia semanalmente.',
    },
    {
      psicologo: psicologos.rows[0].id,
      nombre: 'Claudia',
      apellido: 'Fernández',
      email: 'claudia.fernandez@mail.com',
      telefono: '+56923456789',
      fechaNacimiento: '1990-03-22',
      estado: 'ACTIVO',
      notas:
        'Paciente con depresión moderada. En tratamiento farmacológico complementario.',
    },
    {
      psicologo: psicologos.rows[1].id,
      nombre: 'Matías',
      apellido: 'Silva',
      email: 'matias.silva@mail.com',
      telefono: '+56934567890',
      fechaNacimiento: '2010-11-08',
      estado: 'ACTIVO',
      notas: 'Niño con dificultades de aprendizaje. Derivado por el colegio.',
    },
    {
      psicologo: psicologos.rows[1].id,
      nombre: 'Valentina',
      apellido: 'Pérez',
      email: 'valentina.perez@mail.com',
      telefono: '+56945678901',
      fechaNacimiento: '2012-04-30',
      estado: 'ACTIVO',
      notas: 'Niña con TDAH. En tratamiento multidisciplinario.',
    },
    {
      psicologo: psicologos.rows[2].id,
      nombre: 'Javier',
      apellido: 'Muñoz',
      email: 'javier.munoz@empresa.com',
      telefono: '+56956789012',
      fechaNacimiento: '1982-09-17',
      estado: 'ACTIVO',
      notas: 'Ejecutivo con estrés laboral y problemas de sueño.',
    },
    {
      psicologo: psicologos.rows[2].id,
      nombre: 'Carolina',
      apellido: 'Vega',
      email: 'carolina.vega@empresa.com',
      telefono: '+56967890123',
      fechaNacimiento: '1984-12-03',
      estado: 'ACTIVO',
      notas:
        'Gerente con síndrome de burnout. Necesita herramientas de gestión del estrés.',
    },
    {
      psicologo: psicologos.rows[3].id,
      nombre: 'Felipe',
      apellido: 'Rojas',
      email: 'felipe.rojas@mail.com',
      telefono: '+56978901234',
      fechaNacimiento: '1975-08-20',
      estado: 'ACTIVO',
      notas: 'En terapia de pareja junto con su esposa.',
    },
    {
      psicologo: psicologos.rows[3].id,
      nombre: 'Gabriela',
      apellido: 'Soto',
      email: 'gabriela.soto@mail.com',
      telefono: '+56989012345',
      fechaNacimiento: '1978-01-15',
      estado: 'ACTIVO',
      notas: 'En terapia de pareja junto con su esposo.',
    },
    {
      psicologo: psicologos.rows[0].id,
      nombre: 'Andrés',
      apellido: 'Pinto',
      email: 'andres.pinto@mail.com',
      telefono: '+56990123456',
      fechaNacimiento: '1970-07-05',
      estado: 'INACTIVO',
      notas: 'Paciente que completó su tratamiento por duelo.',
    },
    {
      psicologo: psicologos.rows[4].id,
      nombre: 'Marcela',
      apellido: 'Contreras',
      email: 'marcela.contreras@mail.com',
      telefono: '+56901234567',
      fechaNacimiento: '1988-05-27',
      estado: 'DERIVADO',
      notas: 'Paciente derivada a psiquiatra por cuadro depresivo severo.',
    },
  ];

  // Insertar los pacientes
  for (const paciente of pacientes) {
    const query = `
      INSERT INTO pacientes 
      ("psicologoId", nombre, apellido, email, telefono, "fechaNacimiento", estado, notas, "createdAt", "updatedAt") 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
    `;

    const values = [
      paciente.psicologo,
      paciente.nombre,
      paciente.apellido,
      paciente.email,
      paciente.telefono,
      paciente.fechaNacimiento,
      paciente.estado,
      paciente.notas,
    ];

    await executeQuery(query, values);
  }

  console.log('Tabla de pacientes poblada exitosamente con 10 pacientes.');
}

// Función para poblar tabla de perfiles de derivación
async function populatePerfilesDerivacion() {
  console.log('Poblando tabla de perfiles de derivación...');

  // Comprobar si ya existen perfiles de derivación
  const existingPerfiles = await executeQuery(
    'SELECT COUNT(*) FROM perfiles_derivacion',
  );

  if (parseInt(existingPerfiles.rows[0].count) > 0) {
    console.log(
      'La tabla de perfiles de derivación ya tiene datos. Omitiendo inserción.',
    );
    return;
  }

  // Obtener IDs de psicólogos
  const psicologos = await executeQuery(
    'SELECT id, email FROM users WHERE role = $1',
    ['PSICOLOGO'],
  );
  const psicologosMap = {};

  psicologos.rows.forEach((psicologo) => {
    psicologosMap[psicologo.email] = psicologo.id;
  });

  // Array de perfiles de derivación a insertar
  const perfiles = [
    {
      psicologo: 'psicologo1@psicoespacios.com',
      especialidades: ['Clínica', 'Adulto Mayor', 'Parejas'],
      modalidades: ['Presencial', 'Online'],
      descripcion:
        'Psicólogo clínico con 15 años de experiencia en terapia de parejas y adultos mayores',
      experiencia:
        'Especialista en terapia cognitivo-conductual con amplia experiencia en el tratamiento de ansiedad y depresión',
      horariosAtencion: [
        { dia: 'Lunes', horaInicio: '09:00', horaFin: '18:00' },
        { dia: 'Martes', horaInicio: '09:00', horaFin: '18:00' },
        { dia: 'Miércoles', horaInicio: '09:00', horaFin: '18:00' },
        { dia: 'Jueves', horaInicio: '09:00', horaFin: '18:00' },
      ],
      sedesAtencion: ['Sede Central', 'Sede Las Condes'],
      tarifaHora: 35000,
      aprobado: true,
    },
    {
      psicologo: 'psicologo2@psicoespacios.com',
      especialidades: ['Infantil', 'Educacional'],
      modalidades: ['Presencial', 'Online', 'Mixta'],
      descripcion:
        'Psicóloga especializada en atención infantil y problemas de aprendizaje',
      experiencia:
        'Más de 10 años trabajando con niños y adolescentes con dificultades de aprendizaje, TDAH y trastornos del desarrollo',
      horariosAtencion: [
        { dia: 'Lunes', horaInicio: '14:00', horaFin: '20:00' },
        { dia: 'Miércoles', horaInicio: '14:00', horaFin: '20:00' },
        { dia: 'Viernes', horaInicio: '14:00', horaFin: '20:00' },
      ],
      sedesAtencion: ['Sede Central', 'Sede Ñuñoa'],
      tarifaHora: 30000,
      aprobado: true,
    },
    {
      psicologo: 'psicologo3@psicoespacios.com',
      especialidades: ['Laboral', 'Clínica'],
      modalidades: ['Presencial', 'Online'],
      descripcion:
        'Psicólogo organizacional y clínico, especialista en estrés laboral y burnout',
      experiencia:
        'Experiencia en consultoría organizacional y atención clínica con enfoque en estrés laboral, síndrome de burnout y clima organizacional',
      horariosAtencion: [
        { dia: 'Martes', horaInicio: '10:00', horaFin: '19:00' },
        { dia: 'Jueves', horaInicio: '10:00', horaFin: '19:00' },
        { dia: 'Sábado', horaInicio: '10:00', horaFin: '14:00' },
      ],
      sedesAtencion: ['Sede Las Condes', 'Sede Viña del Mar'],
      tarifaHora: 40000,
      aprobado: true,
    },
    {
      psicologo: 'psicologo4@psicoespacios.com',
      especialidades: ['Familiar', 'Parejas'],
      modalidades: ['Presencial'],
      descripcion:
        'Psicóloga familiar sistémica, especialista en relaciones de pareja y familia',
      experiencia:
        'Formación en terapia sistémica familiar con enfoque en resolución de conflictos y mejora de la comunicación en parejas y familias',
      horariosAtencion: [
        { dia: 'Lunes', horaInicio: '12:00', horaFin: '20:00' },
        { dia: 'Miércoles', horaInicio: '12:00', horaFin: '20:00' },
        { dia: 'Viernes', horaInicio: '09:00', horaFin: '14:00' },
      ],
      sedesAtencion: ['Sede Ñuñoa', 'Sede Concepción'],
      tarifaHora: 35000,
      aprobado: true,
    },
    {
      psicologo: 'psicologo5@psicoespacios.com',
      especialidades: ['Forense', 'Clínica'],
      modalidades: ['Presencial', 'Online'],
      descripcion:
        'Psicólogo forense con experiencia en evaluación psicológica pericial',
      experiencia:
        'Especialista en evaluación psicológica forense, elaboración de informes periciales y testimonio experto en tribunales',
      horariosAtencion: [
        { dia: 'Martes', horaInicio: '09:00', horaFin: '17:00' },
        { dia: 'Jueves', horaInicio: '09:00', horaFin: '17:00' },
      ],
      sedesAtencion: ['Sede Central'],
      tarifaHora: 45000,
      aprobado: false,
    },
  ];

  // Insertar los perfiles de derivación
  for (const perfil of perfiles) {
    const psicologoId = psicologosMap[perfil.psicologo];

    if (!psicologoId) {
      console.log(
        `Psicólogo "${perfil.psicologo}" no encontrado. Omitiendo perfil.`,
      );
      continue;
    }

    const query = `
      INSERT INTO perfiles_derivacion 
      ("psicologoId", especialidades, modalidades, descripcion, experiencia, "horariosAtencion", "sedesAtencion", "tarifaHora", aprobado, "createdAt", "updatedAt") 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
    `;

    const values = [
      psicologoId,
      perfil.especialidades,
      perfil.modalidades,
      perfil.descripcion,
      perfil.experiencia,
      JSON.stringify(perfil.horariosAtencion),
      perfil.sedesAtencion,
      perfil.tarifaHora,
      perfil.aprobado,
    ];

    await executeQuery(query, values);
  }

  console.log(
    'Tabla de perfiles de derivación poblada exitosamente con 5 perfiles.',
  );
}

// Función para poblar tabla de planes
async function populatePlanes() {
  console.log('Poblando tabla de planes...');

  // Comprobar si ya existen planes
  const existingPlanes = await executeQuery('SELECT COUNT(*) FROM planes');

  if (parseInt(existingPlanes.rows[0].count) > 0) {
    console.log('La tabla de planes ya tiene datos. Omitiendo inserción.');
    return;
  }

  // Array de planes a insertar
  const planes = [
    {
      tipo: 'BASICO',
      nombre: 'Plan Básico',
      descripcion:
        'Plan inicial para psicólogos que están comenzando a utilizar la plataforma',
      precio: 15000,
      duracionMeses: 1,
      caracteristicas: [
        {
          nombre: 'Reservas de boxes',
          descripcion: 'Hasta 10 reservas mensuales',
          incluido: true,
        },
        {
          nombre: 'Fichas clínicas',
          descripcion: 'Sistema básico de fichas',
          incluido: true,
        },
        {
          nombre: 'Derivaciones',
          descripcion: 'Hasta 2 derivaciones mensuales',
          incluido: true,
        },
        { nombre: 'Reportes', descripcion: 'Reportes básicos', incluido: true },
        { nombre: 'Soporte', descripcion: 'Soporte por email', incluido: true },
        {
          nombre: 'Pacientes',
          descripcion: 'Hasta 20 pacientes',
          incluido: true,
        },
        {
          nombre: 'Descuentos en boxes',
          descripcion: 'Sin descuentos',
          incluido: false,
        },
        {
          nombre: 'Agenda premium',
          descripcion: 'Funciones avanzadas de agenda',
          incluido: false,
        },
        {
          nombre: 'Marketing',
          descripcion: 'Herramientas de marketing',
          incluido: false,
        },
      ],
      descuento: 0,
      activo: true,
    },
    {
      tipo: 'INTERMEDIO',
      nombre: 'Plan Profesional',
      descripcion: 'Plan ideal para psicólogos con práctica establecida',
      precio: 25000,
      duracionMeses: 1,
      caracteristicas: [
        {
          nombre: 'Reservas de boxes',
          descripcion: 'Hasta 25 reservas mensuales',
          incluido: true,
        },
        {
          nombre: 'Fichas clínicas',
          descripcion: 'Sistema completo de fichas',
          incluido: true,
        },
        {
          nombre: 'Derivaciones',
          descripcion: 'Hasta 5 derivaciones mensuales',
          incluido: true,
        },
        {
          nombre: 'Reportes',
          descripcion: 'Reportes avanzados',
          incluido: true,
        },
        {
          nombre: 'Soporte',
          descripcion: 'Soporte por email y teléfono',
          incluido: true,
        },
        {
          nombre: 'Pacientes',
          descripcion: 'Hasta 50 pacientes',
          incluido: true,
        },
        {
          nombre: 'Descuentos en boxes',
          descripcion: '10% de descuento',
          incluido: true,
        },
        {
          nombre: 'Agenda premium',
          descripcion: 'Funciones avanzadas de agenda',
          incluido: true,
        },
        {
          nombre: 'Marketing',
          descripcion: 'Herramientas de marketing',
          incluido: false,
        },
      ],
      descuento: 0,
      activo: true,
    },
    {
      tipo: 'PREMIUM',
      nombre: 'Plan Premium',
      descripcion: 'Plan completo para profesionales con alta demanda',
      precio: 40000,
      duracionMeses: 1,
      caracteristicas: [
        {
          nombre: 'Reservas de boxes',
          descripcion: 'Reservas ilimitadas',
          incluido: true,
        },
        {
          nombre: 'Fichas clínicas',
          descripcion: 'Sistema avanzado de fichas con análisis',
          incluido: true,
        },
        {
          nombre: 'Derivaciones',
          descripcion: 'Derivaciones ilimitadas',
          incluido: true,
        },
        {
          nombre: 'Reportes',
          descripcion: 'Reportes premium con análisis de datos',
          incluido: true,
        },
        {
          nombre: 'Soporte',
          descripcion: 'Soporte prioritario 24/7',
          incluido: true,
        },
        {
          nombre: 'Pacientes',
          descripcion: 'Pacientes ilimitados',
          incluido: true,
        },
        {
          nombre: 'Descuentos en boxes',
          descripcion: '20% de descuento',
          incluido: true,
        },
        {
          nombre: 'Agenda premium',
          descripcion: 'Funciones avanzadas de agenda',
          incluido: true,
        },
        {
          nombre: 'Marketing',
          descripcion: 'Herramientas completas de marketing',
          incluido: true,
        },
      ],
      descuento: 0,
      activo: true,
    },
    {
      tipo: 'BASICO',
      nombre: 'Plan Básico Trimestral',
      descripcion: 'Plan básico con duración de 3 meses',
      precio: 40500,
      duracionMeses: 3,
      caracteristicas: [
        {
          nombre: 'Reservas de boxes',
          descripcion: 'Hasta 10 reservas mensuales',
          incluido: true,
        },
        {
          nombre: 'Fichas clínicas',
          descripcion: 'Sistema básico de fichas',
          incluido: true,
        },
        {
          nombre: 'Derivaciones',
          descripcion: 'Hasta 2 derivaciones mensuales',
          incluido: true,
        },
        { nombre: 'Reportes', descripcion: 'Reportes básicos', incluido: true },
        { nombre: 'Soporte', descripcion: 'Soporte por email', incluido: true },
        {
          nombre: 'Pacientes',
          descripcion: 'Hasta 20 pacientes',
          incluido: true,
        },
        {
          nombre: 'Descuentos en boxes',
          descripcion: 'Sin descuentos',
          incluido: false,
        },
        {
          nombre: 'Agenda premium',
          descripcion: 'Funciones avanzadas de agenda',
          incluido: false,
        },
        {
          nombre: 'Marketing',
          descripcion: 'Herramientas de marketing',
          incluido: false,
        },
      ],
      descuento: 10,
      activo: true,
    },
    {
      tipo: 'INTERMEDIO',
      nombre: 'Plan Profesional Semestral',
      descripcion: 'Plan profesional con duración de 6 meses',
      precio: 135000,
      duracionMeses: 6,
      caracteristicas: [
        {
          nombre: 'Reservas de boxes',
          descripcion: 'Hasta 25 reservas mensuales',
          incluido: true,
        },
        {
          nombre: 'Fichas clínicas',
          descripcion: 'Sistema completo de fichas',
          incluido: true,
        },
        {
          nombre: 'Derivaciones',
          descripcion: 'Hasta 5 derivaciones mensuales',
          incluido: true,
        },
        {
          nombre: 'Reportes',
          descripcion: 'Reportes avanzados',
          incluido: true,
        },
        {
          nombre: 'Soporte',
          descripcion: 'Soporte por email y teléfono',
          incluido: true,
        },
        {
          nombre: 'Pacientes',
          descripcion: 'Hasta 50 pacientes',
          incluido: true,
        },
        {
          nombre: 'Descuentos en boxes',
          descripcion: '10% de descuento',
          incluido: true,
        },
        {
          nombre: 'Agenda premium',
          descripcion: 'Funciones avanzadas de agenda',
          incluido: true,
        },
        {
          nombre: 'Marketing',
          descripcion: 'Herramientas de marketing',
          incluido: false,
        },
      ],
      descuento: 10,
      activo: true,
    },
  ];

  // Insertar los planes
  for (const plan of planes) {
    const query = `
      INSERT INTO planes 
      (tipo, nombre, descripcion, precio, "duracionMeses", caracteristicas, descuento, activo, "createdAt", "updatedAt") 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
    `;

    const values = [
      plan.tipo,
      plan.nombre,
      plan.descripcion,
      plan.precio,
      plan.duracionMeses,
      JSON.stringify(plan.caracteristicas),
      plan.descuento,
      plan.activo,
    ];

    await executeQuery(query, values);
  }

  console.log('Tabla de planes poblada exitosamente con 5 planes.');
}

// Función para poblar tabla de boxes
async function populateBoxes() {
  console.log('Poblando tabla de boxes...');

  // Comprobar si ya existen boxes
  const existingBoxes = await executeQuery('SELECT COUNT(*) FROM boxes');

  if (parseInt(existingBoxes.rows[0].count) > 0) {
    console.log('La tabla de boxes ya tiene datos. Omitiendo inserción.');
    return;
  }

  // Obtener IDs de las sedes
  const sedes = await executeQuery('SELECT id, nombre FROM sedes');
  const sedesMap = {};

  sedes.rows.forEach((sede) => {
    sedesMap[sede.nombre] = sede.id;
  });

  // Array de boxes a insertar
  const boxes = [
    {
      numero: '101',
      piso: 1,
      descripcion: 'Box amplio e iluminado ideal para terapia individual',
      capacidad: 3,
      precioHora: 15000,
      precioJornada: 80000,
      equipamiento: [
        {
          nombre: 'Escritorio',
          cantidad: 1,
          descripcion: 'Escritorio de madera',
        },
        { nombre: 'Sillas', cantidad: 3, descripcion: 'Sillas ergonómicas' },
        { nombre: 'Pizarra', cantidad: 1, descripcion: 'Pizarra blanca' },
      ],
      dimensiones: { largo: 4, ancho: 3, alto: 2.5, unidad: 'metros' },
      activo: true,
      caracteristicas: [
        'Iluminación natural',
        'Aire acondicionado',
        'Insonorizado',
      ],
      sede: 'Sede Central',
    },
    {
      numero: '102',
      piso: 1,
      descripcion: 'Box para terapia de parejas o familias',
      capacidad: 5,
      precioHora: 18000,
      precioJornada: 100000,
      equipamiento: [
        {
          nombre: 'Escritorio',
          cantidad: 1,
          descripcion: 'Escritorio de madera',
        },
        { nombre: 'Sillas', cantidad: 5, descripcion: 'Sillas ergonómicas' },
        { nombre: 'Sofá', cantidad: 1, descripcion: 'Sofá de 3 cuerpos' },
      ],
      dimensiones: { largo: 5, ancho: 4, alto: 2.5, unidad: 'metros' },
      activo: true,
      caracteristicas: [
        'Iluminación natural',
        'Aire acondicionado',
        'Insonorizado',
        'Ambientación cálida',
      ],
      sede: 'Sede Central',
    },
    {
      numero: '201',
      piso: 2,
      descripcion: 'Box para terapia individual con vista a la ciudad',
      capacidad: 2,
      precioHora: 12000,
      precioJornada: 70000,
      equipamiento: [
        {
          nombre: 'Escritorio',
          cantidad: 1,
          descripcion: 'Escritorio minimalista',
        },
        { nombre: 'Sillas', cantidad: 2, descripcion: 'Sillas ergonómicas' },
      ],
      dimensiones: { largo: 3, ancho: 3, alto: 2.5, unidad: 'metros' },
      activo: true,
      caracteristicas: ['Iluminación natural', 'Insonorizado'],
      sede: 'Sede Central',
    },
    {
      numero: 'A1',
      piso: 1,
      descripcion: 'Box premium con equipamiento completo',
      capacidad: 4,
      precioHora: 25000,
      precioJornada: 140000,
      equipamiento: [
        {
          nombre: 'Escritorio',
          cantidad: 1,
          descripcion: 'Escritorio ejecutivo',
        },
        {
          nombre: 'Sillas',
          cantidad: 4,
          descripcion: 'Sillas premium ergonómicas',
        },
        { nombre: 'Smart TV', cantidad: 1, descripcion: 'TV 50 pulgadas' },
        { nombre: 'Cafetera', cantidad: 1, descripcion: 'Cafetera automática' },
      ],
      dimensiones: { largo: 6, ancho: 5, alto: 2.8, unidad: 'metros' },
      activo: true,
      caracteristicas: [
        'Iluminación natural',
        'Aire acondicionado',
        'Insonorizado',
        'Minibar',
        'Wi-Fi de alta velocidad',
      ],
      sede: 'Sede Las Condes',
    },
    {
      numero: 'A2',
      piso: 1,
      descripcion: 'Box para terapia infantil con área de juegos',
      capacidad: 4,
      precioHora: 22000,
      precioJornada: 120000,
      equipamiento: [
        {
          nombre: 'Escritorio',
          cantidad: 1,
          descripcion: 'Escritorio infantil',
        },
        { nombre: 'Sillas', cantidad: 4, descripcion: 'Sillas ajustables' },
        {
          nombre: 'Juguetes',
          cantidad: 10,
          descripcion: 'Set de juguetes terapéuticos',
        },
      ],
      dimensiones: { largo: 5, ancho: 5, alto: 2.8, unidad: 'metros' },
      activo: true,
      caracteristicas: [
        'Iluminación natural',
        'Aire acondicionado',
        'Insonorizado',
        'Área de juegos',
        'Colores estimulantes',
      ],
      sede: 'Sede Las Condes',
    },
    {
      numero: '301',
      piso: 3,
      descripcion: 'Box para terapia individual en ambiente íntimo',
      capacidad: 2,
      precioHora: 14000,
      precioJornada: 75000,
      equipamiento: [
        { nombre: 'Escritorio', cantidad: 1, descripcion: 'Escritorio simple' },
        { nombre: 'Sillas', cantidad: 2, descripcion: 'Sillas cómodas' },
      ],
      dimensiones: { largo: 3, ancho: 2.5, alto: 2.5, unidad: 'metros' },
      activo: true,
      caracteristicas: ['Insonorizado', 'Ambiente íntimo'],
      sede: 'Sede Ñuñoa',
    },
    {
      numero: '101',
      piso: 1,
      descripcion: 'Box con vista al mar',
      capacidad: 3,
      precioHora: 20000,
      precioJornada: 110000,
      equipamiento: [
        {
          nombre: 'Escritorio',
          cantidad: 1,
          descripcion: 'Escritorio de madera',
        },
        { nombre: 'Sillas', cantidad: 3, descripcion: 'Sillas ergonómicas' },
      ],
      dimensiones: { largo: 4, ancho: 3, alto: 2.5, unidad: 'metros' },
      activo: true,
      caracteristicas: [
        'Iluminación natural',
        'Vista al mar',
        'Aire acondicionado',
        'Insonorizado',
      ],
      sede: 'Sede Viña del Mar',
    },
    {
      numero: '201',
      piso: 2,
      descripcion: 'Box para terapia familiar con ambiente acogedor',
      capacidad: 6,
      precioHora: 22000,
      precioJornada: 120000,
      equipamiento: [
        {
          nombre: 'Mesa grande',
          cantidad: 1,
          descripcion: 'Mesa para terapia grupal',
        },
        { nombre: 'Sillas', cantidad: 6, descripcion: 'Sillas cómodas' },
        {
          nombre: 'Pizarra',
          cantidad: 1,
          descripcion: 'Pizarra para dinámicas',
        },
      ],
      dimensiones: { largo: 5, ancho: 4, alto: 2.5, unidad: 'metros' },
      activo: true,
      caracteristicas: [
        'Iluminación natural',
        'Aire acondicionado',
        'Insonorizado',
        'Amplio espacio',
      ],
      sede: 'Sede Viña del Mar',
    },
    {
      numero: '101',
      piso: 1,
      descripcion: 'Box espacioso para diversas terapias',
      capacidad: 4,
      precioHora: 16000,
      precioJornada: 85000,
      equipamiento: [
        {
          nombre: 'Escritorio',
          cantidad: 1,
          descripcion: 'Escritorio funcional',
        },
        { nombre: 'Sillas', cantidad: 4, descripcion: 'Sillas ergonómicas' },
        {
          nombre: 'Librero',
          cantidad: 1,
          descripcion: 'Librero con material de referencia',
        },
      ],
      dimensiones: { largo: 4, ancho: 3.5, alto: 2.5, unidad: 'metros' },
      activo: true,
      caracteristicas: [
        'Iluminación natural',
        'Aire acondicionado',
        'Insonorizado',
      ],
      sede: 'Sede Concepción',
    },
    {
      numero: '202',
      piso: 2,
      descripcion: 'Box acogedor para terapia individual',
      capacidad: 2,
      precioHora: 13000,
      precioJornada: 70000,
      equipamiento: [
        {
          nombre: 'Escritorio',
          cantidad: 1,
          descripcion: 'Escritorio pequeño',
        },
        { nombre: 'Sillas', cantidad: 2, descripcion: 'Sillas cómodas' },
      ],
      dimensiones: { largo: 3, ancho: 2.5, alto: 2.5, unidad: 'metros' },
      activo: false,
      caracteristicas: ['Insonorizado', 'Ambiente íntimo'],
      sede: 'Sede Concepción',
    },
  ];

  // Insertar los boxes
  for (const box of boxes) {
    const sedeId = sedesMap[box.sede];

    if (!sedeId) {
      console.log(
        `Sede "${box.sede}" no encontrada. Omitiendo box ${box.numero}.`,
      );
      continue;
    }

    const query = `
      INSERT INTO boxes 
      (numero, piso, descripcion, capacidad, "precioHora", "precioJornada", equipamiento, dimensiones, activo, caracteristicas, "sedeId", "createdAt", "updatedAt") 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
    `;

    const values = [
      box.numero,
      box.piso,
      box.descripcion,
      box.capacidad,
      box.precioHora,
      box.precioJornada,
      JSON.stringify(box.equipamiento),
      JSON.stringify(box.dimensiones),
      box.activo,
      box.caracteristicas,
      sedeId,
    ];

    await executeQuery(query, values);
  }

  console.log('Tabla de boxes poblada exitosamente con 10 boxes.');
}

// Función para poblar tabla de sedes
async function populateSedes() {
  console.log('Poblando tabla de sedes...');

  // Comprobar si ya existen sedes
  const existingSedes = await executeQuery('SELECT COUNT(*) FROM sedes');

  if (parseInt(existingSedes.rows[0].count) > 0) {
    console.log('La tabla de sedes ya tiene datos. Omitiendo inserción.');
    return;
  }

  // Array de sedes a insertar
  const sedes = [
    {
      nombre: 'Sede Central',
      direccion: 'Av. Providencia 1234',
      ciudad: 'Santiago',
      comuna: 'Providencia',
      descripcion:
        'Sede principal con amplia gama de boxes para atención psicológica',
      activa: true,
      telefono: '+56223456789',
      email: 'central@psicoespacios.cl',
      horarioAtencion: {
        diasHabiles: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
        horaApertura: '09:00',
        horaCierre: '20:00',
      },
    },
    {
      nombre: 'Sede Las Condes',
      direccion: 'Av. Apoquindo 4500',
      ciudad: 'Santiago',
      comuna: 'Las Condes',
      descripcion: 'Sede exclusiva con servicios premium',
      activa: true,
      telefono: '+56223456790',
      email: 'lascondes@psicoespacios.cl',
      horarioAtencion: {
        diasHabiles: [
          'Lunes',
          'Martes',
          'Miércoles',
          'Jueves',
          'Viernes',
          'Sábado',
        ],
        horaApertura: '09:00',
        horaCierre: '21:00',
      },
    },
    {
      nombre: 'Sede Ñuñoa',
      direccion: 'Irarrázaval 3600',
      ciudad: 'Santiago',
      comuna: 'Ñuñoa',
      descripcion: 'Sede acogedora con excelente conectividad',
      activa: true,
      telefono: '+56223456791',
      email: 'nunoa@psicoespacios.cl',
      horarioAtencion: {
        diasHabiles: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
        horaApertura: '10:00',
        horaCierre: '19:00',
      },
    },
    {
      nombre: 'Sede Viña del Mar',
      direccion: 'Av. Marina 1200',
      ciudad: 'Viña del Mar',
      comuna: 'Viña del Mar',
      descripcion: 'Sede con vista al mar, ambiente relajante',
      activa: true,
      telefono: '+56323456792',
      email: 'vina@psicoespacios.cl',
      horarioAtencion: {
        diasHabiles: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
        horaApertura: '09:00',
        horaCierre: '20:00',
      },
    },
    {
      nombre: 'Sede Concepción',
      direccion: 'Barros Arana 800',
      ciudad: 'Concepción',
      comuna: 'Concepción',
      descripcion: 'Sede principal en la región del Biobío',
      activa: true,
      telefono: '+56413456793',
      email: 'concepcion@psicoespacios.cl',
      horarioAtencion: {
        diasHabiles: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
        horaApertura: '09:00',
        horaCierre: '19:00',
      },
    },
  ];

  // Insertar las sedes
  for (const sede of sedes) {
    const query = `
      INSERT INTO sedes 
      (nombre, direccion, ciudad, comuna, descripcion, activa, telefono, email, "horarioAtencion", "createdAt", "updatedAt") 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING id
    `;

    const values = [
      sede.nombre,
      sede.direccion,
      sede.ciudad,
      sede.comuna,
      sede.descripcion,
      sede.activa,
      sede.telefono,
      sede.email,
      sede.horarioAtencion,
    ];

    await executeQuery(query, values);
  }

  console.log('Tabla de sedes poblada exitosamente con 5 sedes.');
}

// Función para poblar tabla de configuración del sistema
async function populateConfiguracionSistema() {
  console.log('Poblando tabla de configuración del sistema...');

  // Comprobar si ya existe configuración
  const existingConfig = await executeQuery(
    'SELECT COUNT(*) FROM configuracion_sistema',
  );

  if (parseInt(existingConfig.rows[0].count) > 0) {
    console.log(
      'La tabla de configuración del sistema ya tiene datos. Omitiendo inserción.',
    );
    return;
  }

  // Configuración a insertar
  const configuracion = {
    configuracionGeneral: {
      nombreSistema: 'PsicoEspacios',
      logotipo: 'https://psicoespacios.cl/logo.png',
      colorPrimario: '#4A6DA7',
      colorSecundario: '#D9E2F3',
      contactoSoporte: 'soporte@psicoespacios.cl',
    },
    configuracionReservas: {
      tiempoMinimoReserva: 60,
      tiempoMaximoReserva: 480,
      anticipacionMinima: 24,
      anticipacionMaxima: 720,
      intervaloHorario: [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
    },
    configuracionPagos: {
      moneda: 'CLP',
      comisionPlataforma: 5.0,
      metodosHabilitados: ['TARJETA', 'TRANSFERENCIA'],
      datosTransferencia: {
        banco: 'Banco Estado',
        tipoCuenta: 'Cuenta Corriente',
        numeroCuenta: '12345678',
        titular: 'PsicoEspacios SpA',
        rut: '77.123.456-7',
        email: 'finanzas@psicoespacios.cl',
      },
    },
    configuracionDerivacion: {
      especialidades: [
        'Clínica',
        'Infantil',
        'Adulto Mayor',
        'Parejas',
        'Familiar',
        'Laboral',
        'Educacional',
        'Forense',
        'Deportiva',
      ],
      modalidades: ['Presencial', 'Online', 'Mixta'],
      tiempoMaximoRespuesta: 48,
      comisionDerivacion: 10.0,
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
        reservaConfirmada: {
          asunto: 'Reserva confirmada en PsicoEspacios',
          plantilla:
            'Estimado/a {{nombre}}, su reserva ha sido confirmada para el día {{fecha}} a las {{hora}}.',
        },
        reservaCancelada: {
          asunto: 'Reserva cancelada en PsicoEspacios',
          plantilla:
            'Estimado/a {{nombre}}, lamentamos informar que su reserva del día {{fecha}} ha sido cancelada.',
        },
        pagoConfirmado: {
          asunto: 'Pago confirmado en PsicoEspacios',
          plantilla:
            'Estimado/a {{nombre}}, su pago por {{monto}} ha sido confirmado. Gracias por su preferencia.',
        },
      },
    },
  };

  // Insertar la configuración
  const query = `
    INSERT INTO configuracion_sistema 
    ("configuracionGeneral", "configuracionReservas", "configuracionPagos", "configuracionDerivacion", "configuracionSuscripciones", "configuracionNotificaciones", "createdAt", "updatedAt") 
    VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
  `;

  const values = [
    configuracion.configuracionGeneral,
    configuracion.configuracionReservas,
    configuracion.configuracionPagos,
    configuracion.configuracionDerivacion,
    configuracion.configuracionSuscripciones,
    configuracion.configuracionNotificaciones,
  ];

  await executeQuery(query, values);

  console.log('Tabla de configuración del sistema poblada exitosamente.');
}

// Función para poblar tabla de usuarios
async function populateUsers() {
  console.log('Poblando tabla de usuarios...');

  // Comprobar si ya existen usuarios para evitar duplicados
  const existingUsers = await executeQuery('SELECT COUNT(*) FROM users');

  if (parseInt(existingUsers.rows[0].count) > 0) {
    console.log('La tabla de usuarios ya tiene datos. Omitiendo inserción.');
    return;
  }

  // Array de usuarios a insertar
  const users = [
    {
      email: 'admin@psicoespacios.com',
      password: '$2b$10$lCBk31heOGIR4UZEh5TEIOxYySFLh.ulVBB2Lz.rX6A13TmwSCl7i', // "admin123"
      firstName: 'Administrador',
      lastName: 'Principal',
      rut: '12345678-9',
      telefono: '+56912345678',
      fechaNacimiento: '1985-05-10',
      role: 'ADMIN',
      estado: 'ACTIVO',
      verificado: true,
    },
    {
      email: 'psicologo1@psicoespacios.com',
      password: '$2b$10$lCBk31heOGIR4UZEh5TEIOxYySFLh.ulVBB2Lz.rX6A13TmwSCl7i', // "admin123"
      firstName: 'Juan',
      lastName: 'Pérez',
      rut: '15678234-5',
      telefono: '+56987654321',
      fechaNacimiento: '1980-03-15',
      role: 'PSICOLOGO',
      estado: 'ACTIVO',
      verificado: true,
    },
    {
      email: 'psicologo2@psicoespacios.com',
      password: '$2b$10$lCBk31heOGIR4UZEh5TEIOxYySFLh.ulVBB2Lz.rX6A13TmwSCl7i', // "admin123"
      firstName: 'María',
      lastName: 'González',
      rut: '17890123-6',
      telefono: '+56923456789',
      fechaNacimiento: '1982-07-22',
      role: 'PSICOLOGO',
      estado: 'ACTIVO',
      verificado: true,
    },
    {
      email: 'psicologo3@psicoespacios.com',
      password: '$2b$10$lCBk31heOGIR4UZEh5TEIOxYySFLh.ulVBB2Lz.rX6A13TmwSCl7i', // "admin123"
      firstName: 'Carlos',
      lastName: 'Rodríguez',
      rut: '18901234-7',
      telefono: '+56934567890',
      fechaNacimiento: '1979-11-05',
      role: 'PSICOLOGO',
      estado: 'ACTIVO',
      verificado: true,
    },
    {
      email: 'psicologo4@psicoespacios.com',
      password: '$2b$10$lCBk31heOGIR4UZEh5TEIOxYySFLh.ulVBB2Lz.rX6A13TmwSCl7i', // "admin123"
      firstName: 'Laura',
      lastName: 'Martínez',
      rut: '16789012-3',
      telefono: '+56945678901',
      fechaNacimiento: '1983-12-18',
      role: 'PSICOLOGO',
      estado: 'ACTIVO',
      verificado: true,
    },
    {
      email: 'psicologo5@psicoespacios.com',
      password: '$2b$10$lCBk31heOGIR4UZEh5TEIOxYySFLh.ulVBB2Lz.rX6A13TmwSCl7i', // "admin123"
      firstName: 'Andrés',
      lastName: 'Sánchez',
      rut: '19012345-8',
      telefono: '+56956789012',
      fechaNacimiento: '1984-04-29',
      role: 'PSICOLOGO',
      estado: 'SUSPENDIDO',
      verificado: true,
    },
    {
      email: 'paciente1@mail.com',
      password: '$2b$10$lCBk31heOGIR4UZEh5TEIOxYySFLh.ulVBB2Lz.rX6A13TmwSCl7i', // "admin123"
      firstName: 'Ana',
      lastName: 'López',
      rut: '20123456-9',
      telefono: '+56967890123',
      fechaNacimiento: '1990-08-12',
      role: 'PACIENTE',
      estado: 'ACTIVO',
      verificado: true,
    },
    {
      email: 'paciente2@mail.com',
      password: '$2b$10$lCBk31heOGIR4UZEh5TEIOxYySFLh.ulVBB2Lz.rX6A13TmwSCl7i', // "admin123"
      firstName: 'Pedro',
      lastName: 'Díaz',
      rut: '21234567-0',
      telefono: '+56978901234',
      fechaNacimiento: '1988-02-25',
      role: 'PACIENTE',
      estado: 'ACTIVO',
      verificado: true,
    },
    {
      email: 'paciente3@mail.com',
      password: '$2b$10$lCBk31heOGIR4UZEh5TEIOxYySFLh.ulVBB2Lz.rX6A13TmwSCl7i', // "admin123"
      firstName: 'Sofía',
      lastName: 'Torres',
      rut: '22345678-1',
      telefono: '+56989012345',
      fechaNacimiento: '1992-06-14',
      role: 'PACIENTE',
      estado: 'ACTIVO',
      verificado: true,
    },
    {
      email: 'paciente4@mail.com',
      password: '$2b$10$lCBk31heOGIR4UZEh5TEIOxYySFLh.ulVBB2Lz.rX6A13TmwSCl7i', // "admin123"
      firstName: 'Miguel',
      lastName: 'Ramírez',
      rut: '23456789-2',
      telefono: '+56990123456',
      fechaNacimiento: '1986-10-30',
      role: 'PACIENTE',
      estado: 'INACTIVO',
      verificado: false,
    },
  ];

  // Insertar los usuarios
  for (const user of users) {
    const query = `
      INSERT INTO users 
      (email, password, "firstName", "lastName", rut, telefono, "fechaNacimiento", role, estado, verificado, "createdAt", "updatedAt", "isActive") 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW(), true)
      RETURNING id
    `;

    const values = [
      user.email,
      user.password,
      user.firstName,
      user.lastName,
      user.rut,
      user.telefono,
      user.fechaNacimiento,
      user.role,
      user.estado,
      user.verificado,
    ];

    await executeQuery(query, values);
  }

  console.log('Tabla de usuarios poblada exitosamente con 10 usuarios.');
}

// Ejecutar la función principal
populateDatabase();
