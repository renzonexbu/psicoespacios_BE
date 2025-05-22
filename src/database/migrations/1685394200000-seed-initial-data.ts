// 1685394200000-seed-initial-data.ts
import { MigrationInterface, QueryRunner } from 'typeorm';
import * as bcrypt from 'bcrypt';

/**
 * Migración para poblar la base de datos con datos iniciales
 */
export class SeedInitialData1685394200000 implements MigrationInterface {
  name = 'SeedInitialData1685394200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Poblar la base de datos con datos iniciales
    await this.seedUsers(queryRunner);
    await this.seedConfiguracionSistema(queryRunner);
    await this.seedSedes(queryRunner);
    await this.seedBoxes(queryRunner);
    await this.seedPlanes(queryRunner);
    await this.seedContactos(queryRunner);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No es necesario implementar la eliminación de datos
    console.log('No se eliminarán los datos insertados.');
  }

  /**
   * Poblar tabla de usuarios con datos iniciales
   */
  private async seedUsers(queryRunner: QueryRunner): Promise<void> {
    console.log('Poblando tabla de usuarios...');

    // Comprobar si ya existen usuarios
    const existingUsers = await queryRunner.query(
      'SELECT COUNT(*) FROM users',
    );

    if (parseInt(existingUsers[0].count) > 0) {
      console.log('La tabla de usuarios ya tiene datos. Omitiendo inserción.');
      return;
    }

    // Hashear las contraseñas
    const hashPassword = async (password: string): Promise<string> => {
      const salt = await bcrypt.genSalt();
      return bcrypt.hash(password, salt);
    };

    // Insertar un usuario administrador
    const adminPassword = await hashPassword('admin123');
    await queryRunner.query(`
      INSERT INTO users 
      (email, password, nombre, apellido, role, estado) 
      VALUES 
      ('admin@psicoespacios.com', '${adminPassword}', 'Administrador', 'Sistema', 'ADMIN', 'ACTIVO')
    `);

    // Insertar psicólogos
    const psicologos = [
      {
        email: 'maria.rodriguez@psicoespacios.com',
        password: await hashPassword('psicologo123'),
        nombre: 'María',
        apellido: 'Rodríguez',
        rut: '12345678-9',
        telefono: '+56912345678',
        role: 'PSICOLOGO',
        especialidad: 'Psicología Clínica',
        bio: 'Psicóloga clínica con 10 años de experiencia en terapia para adultos y adolescentes.',
        estado: 'ACTIVO',
      },
      {
        email: 'juan.perez@psicoespacios.com',
        password: await hashPassword('psicologo123'),
        nombre: 'Juan',
        apellido: 'Pérez',
        rut: '98765432-1',
        telefono: '+56923456789',
        role: 'PSICOLOGO',
        especialidad: 'Psicología Infantil',
        bio: 'Especialista en psicología infantil con enfoque en problemas de aprendizaje y desarrollo.',
        estado: 'ACTIVO',
      },
      {
        email: 'carolina.silva@psicoespacios.com',
        password: await hashPassword('psicologo123'),
        nombre: 'Carolina',
        apellido: 'Silva',
        rut: '11223344-5',
        telefono: '+56934567890',
        role: 'PSICOLOGO',
        especialidad: 'Terapia de Pareja',
        bio: 'Terapeuta de parejas con formación en mediación y resolución de conflictos.',
        estado: 'ACTIVO',
      },
    ];

    for (const psicologo of psicologos) {
      await queryRunner.query(`
        INSERT INTO users 
        (email, password, nombre, apellido, rut, telefono, role, especialidad, bio, estado) 
        VALUES 
        ('${psicologo.email}', '${psicologo.password}', '${psicologo.nombre}', '${psicologo.apellido}', 
        '${psicologo.rut}', '${psicologo.telefono}', '${psicologo.role}', '${psicologo.especialidad}', 
        '${psicologo.bio}', '${psicologo.estado}')
      `);
    }

    // Insertar usuarios comunes
    const usuarios = [
      {
        email: 'cliente1@example.com',
        password: await hashPassword('cliente123'),
        nombre: 'Ana',
        apellido: 'Gómez',
        rut: '13579246-8',
        telefono: '+56945678901',
        role: 'USUARIO',
        estado: 'ACTIVO',
      },
      {
        email: 'cliente2@example.com',
        password: await hashPassword('cliente123'),
        nombre: 'Pedro',
        apellido: 'Díaz',
        rut: '24681357-9',
        telefono: '+56956789012',
        role: 'USUARIO',
        estado: 'ACTIVO',
      },
    ];

    for (const usuario of usuarios) {
      await queryRunner.query(`
        INSERT INTO users 
        (email, password, nombre, apellido, rut, telefono, role, estado) 
        VALUES 
        ('${usuario.email}', '${usuario.password}', '${usuario.nombre}', '${usuario.apellido}', 
        '${usuario.rut}', '${usuario.telefono}', '${usuario.role}', '${usuario.estado}')
      `);
    }

    console.log('Tabla de usuarios poblada exitosamente.');
  }

  /**
   * Poblar tabla de configuración del sistema
   */
  private async seedConfiguracionSistema(queryRunner: QueryRunner): Promise<void> {
    console.log('Poblando tabla de configuración del sistema...');

    // Comprobar si ya existe configuración
    const existingConfig = await queryRunner.query(
      'SELECT COUNT(*) FROM configuracion_sistema',
    );

    if (parseInt(existingConfig[0].count) > 0) {
      console.log('La tabla de configuración ya tiene datos. Omitiendo inserción.');
      return;
    }

    // Insertar configuración inicial
    await queryRunner.query(`
      INSERT INTO configuracion_sistema 
      (nombreSistema, logo, colorPrimario, colorSecundario, emailContacto, telefonoContacto, direccion, 
      redesSociales, terminosCondiciones, politicaPrivacidad, metodosPago, monedaDefecto, zonaHoraria) 
      VALUES 
      ('PsicoEspacios', 'https://example.com/logo.png', '#3f51b5', '#f50057', 
      'contacto@psicoespacios.com', '+56912345678', 'Av. Providencia 1234, Providencia, Santiago', 
      '{"facebook":"https://facebook.com/psicoespacios","instagram":"https://instagram.com/psicoespacios","twitter":"https://twitter.com/psicoespacios"}', 
      'Términos y condiciones del servicio...', 'Política de privacidad del servicio...', 
      '["TARJETA","TRANSFERENCIA"]', 'CLP', 'America/Santiago')
    `);

    console.log('Tabla de configuración poblada exitosamente.');
  }

  /**
   * Poblar tabla de sedes
   */
  private async seedSedes(queryRunner: QueryRunner): Promise<void> {
    console.log('Poblando tabla de sedes...');

    // Comprobar si ya existen sedes
    const existingSedes = await queryRunner.query(
      'SELECT COUNT(*) FROM sedes',
    );

    if (parseInt(existingSedes[0].count) > 0) {
      console.log('La tabla de sedes ya tiene datos. Omitiendo inserción.');
      return;
    }

    // Insertar sedes
    const sedes = [
      {
        nombre: 'PsicoEspacios Providencia',
        direccion: 'Av. Providencia 1234, Providencia',
        ciudad: 'Santiago',
        telefono: '+56912345678',
        email: 'providencia@psicoespacios.com',
        coordenadas: { lat: -33.4289, lng: -70.6093 },
        estado: 'ACTIVA',
      },
      {
        nombre: 'PsicoEspacios Las Condes',
        direccion: 'Av. Apoquindo 4500, Las Condes',
        ciudad: 'Santiago',
        telefono: '+56923456789',
        email: 'lascondes@psicoespacios.com',
        coordenadas: { lat: -33.4103, lng: -70.5831 },
        estado: 'ACTIVA',
      },
      {
        nombre: 'PsicoEspacios Ñuñoa',
        direccion: 'Av. Irarrázaval 3400, Ñuñoa',
        ciudad: 'Santiago',
        telefono: '+56934567890',
        email: 'nunoa@psicoespacios.com',
        coordenadas: { lat: -33.4563, lng: -70.5934 },
        estado: 'ACTIVA',
      },
    ];

    for (const sede of sedes) {
      await queryRunner.query(`
        INSERT INTO sedes 
        (nombre, direccion, ciudad, telefono, email, coordenadas, estado) 
        VALUES 
        ('${sede.nombre}', '${sede.direccion}', '${sede.ciudad}', '${sede.telefono}', 
        '${sede.email}', '${JSON.stringify(sede.coordenadas)}', '${sede.estado}')
      `);
    }

    console.log('Tabla de sedes poblada exitosamente.');
  }

  /**
   * Poblar tabla de boxes
   */
  private async seedBoxes(queryRunner: QueryRunner): Promise<void> {
    console.log('Poblando tabla de boxes...');

    // Comprobar si ya existen boxes
    const existingBoxes = await queryRunner.query(
      'SELECT COUNT(*) FROM boxes',
    );

    if (parseInt(existingBoxes[0].count) > 0) {
      console.log('La tabla de boxes ya tiene datos. Omitiendo inserción.');
      return;
    }

    // Obtener IDs de las sedes
    const sedes = await queryRunner.query('SELECT id FROM sedes');

    if (sedes.length === 0) {
      console.log('No se encontraron sedes para crear boxes. Omitiendo inserción.');
      return;
    }

    // Generar boxes para cada sede
    for (let i = 0; i < sedes.length; i++) {
      const sedeId = sedes[i].id;
      
      // Crear 3 boxes para cada sede
      for (let j = 1; j <= 3; j++) {
        const boxNumber = i * 3 + j;
        const precio = 15000 + (j * 5000); // Precio varía según el box
        
        await queryRunner.query(`
          INSERT INTO boxes 
          (nombre, descripcion, capacidad, precio, precioHora, caracteristicas, imagenes, estado, "sedeId") 
          VALUES 
          ('Box ${boxNumber}', 'Box confortable y acogedor ideal para terapia individual o de pareja.', 
          ${j + 1}, ${precio}, ${precio / 2}, 
          '["Luz natural","Aire acondicionado","Insonorizado","Wifi de alta velocidad"]', 
          '["https://example.com/box${boxNumber}_1.jpg","https://example.com/box${boxNumber}_2.jpg"]', 
          'DISPONIBLE', '${sedeId}')
        `);
      }
    }

    console.log('Tabla de boxes poblada exitosamente.');
  }

  /**
   * Poblar tabla de planes
   */
  private async seedPlanes(queryRunner: QueryRunner): Promise<void> {
    console.log('Poblando tabla de planes...');

    // Comprobar si ya existen planes
    const existingPlanes = await queryRunner.query(
      'SELECT COUNT(*) FROM planes',
    );

    if (parseInt(existingPlanes[0].count) > 0) {
      console.log('La tabla de planes ya tiene datos. Omitiendo inserción.');
      return;
    }

    // Insertar planes
    const planes = [
      {
        nombre: 'Plan Básico',
        descripcion: 'Plan ideal para psicólogos que inician su práctica o atienden pocas horas a la semana.',
        precio: 50000,
        duracionMeses: 1,
        caracteristicas: [
          'Acceso a boxes durante 10 horas mensuales',
          'Reserva hasta con 1 semana de anticipación',
          'Acceso a WiFi',
          'Uso de áreas comunes',
        ],
        horasIncluidas: 10,
        descuentoHoraAdicional: 0,
        estado: 'ACTIVO',
      },
      {
        nombre: 'Plan Estándar',
        descripcion: 'Plan diseñado para psicólogos con práctica regular que necesitan más horas de atención.',
        precio: 90000,
        duracionMeses: 1,
        caracteristicas: [
          'Acceso a boxes durante 20 horas mensuales',
          'Reserva hasta con 2 semanas de anticipación',
          'Acceso a WiFi',
          'Uso de áreas comunes',
          'Descuento en horas adicionales',
        ],
        horasIncluidas: 20,
        descuentoHoraAdicional: 10,
        estado: 'ACTIVO',
      },
      {
        nombre: 'Plan Premium',
        descripcion: 'Plan completo para psicólogos con alta demanda de pacientes y necesidades de flexibilidad.',
        precio: 150000,
        duracionMeses: 1,
        caracteristicas: [
          'Acceso a boxes durante 40 horas mensuales',
          'Reserva hasta con 1 mes de anticipación',
          'Acceso a WiFi',
          'Uso de áreas comunes',
          'Mayor descuento en horas adicionales',
          'Acceso preferencial a boxes premium',
        ],
        horasIncluidas: 40,
        descuentoHoraAdicional: 20,
        estado: 'ACTIVO',
      },
    ];

    for (const plan of planes) {
      await queryRunner.query(`
        INSERT INTO planes 
        (nombre, descripcion, precio, "duracionMeses", caracteristicas, "horasIncluidas", "descuentoHoraAdicional", estado) 
        VALUES 
        ('${plan.nombre}', '${plan.descripcion}', ${plan.precio}, ${plan.duracionMeses}, 
        '${JSON.stringify(plan.caracteristicas)}', ${plan.horasIncluidas}, ${plan.descuentoHoraAdicional}, 
        '${plan.estado}')
      `);
    }

    console.log('Tabla de planes poblada exitosamente.');
  }

  /**
   * Poblar tabla de contactos
   */
  private async seedContactos(queryRunner: QueryRunner): Promise<void> {
    console.log('Poblando tabla de contactos...');

    // Comprobar si ya existen contactos
    const existingContactos = await queryRunner.query(
      'SELECT COUNT(*) FROM contactos',
    );

    if (parseInt(existingContactos[0].count) > 0) {
      console.log('La tabla de contactos ya tiene datos. Omitiendo inserción.');
      return;
    }

    // Función para generar fechas aleatorias en el pasado (entre 1 y maxDays días)
    function getPastDate(maxDays = 90) {
      const now = new Date();
      const pastDate = new Date(now);
      pastDate.setDate(now.getDate() - Math.floor(Math.random() * maxDays) - 1);
      return pastDate.toISOString();
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
    ];

    for (const contacto of contactos) {
      await queryRunner.query(`
        INSERT INTO contactos 
        (nombre, tipo, email, telefono, mensaje, fecha, estado) 
        VALUES 
        ('${contacto.nombre}', '${contacto.tipo}', '${contacto.email}', '${contacto.telefono}', 
        '${contacto.mensaje.replace(/'/g, "''")}', '${contacto.fecha}', '${contacto.estado}')
      `);
    }

    console.log('Tabla de contactos poblada exitosamente.');
  }
}
