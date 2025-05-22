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
          { dia: 'LUNES', inicio: '09:00', fin: '18:00' },
          { dia: 'MIERCOLES', inicio: '09:00', fin: '18:00' },
          { dia: 'VIERNES', inicio: '09:00', fin: '14:00' }
        ],
        [
          { dia: 'MARTES', inicio: '14:00', fin: '20:00' },
          { dia: 'JUEVES', inicio: '14:00', fin: '20:00' },
          { dia: 'SABADO', inicio: '09:00', fin: '13:00' }
        ],
        [
          { dia: 'LUNES', inicio: '15:00', fin: '20:00' },
          { dia: 'MARTES', inicio: '15:00', fin: '20:00' },
          { dia: 'MIERCOLES', inicio: '15:00', fin: '20:00' },
          { dia: 'JUEVES', inicio: '15:00', fin: '20:00' }
        ]
      ];
      
      await queryRunner.query(`
        INSERT INTO perfiles_derivacion 
        (nombre, descripcion, especialidades, publico, "psicologoId", "precioSesion", disponibilidad, estado) 
        VALUES 
        ('Perfil de Atención ${i + 1}', 
        'Perfil para atención de pacientes con diversas necesidades terapéuticas.', 
        '${JSON.stringify(especialidades[i % especialidades.length])}', 
        true, 
        '${psicologoId}', 
        ${25000 + (i * 5000)}, 
        '${JSON.stringify(disponibilidad[i % disponibilidad.length])}', 
        'ACTIVO')
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
    const planes = await queryRunner.query('SELECT id, "horasIncluidas", precio FROM planes');

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
        horasConsumidas: planes[1].horasIncluidas,
        horasDisponibles: 0
      },
      {
        usuarioId: psicologos[0].id,
        planId: planes[1].id, // Plan Estándar
        fechaInicio: inicioMesActual.toISOString(),
        fechaFin: finMesActual.toISOString(),
        estado: 'ACTIVA',
        precioTotal: planes[1].precio,
        horasConsumidas: Math.floor(planes[1].horasIncluidas / 2),
        horasDisponibles: Math.ceil(planes[1].horasIncluidas / 2)
      },
      {
        usuarioId: psicologos[1].id,
        planId: planes[2].id, // Plan Premium
        fechaInicio: inicioMesActual.toISOString(),
        fechaFin: finMesActual.toISOString(),
        estado: 'ACTIVA',
        precioTotal: planes[2].precio,
        horasConsumidas: 10,
        horasDisponibles: planes[2].horasIncluidas - 10
      },
      {
        usuarioId: psicologos[2].id,
        planId: planes[0].id, // Plan Básico
        fechaInicio: inicioMesSiguiente.toISOString(),
        fechaFin: finMesSiguiente.toISOString(),
        estado: 'PENDIENTE',
        precioTotal: planes[0].precio,
        horasConsumidas: 0,
        horasDisponibles: planes[0].horasIncluidas
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
    const pacientes = [
      {
        nombre: 'Laura',
        apellido: 'Martínez',
        rut: '15678234-5',
        fechaNacimiento: '1985-03-15',
        genero: 'FEMENINO',
        direccion: 'Calle Los Olivos 123, Providencia',
        telefono: '+56912345678',
        email: 'laura.martinez@example.com',
        contactoEmergencia: {
          nombre: 'Carlos Martínez',
          relacion: 'Esposo',
          telefono: '+56923456789'
        },
        psicologoId: psicologos[0].id,
        datosAdicionales: {
          ocupacion: 'Ingeniera',
          estadoCivil: 'Casada',
          derivadoPor: 'Referencia personal'
        },
        estado: 'ACTIVO'
      },
      {
        nombre: 'Miguel',
        apellido: 'Torres',
        rut: '17456789-0',
        fechaNacimiento: '1992-07-22',
        genero: 'MASCULINO',
        direccion: 'Av. Apoquindo 5400, Las Condes',
        telefono: '+56934567890',
        email: 'miguel.torres@example.com',
        contactoEmergencia: {
          nombre: 'Ana Torres',
          relacion: 'Madre',
          telefono: '+56945678901'
        },
        psicologoId: psicologos[1].id,
        datosAdicionales: {
          ocupacion: 'Estudiante',
          estadoCivil: 'Soltero',
          derivadoPor: 'Universidad'
        },
        estado: 'ACTIVO'
      },
      {
        nombre: 'Carmen',
        apellido: 'Silva',
        rut: '12345678-9',
        fechaNacimiento: '1978-11-30',
        genero: 'FEMENINO',
        direccion: 'Calle Dublé Almeyda 1234, Ñuñoa',
        telefono: '+56956789012',
        email: 'carmen.silva@example.com',
        contactoEmergencia: {
          nombre: 'Juan Silva',
          relacion: 'Hermano',
          telefono: '+56967890123'
        },
        psicologoId: psicologos[2].id,
        datosAdicionales: {
          ocupacion: 'Profesora',
          estadoCivil: 'Divorciada',
          derivadoPor: 'Médico tratante'
        },
        estado: 'ACTIVO'
      }
    ];

    for (const paciente of pacientes) {
      await queryRunner.query(`
        INSERT INTO pacientes 
        (nombre, apellido, rut, "fechaNacimiento", genero, direccion, telefono, email, 
        "contactoEmergencia", "psicologoId", "datosAdicionales", estado) 
        VALUES 
        ('${paciente.nombre}', '${paciente.apellido}', '${paciente.rut}', '${paciente.fechaNacimiento}', 
        '${paciente.genero}', '${paciente.direccion}', '${paciente.telefono}', '${paciente.email}', 
        '${JSON.stringify(paciente.contactoEmergencia)}', '${paciente.psicologoId}', 
        '${JSON.stringify(paciente.datosAdicionales)}', '${paciente.estado}')
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
      return date.toISOString().split('.')[0];
    }
    
    const reservas = [
      // Reserva pasada completada
      {
        fechaInicio: formatDate(addDays(hoy, -10)),
        fechaFin: formatDate(addDays(hoy, -10).setHours(addDays(hoy, -10).getHours() + 1)),
        estado: 'COMPLETADA',
        notas: 'Sesión regular',
        psicologoId: psicologos[0].id,
        boxId: boxes[0].id,
        suscripcionId: suscripciones.find(s => s.usuarioId === psicologos[0].id)?.id
      },
      // Reserva pasada cancelada
      {
        fechaInicio: formatDate(addDays(hoy, -5)),
        fechaFin: formatDate(addDays(hoy, -5).setHours(addDays(hoy, -5).getHours() + 1)),
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
        fechaFin: formatDate(addDays(hoy, 3).setHours(addDays(hoy, 3).getHours() + 1)),
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
