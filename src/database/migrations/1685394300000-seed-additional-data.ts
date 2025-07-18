// 1685394300000-seed-additional-data.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migración para poblar más tablas con datos iniciales
 */
export class SeedAdditionalData1685394300000 implements MigrationInterface {
  name = 'SeedAdditionalData1685394300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Poblar la base de datos con datos adicionales
    await this.seedPerfilesDerivacion(queryRunner);
    await this.seedSuscripciones(queryRunner);
    await this.seedPacientes(queryRunner);
    await this.seedReservas(queryRunner);
    await this.seedPagos(queryRunner);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No es necesario implementar la eliminación de datos
    console.log('No se eliminarán los datos insertados.');
  }

  /**
   * Poblar tabla de perfiles de derivación
   */
  private async seedPerfilesDerivacion(queryRunner: QueryRunner): Promise<void> {
    console.log('Poblando tabla de perfiles de derivación...');

    // Comprobar si ya existen perfiles
    const existingPerfiles = await queryRunner.query(
      'SELECT COUNT(*) FROM perfiles_derivacion',
    );

    if (parseInt(existingPerfiles[0].count) > 0) {
      console.log('La tabla de perfiles de derivación ya tiene datos. Omitiendo inserción.');
      return;
    }

    // Obtener IDs de psicólogos
    const psicologos = await queryRunner.query(
      'SELECT id FROM users WHERE role = \'PSICOLOGO\'',
    );

    if (psicologos.length === 0) {
      console.log('No se encontraron psicólogos para crear perfiles. Omitiendo inserción.');
      return;
    }

    // Crear perfiles para cada psicólogo
    for (let i = 0; i < psicologos.length; i++) {
      const psicologoId = psicologos[i].id;
      const especialidades = [
        ['Terapia individual', 'Adultos', 'Ansiedad', 'Depresión'],
        ['Terapia infantil', 'Problemas de aprendizaje', 'TDAH'],
        ['Terapia de pareja', 'Mediación', 'Conflictos familiares']
      ];
      
      const disponibilidad = [
        [
          { dia: 'LUNES', horaInicio: '09:00', horaFin: '18:00' },
          { dia: 'MIERCOLES', horaInicio: '09:00', horaFin: '18:00' },
          { dia: 'VIERNES', horaInicio: '09:00', horaFin: '14:00' }
        ],
        [
          { dia: 'MARTES', horaInicio: '14:00', horaFin: '20:00' },
          { dia: 'JUEVES', horaInicio: '14:00', horaFin: '20:00' },
          { dia: 'SABADO', horaInicio: '09:00', horaFin: '13:00' }
        ],
        [
          { dia: 'LUNES', horaInicio: '15:00', horaFin: '20:00' },
          { dia: 'MARTES', horaInicio: '15:00', horaFin: '20:00' },
          { dia: 'MIERCOLES', horaInicio: '15:00', horaFin: '20:00' },
          { dia: 'JUEVES', horaInicio: '15:00', horaFin: '20:00' }
        ]
      ];
      
      await queryRunner.query(`
        INSERT INTO perfiles_derivacion 
        (descripcion, especialidades, modalidades, "horariosAtencion", "sedesAtencion", "tarifaHora", aprobado, "psicologoId") 
        VALUES 
        ('Perfil para atención de pacientes con diversas necesidades terapéuticas - Perfil ${i + 1}', 
        '${especialidades[i % especialidades.length].join(',')}', 
        'Presencial,Online', 
        '${JSON.stringify(disponibilidad[i % disponibilidad.length])}', 
        'Sede Principal', 
        ${25000 + (i * 5000)}, 
        true, 
        '${psicologoId}')
      `);
    }

    console.log('Tabla de perfiles de derivación poblada exitosamente.');
  }

  /**
   * Poblar tabla de suscripciones
   */
  private async seedSuscripciones(queryRunner: QueryRunner): Promise<void> {
    console.log('Poblando tabla de suscripciones...');

    // Comprobar si ya existen suscripciones
    const existingSuscripciones = await queryRunner.query(
      'SELECT COUNT(*) FROM suscripciones',
    );

    if (parseInt(existingSuscripciones[0].count) > 0) {
      console.log('La tabla de suscripciones ya tiene datos. Omitiendo inserción.');
      return;
    }

    // Obtener IDs de psicólogos
    const psicologos = await queryRunner.query(
      'SELECT id FROM users WHERE role = \'PSICOLOGO\'',
    );

    // Obtener IDs de planes
    const planes = await queryRunner.query('SELECT id, precio FROM planes');

    if (psicologos.length === 0 || planes.length === 0) {
      console.log('No se encontraron psicólogos o planes para crear suscripciones. Omitiendo inserción.');
      return;
    }

    // Generar fechas para las suscripciones
    const hoy = new Date();
    const inicioMesPasado = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
    const finMesPasado = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
    const inicioMesActual = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const finMesActual = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    const inicioMesSiguiente = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1);
    const finMesSiguiente = new Date(hoy.getFullYear(), hoy.getMonth() + 2, 0);

    // Crear suscripciones
    const suscripciones = [
      {
        usuarioId: psicologos[0].id,
        planId: planes[1].id, // Plan Estándar
        fechaInicio: inicioMesPasado.toISOString(),
        fechaFin: finMesPasado.toISOString(),
        estado: 'COMPLETADA',
        precioTotal: planes[1].precio,
        horasConsumidas: 8,
        horasDisponibles: 0
      },
      {
        usuarioId: psicologos[0].id,
        planId: planes[1].id, // Plan Estándar
        fechaInicio: inicioMesActual.toISOString(),
        fechaFin: finMesActual.toISOString(),
        estado: 'ACTIVA',
        precioTotal: planes[1].precio,
        horasConsumidas: 3,
        horasDisponibles: 5
      },
      {
        usuarioId: psicologos[1].id,
        planId: planes[2].id, // Plan Premium
        fechaInicio: inicioMesActual.toISOString(),
        fechaFin: finMesActual.toISOString(),
        estado: 'ACTIVA',
        precioTotal: planes[2].precio,
        horasConsumidas: 2,
        horasDisponibles: 13
      },
      {
        usuarioId: psicologos[2].id,
        planId: planes[0].id, // Plan Básico
        fechaInicio: inicioMesSiguiente.toISOString(),
        fechaFin: finMesSiguiente.toISOString(),
        estado: 'PENDIENTE',
        precioTotal: planes[0].precio,
        horasConsumidas: 0,
        horasDisponibles: 4
      }
    ];

    for (const suscripcion of suscripciones) {
      await queryRunner.query(`
        INSERT INTO suscripciones 
        ("fechaInicio", "fechaFin", estado, "precioTotal", "planId", "usuarioId", 
        "horasConsumidas", "horasDisponibles") 
        VALUES 
        ('${suscripcion.fechaInicio}', '${suscripcion.fechaFin}', '${suscripcion.estado}', 
        ${suscripcion.precioTotal}, '${suscripcion.planId}', '${suscripcion.usuarioId}', 
        ${suscripcion.horasConsumidas}, ${suscripcion.horasDisponibles})
      `);
    }

    console.log('Tabla de suscripciones poblada exitosamente.');
  }

  /**
   * Poblar tabla de pacientes
   */
  private async seedPacientes(queryRunner: QueryRunner): Promise<void> {
    console.log('Poblando tabla de pacientes...');

    // Comprobar si ya existen pacientes
    const existingPacientes = await queryRunner.query(
      'SELECT COUNT(*) FROM pacientes',
    );

    if (parseInt(existingPacientes[0].count) > 0) {
      console.log('La tabla de pacientes ya tiene datos. Omitiendo inserción.');
      return;
    }

    // Obtener IDs de psicólogos
    const psicologos = await queryRunner.query(
      'SELECT id FROM users WHERE role = \'PSICOLOGO\'',
    );

    if (psicologos.length === 0) {
      console.log('No se encontraron psicólogos para crear pacientes. Omitiendo inserción.');
      return;
    }

    // Crear pacientes
    const usuarios = await queryRunner.query('SELECT id FROM users WHERE role = \'PACIENTE\'' );
    if (usuarios.length === 0) {
      console.log('No se encontraron usuarios PACIENTE para crear pacientes. Omitiendo inserción.');
      return;
    }
    const pacientes = [
      {
        idUsuarioPaciente: usuarios[0]?.id,
        idUsuarioPsicologo: psicologos[0]?.id,
        primeraSesionRegistrada: '2023-01-10T10:00:00.000Z',
        proximaSesion: '2023-01-17T10:00:00.000Z',
        estado: 'ACTIVO'
      },
      {
        idUsuarioPaciente: usuarios[1]?.id,
        idUsuarioPsicologo: psicologos[1]?.id,
        primeraSesionRegistrada: '2023-02-15T11:00:00.000Z',
        proximaSesion: null,
        estado: 'INACTIVO'
      },
      {
        idUsuarioPaciente: usuarios[2]?.id,
        idUsuarioPsicologo: psicologos[2]?.id,
        primeraSesionRegistrada: '2023-03-20T09:30:00.000Z',
        proximaSesion: '2023-03-27T09:30:00.000Z',
        estado: null
      }
    ];

    for (const paciente of pacientes) {
      if (!paciente.idUsuarioPaciente || !paciente.idUsuarioPsicologo) continue;
      await queryRunner.query(`
        INSERT INTO pacientes 
        ("idUsuarioPaciente", "idUsuarioPsicologo", "primeraSesionRegistrada", "proximaSesion", "estado") 
        VALUES 
        ('${paciente.idUsuarioPaciente}', '${paciente.idUsuarioPsicologo}', '${paciente.primeraSesionRegistrada}', ${paciente.proximaSesion ? `'${paciente.proximaSesion}'` : 'NULL'}, ${paciente.estado ? `'${paciente.estado}'` : 'NULL'})
      `);
    }

    console.log('Tabla de pacientes poblada exitosamente.');
  }

  /**
   * Poblar tabla de reservas
   */
  private async seedReservas(queryRunner: QueryRunner): Promise<void> {
    console.log('Poblando tabla de reservas...');

    // Comprobar si ya existen reservas
    const existingReservas = await queryRunner.query(
      'SELECT COUNT(*) FROM reservas',
    );

    if (parseInt(existingReservas[0].count) > 0) {
      console.log('La tabla de reservas ya tiene datos. Omitiendo inserción.');
      return;
    }

    // Obtener IDs de psicólogos
    const psicologos = await queryRunner.query(
      'SELECT id FROM users WHERE role = \'PSICOLOGO\'',
    );

    // Obtener IDs de boxes
    const boxes = await queryRunner.query('SELECT id FROM boxes');

    // Obtener IDs de suscripciones activas
    const suscripciones = await queryRunner.query(
      'SELECT id, "usuarioId" FROM suscripciones WHERE estado = \'ACTIVA\'',
    );

    if (psicologos.length === 0 || boxes.length === 0 || suscripciones.length === 0) {
      console.log('No se encontraron psicólogos, boxes o suscripciones para crear reservas. Omitiendo inserción.');
      return;
    }

    // Crear reservas
    const hoy = new Date();
    
    // Función para sumar días a una fecha
    function addDays(date, days) {
      const result = new Date(date);
      result.setDate(result.getDate() + days);
      return result;
    }
    
    // Función para formatear fecha a ISO string sin milisegundos
    function formatDate(date) {
      if (!(date instanceof Date)) {
        date = new Date(date);
      }
      return date.toISOString().split('.')[0];
    }
    
    const reservas = [
      // Reserva pasada completada
      {
        fechaInicio: formatDate(addDays(hoy, -10)),
        fechaFin: formatDate(new Date(addDays(hoy, -10).getTime() + 60 * 60 * 1000)), // +1 hora
        estado: 'COMPLETADA',
        notas: 'Sesión regular',
        psicologoId: psicologos[0].id,
        boxId: boxes[0].id,
        suscripcionId: suscripciones.find(s => s.usuarioId === psicologos[0].id)?.id
      },
      // Reserva pasada cancelada
      {
        fechaInicio: formatDate(addDays(hoy, -5)),
        fechaFin: formatDate(new Date(addDays(hoy, -5).getTime() + 60 * 60 * 1000)), // +1 hora
        estado: 'CANCELADA',
        notas: 'Cancelada por el paciente',
        psicologoId: psicologos[1].id,
        boxId: boxes[1].id,
        suscripcionId: suscripciones.find(s => s.usuarioId === psicologos[1].id)?.id
      },
      // Reserva para hoy
      {
        fechaInicio: formatDate(new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 15, 0, 0)),
        fechaFin: formatDate(new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 16, 0, 0)),
        estado: 'CONFIRMADA',
        notas: 'Sesión de evaluación',
        psicologoId: psicologos[0].id,
        boxId: boxes[2].id,
        suscripcionId: suscripciones.find(s => s.usuarioId === psicologos[0].id)?.id
      },
      // Reserva futura
      {
        fechaInicio: formatDate(addDays(hoy, 3)),
        fechaFin: formatDate(new Date(addDays(hoy, 3).getTime() + 60 * 60 * 1000)), // +1 hora
        estado: 'PENDIENTE',
        notas: 'Primera sesión',
        psicologoId: psicologos[2].id,
        boxId: boxes[0].id,
        suscripcionId: suscripciones.find(s => s.usuarioId === psicologos[2].id)?.id
      }
    ];

    for (const reserva of reservas) {
      if (reserva.suscripcionId) {
        await queryRunner.query(`
          INSERT INTO reservas 
          ("fechaInicio", "fechaFin", estado, notas, "psicologoId", "boxId", "suscripcionId") 
          VALUES 
          ('${reserva.fechaInicio}', '${reserva.fechaFin}', '${reserva.estado}', '${reserva.notas}', 
          '${reserva.psicologoId}', '${reserva.boxId}', '${reserva.suscripcionId}')
        `);
      } else {
        await queryRunner.query(`
          INSERT INTO reservas 
          ("fechaInicio", "fechaFin", estado, notas, "psicologoId", "boxId") 
          VALUES 
          ('${reserva.fechaInicio}', '${reserva.fechaFin}', '${reserva.estado}', '${reserva.notas}', 
          '${reserva.psicologoId}', '${reserva.boxId}')
        `);
      }
    }

    console.log('Tabla de reservas poblada exitosamente.');
  }

  /**
   * Poblar tabla de pagos
   */
  private async seedPagos(queryRunner: QueryRunner): Promise<void> {
    console.log('Poblando tabla de pagos...');

    // Comprobar si ya existen pagos
    const existingPagos = await queryRunner.query(
      'SELECT COUNT(*) FROM pagos',
    );

    if (parseInt(existingPagos[0].count) > 0) {
      console.log('La tabla de pagos ya tiene datos. Omitiendo inserción.');
      return;
    }

    // Obtener IDs de suscripciones
    const suscripciones = await queryRunner.query(
      'SELECT id, "usuarioId", "precioTotal" FROM suscripciones',
    );

    if (suscripciones.length === 0) {
      console.log('No se encontraron suscripciones para crear pagos. Omitiendo inserción.');
      return;
    }

    // Crear pagos para suscripciones
    for (const suscripcion of suscripciones) {
      const fechaCompletado = suscripcion.id % 2 === 0 ? 
        `'${new Date().toISOString()}'` : 'NULL';
        
      const datosTransaccion = {
        metodoPago: suscripcion.id % 2 === 0 ? 'TARJETA' : 'TRANSFERENCIA',
        referencia: `TRX-${100000 + parseInt(suscripcion.id.substring(0, 6), 16) % 900000}`,
        datosTarjeta: suscripcion.id % 2 === 0 ? {
          ultimos4: `${1000 + parseInt(suscripcion.id.substring(0, 4), 16) % 9000}`,
          marca: parseInt(suscripcion.id.substring(0, 2), 16) % 2 === 0 ? 'VISA' : 'MASTERCARD'
        } : null,
        datosTransferencia: suscripcion.id % 2 !== 0 ? {
          banco: 'Banco Estado',
          numeroOperacion: `${500000 + parseInt(suscripcion.id.substring(0, 6), 16) % 500000}`
        } : null,
        fechaTransaccion: new Date().toISOString()
      };
      
      const estado = fechaCompletado === 'NULL' ? 'PENDIENTE' : 'COMPLETADO';
      
      await queryRunner.query(`
        INSERT INTO pagos 
        (monto, estado, tipo, "datosTransaccion", "metadatos", "fechaCompletado", 
        "suscripcionId", "usuarioId") 
        VALUES 
        (${suscripcion.precioTotal}, '${estado}', 'SUSCRIPCION', 
        '${JSON.stringify(datosTransaccion)}', 
        '{"plataforma":"web","ipCliente":"192.168.1.1","userAgent":"Mozilla/5.0"}', 
        ${fechaCompletado}, '${suscripcion.id}', '${suscripcion.usuarioId}')
      `);
    }

    console.log('Tabla de pagos poblada exitosamente.');
  }
}
