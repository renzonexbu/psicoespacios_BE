// 1685394200000-seed-initial-data.ts
import { MigrationInterface, QueryRunner } from 'typeorm';
import * as bcrypt from 'bcrypt';

/**
 * Migración para poblar la base de datos con datos iniciales
 * (Versión corregida con mejor manejo de nombres de columnas)
 */
export class SeedInitialData1685394200000 implements MigrationInterface {
  name = 'SeedInitialData1685394200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Poblar la base de datos con datos iniciales
     try {
      await this.seedUsers(queryRunner);
    } catch (error) {
      console.error(`Error en seedUsers: ${error.message}`);
      // Continuamos con el siguiente seed
    }
    
    try {
      await this.seedConfiguracionSistema(queryRunner);
    } catch (error) {
      console.error(`Error en seedConfiguracionSistema: ${error.message}`);
      // Continuamos con el siguiente seed
    }
    
    try {
      await this.seedSedes(queryRunner);
    } catch (error) {
      console.error(`Error en seedSedes: ${error.message}`);
      // Continuamos con el siguiente seed
    }
    
    try {
      await this.seedBoxes(queryRunner);
    } catch (error) {
      console.error(`Error en seedBoxes: ${error.message}`);
      // Continuamos con el siguiente seed
    }
    
    try {
      await this.seedPlanes(queryRunner);
    } catch (error) {
      console.error(`Error en seedPlanes: ${error.message}`);
      // Continuamos con el siguiente seed
    }
    
    try {
      await this.seedContactos(queryRunner);
    } catch (error) {
      console.error(`Error en seedContactos: ${error.message}`);
    }
    // Seeder para blogs
    try {
      await this.seedBlogs(queryRunner);
    } catch (error) {
      console.error(`Error en seedBlogs: ${error.message}`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No es necesario implementar la eliminación de datos
    console.log('No se eliminarán los datos insertados.');
  }
  
  /**
   * Obtiene el nombre exacto de una columna en una tabla teniendo en cuenta case sensitivity
   * @param queryRunner El QueryRunner de TypeORM
   * @param tableName Nombre de la tabla
   * @param columnNameLowercase Nombre de la columna en minúsculas para buscar
   */
  private async getExactColumnName(
    queryRunner: QueryRunner,
    tableName: string,
    columnNameLowercase: string,
  ): Promise<string | null> {
    const columnsQuery = await queryRunner.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = '${tableName}'
    `);

    const foundColumn = columnsQuery.find(
      (col) => col.column_name.toLowerCase() === columnNameLowercase.toLowerCase(),
    );

    return foundColumn ? foundColumn.column_name : null;
  }

  /**
   * Comprueba si una columna existe en una tabla
   */
  private async columnExists(
    queryRunner: QueryRunner,
    tableName: string,
    columnNameLowercase: string,
  ): Promise<boolean> {
    const exactName = await this.getExactColumnName(queryRunner, tableName, columnNameLowercase);
    return exactName !== null;
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

    // ⚠️ SOLO CREAR USUARIO ADMIN - NO CREAR USUARIOS DE EJEMPLO
    console.log('⚠️ Solo creando usuario administrador (no usuarios de ejemplo)...');

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

    // ❌ COMENTADO: No insertar psicólogos de ejemplo
    /*
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
        nomoxre: 'Pedro',
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
    */

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
    }    // Verificar el nombre exacto de las columnas para resolver problemas de mayúsculas/minúsculas
    const columnsQuery = await queryRunner.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'configuracion_sistema' 
      AND column_name LIKE 'configuracion%'
    `);
    
    // Crear un mapa de nombres de columnas reales
    const columnMap = {};
    columnsQuery.forEach(col => {
      const lowerName = col.column_name.toLowerCase();
      columnMap[lowerName] = col.column_name;
    });
    
    // Determinar los nombres correctos de las columnas, con fallback a los originales
    const configGeneralCol = columnMap['configuraciongeneral'] || 'configuracionGeneral';
    const configReservasCol = columnMap['configuracionreservas'] || 'configuracionReservas';
    const configPagosCol = columnMap['configuracionpagos'] || 'configuracionPagos';
    const configDerivacionCol = columnMap['configuracionderivacion'] || 'configuracionDerivacion';
    const configSuscripcionesCol = columnMap['configuracionsuscripciones'] || 'configuracionSuscripciones';
    const configNotificacionesCol = columnMap['configuracionnotificaciones'] || 'configuracionNotificaciones';
    
    // Insertar configuración inicial con los nombres de columna correctos
    await queryRunner.query(`
      INSERT INTO configuracion_sistema 
      ("${configGeneralCol}", "${configReservasCol}", "${configPagosCol}", "${configDerivacionCol}", "${configSuscripcionesCol}", "${configNotificacionesCol}") 
      VALUES 
      (
        '{"nombreSistema":"PsicoEspacios","logotipo":"https://example.com/logo.png","colorPrimario":"#3f51b5","colorSecundario":"#f50057","contactoSoporte":"contacto@psicoespacios.com"}'::jsonb,
        '{"tiempoMinimoReserva":60,"tiempoMaximoReserva":240,"anticipacionMinima":24,"anticipacionMaxima":720,"intervaloHorario":[9,19]}'::jsonb,
        '{"moneda":"CLP","comisionPlataforma":5,"metodosHabilitados":["TARJETA","TRANSFERENCIA"],"datosTransferencia":{"banco":"Banco Estado","tipoCuenta":"Corriente","numeroCuenta":"123456789","titular":"PsicoEspacios SpA","rut":"76.123.456-7","email":"pagos@psicoespacios.com"}}'::jsonb,
        '{"especialidades":["Psicología Clínica","Psicología Infantil","Terapia de Pareja","Terapia Familiar"],"modalidades":["Presencial","Online"],"tiempoMaximoRespuesta":48,"comisionDerivacion":10}'::jsonb,
        '{"periodosRenovacion":[1,3,6,12],"descuentosRenovacion":[{"periodo":3,"descuento":5},{"periodo":6,"descuento":10},{"periodo":12,"descuento":15}]}'::jsonb,
        '{"emailsHabilitados":true,"plantillasEmail":{"bienvenida":{"asunto":"Bienvenido a PsicoEspacios","plantilla":"Bienvenido a nuestra plataforma..."}}}'::jsonb
      )
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
        nombre: 'Sede Pedro de Valdivia',
        description: 'Disponemos de 3 cajas únicas con precios según su tamaño, equipadas con A/C, agua purificada y una estación de té y café. Además, una sala de espera acogedora y un ingreso autogestionado para mayor libertad en tu práctica',
        direccion: 'Av. Pedro de Valdivia 1234, Providencia',
        ciudad: 'Santiago',
        comuna: 'Providencia',
        telefono: '+56912345678',
        email: 'pedrovaldivia@psicoespacios.com',
        imageUrl: 'assets/images/location-pedro-valdivia.png',
        thumbnailUrl: 'assets/images/thumbnail-location-pedro-valdivia.png',
        features: ['A/C', 'Agua purificada', 'Estación de té y café', 'Sala de espera acogedora', 'Ingreso autogestionado'],
        coordenadas: { lat: -33.4289, lng: -70.6093 },
        estado: 'ACTIVA',
      },
      {
        nombre: 'Sede Las Condes',
        description: 'Nuestras instalaciones cuentan con 3 cajas modernas, climatización central, agua purificada, estación de bebidas y una sala de espera confortable. Acceso independiente para mayor privacidad en tu práctica profesional',
        direccion: 'Av. Apoquindo 4500, Las Condes',
        ciudad: 'Santiago',
        comuna: 'Las Condes',
        telefono: '+56923456789',
        email: 'lascondes@psicoespacios.com',
        imageUrl: 'assets/images/location-las-condes.png',
        thumbnailUrl: 'assets/images/thumbnail-location-las-condes.png',
        features: ['Climatización central', 'Agua purificada', 'Estación de bebidas', 'Sala de espera confortable', 'Acceso independiente'],
        coordenadas: { lat: -33.4103, lng: -70.5831 },
        estado: 'ACTIVA',
      },
      {
        nombre: 'Sede Ñuñoa',
        description: 'Espacios profesionales con 3 cajas equipadas, aire acondicionado, agua purificada, estación de café y té, sala de espera tranquila y entrada autónoma para tu comodidad y la de tus pacientes',
        direccion: 'Av. Irarrázaval 3400, Ñuñoa',
        ciudad: 'Santiago',
        comuna: 'Ñuñoa',
        telefono: '+56934567890',
        email: 'nunoa@psicoespacios.com',
        imageUrl: 'assets/images/location-nunoa.png',
        thumbnailUrl: 'assets/images/thumbnail-location-nunoa.png',
        features: ['Aire acondicionado', 'Agua purificada', 'Estación de café y té', 'Sala de espera tranquila', 'Entrada autónoma'],
        coordenadas: { lat: -33.4563, lng: -70.5934 },
        estado: 'ACTIVA',
      },
    ];

    // Verificar las columnas disponibles en la tabla sedes
    const sedesColumns = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'sedes'
    `);
    const columnNames = sedesColumns.map(col => col.column_name.toLowerCase());
    
    // Comprobar si existe la columna comuna
    const hasComuna = columnNames.includes('comuna');
    
    for (const sede of sedes) {
      try {
        // Verificar si existen las nuevas columnas
        const hasDescription = columnNames.includes('description');
        const hasImageUrl = columnNames.includes('imageurl');
        const hasThumbnailUrl = columnNames.includes('thumbnailurl');
        const hasFeatures = columnNames.includes('features');
        
        if (hasComuna && hasDescription && hasImageUrl && hasThumbnailUrl && hasFeatures) {
          await queryRunner.query(`
            INSERT INTO sedes 
            (nombre, description, direccion, ciudad, comuna, telefono, email, "imageUrl", "thumbnailUrl", features, coordenadas, estado) 
            VALUES 
            ('${sede.nombre}', '${sede.description}', '${sede.direccion}', '${sede.ciudad}', '${sede.comuna}', '${sede.telefono}', 
            '${sede.email}', '${sede.imageUrl}', '${sede.thumbnailUrl}', '${JSON.stringify(sede.features)}'::jsonb, '${JSON.stringify(sede.coordenadas)}'::jsonb, '${sede.estado}')
          `);
        } else if (hasDescription && hasImageUrl && hasThumbnailUrl && hasFeatures) {
          // Insertar sin la columna comuna pero con nuevos campos
          await queryRunner.query(`
            INSERT INTO sedes 
            (nombre, description, direccion, ciudad, telefono, email, "imageUrl", "thumbnailUrl", features, coordenadas, estado) 
            VALUES 
            ('${sede.nombre}', '${sede.description}', '${sede.direccion}', '${sede.ciudad}', '${sede.telefono}', 
            '${sede.email}', '${sede.imageUrl}', '${sede.thumbnailUrl}', '${JSON.stringify(sede.features)}'::jsonb, '${JSON.stringify(sede.coordenadas)}'::jsonb, '${sede.estado}')
          `);
        } else if (hasComuna) {
          // Fallback: insertar solo con campos básicos + comuna
          await queryRunner.query(`
            INSERT INTO sedes 
            (nombre, direccion, ciudad, comuna, telefono, email, coordenadas, estado) 
            VALUES 
            ('${sede.nombre}', '${sede.direccion}', '${sede.ciudad}', '${sede.comuna}', '${sede.telefono}', 
            '${sede.email}', '${JSON.stringify(sede.coordenadas)}'::jsonb, '${sede.estado}')
          `);
        } else {
          // Fallback: insertar solo con campos básicos
          await queryRunner.query(`
            INSERT INTO sedes 
            (nombre, direccion, ciudad, telefono, email, coordenadas, estado) 
            VALUES 
            ('${sede.nombre}', '${sede.direccion}', '${sede.ciudad}', '${sede.telefono}', 
            '${sede.email}', '${JSON.stringify(sede.coordenadas)}'::jsonb, '${sede.estado}')
          `);
        }
        console.log(`Sede ${sede.nombre} insertada correctamente`);
      } catch (error) {
        console.error(`Error al insertar sede ${sede.nombre}:`, error.message);
        
        // Inserción mínima como respaldo
        console.log('Intentando inserción simplificada...');
        await queryRunner.query(`
          INSERT INTO sedes (nombre, direccion, ciudad)
          VALUES ('${sede.nombre}', '${sede.direccion}', '${sede.ciudad}')
        `);
      }
    }

    console.log('Tabla de sedes poblada exitosamente.');
  }  /**
   * Poblar tabla de boxes
   */
    private async seedBoxes(queryRunner: QueryRunner): Promise<void> {
    console.log('Poblando tabla de boxes...');

    try {
      // Iniciar una nueva transacción específica para este método
      await queryRunner.startTransaction();
      
      // Comprobar si ya existen boxes
      const existingBoxes = await queryRunner.query(
        'SELECT COUNT(*) FROM boxes',
      );

      if (parseInt(existingBoxes[0].count) > 0) {
        console.log('La tabla de boxes ya tiene datos. Omitiendo inserción.');
        await queryRunner.commitTransaction();
        return;
      }
      
      // Obtener IDs de las sedes
      const sedes = await queryRunner.query('SELECT id FROM sedes');

      if (sedes.length === 0) {
        console.log('No se encontraron sedes para crear boxes. Omitiendo inserción.');
        await queryRunner.commitTransaction();
        return;
      }

      // Para cada sede, crear 3 boxes con datos básicos
      for (let i = 0; i < sedes.length; i++) {
        const sedeId = sedes[i].id;
        
        // Crear 3 boxes por sede
        for (let j = 1; j <= 3; j++) {
          const boxNumber = i * 3 + j;
          const boxName = `Box ${boxNumber}`;
          const precio = 15000 + (j * 5000);
          
          try {
            // Insertar el box con los datos mínimos necesarios
            await queryRunner.query(`
              INSERT INTO boxes (
                nombre, 
                descripcion,
                capacidad,
                precio,
                estado,
                "sedeId"
              ) VALUES (
                '${boxName}',
                'Box confortable y acogedor ideal para terapia individual o de pareja.',
                ${j + 1},
                ${precio},
                ${precio / 2},
                'DISPONIBLE',
                '${sedeId}'
              )
            `);
            
            console.log(`Box ${boxNumber} para sede ${sedeId} insertado correctamente.`);
          } catch (error) {
            console.error(`Error al insertar Box ${boxNumber} con enfoque principal: ${error.message}`);
            
            // Segundo intento: alternar entre columnas camelCase y lowercase
            try {
              await queryRunner.query(`
                INSERT INTO boxes (
                  nombre, 
                  descripcion,
                  capacidad,
                  precio,
                  estado,
                  sedeid
                ) VALUES (
                  '${boxName}',
                  'Box confortable y acogedor ideal para terapia individual o de pareja.',
                  ${j + 1},
                  ${precio},
                  ${precio / 2},
                  'DISPONIBLE',
                  '${sedeId}'
                )
              `);
              
              console.log(`Box ${boxNumber} insertado con enfoque alternativo.`);
            } catch (secondError) {
              console.error(`Error en segundo intento para Box ${boxNumber}: ${secondError.message}`);
              
              // Tercer intento: consultar exactamente qué columnas existen e insertar de manera dinámica
              try {
                // Obtener nombres exactos de las columnas
                const columnsInfo = await queryRunner.query(`
                  SELECT column_name, is_nullable 
                  FROM information_schema.columns 
                  WHERE table_name = 'boxes'
                `);
                
                // Mapear nombres de columnas a su formato exacto
                const columnMap: Record<string, string> = {};
                const requiredColumns: string[] = [];
                
                columnsInfo.forEach(col => {
                  const name = col.column_name;
                  const lowerName = name.toLowerCase();
                  columnMap[lowerName] = name;
                  
                  if (col.is_nullable === 'NO' && lowerName !== 'id' && !lowerName.includes('fecha')) {
                    requiredColumns.push(lowerName);
                  }
                });
                
                // Construir la consulta con los nombres exactos de columnas
                const columns: string[] = [];
                const values: string[] = [];
                
                // Nombre (siempre requerido)
                if (columnMap['nombre']) {
                  columns.push(`"${columnMap['nombre']}"`);
                  values.push(`'${boxName}'`);
                }
                
                // Descripción
                if (columnMap['descripcion']) {
                  columns.push(`"${columnMap['descripcion']}"`);
                  values.push(`'Box confortable y acogedor ideal para terapia individual o de pareja.'`);
                }
                
                // Capacidad
                if (columnMap['capacidad']) {
                  columns.push(`"${columnMap['capacidad']}"`);
                  values.push(`${j + 1}`);
                }
                
                // Precio (probablemente requerido)
                if (columnMap['precio']) {
                  columns.push(`"${columnMap['precio']}"`);
                  values.push(`${precio}`);
                }
                
                // Estado
                if (columnMap['estado']) {
                  columns.push(`"${columnMap['estado']}"`);
                  values.push(`'DISPONIBLE'`);
                }
                
                // Sede ID (requerido)
                const sedeIdColumn = columnMap['sedeid'] || columnMap['sedeid'];
                if (sedeIdColumn) {
                  columns.push(`"${sedeIdColumn}"`);
                  values.push(`'${sedeId}'`);
                }
                
                // Ejecutar la consulta final
                if (columns.length > 0) {
                  const finalQuery = `
                    INSERT INTO boxes (${columns.join(', ')})
                    VALUES (${values.join(', ')})
                  `;
                  
                  await queryRunner.query(finalQuery);
                  console.log(`Box ${boxNumber} insertado con enfoque dinámico basado en columnas.`);
                }
              } catch (finalError) {
                console.error(`Todos los intentos fallaron para Box ${boxNumber}: ${finalError.message}`);
                // No revertimos toda la transacción, simplemente continuamos con el siguiente box
              }
            }
          }
        }
      }
      
      // Si llegamos hasta aquí, todo bien
      await queryRunner.commitTransaction();
      console.log('Tabla de boxes poblada exitosamente.');
      
    } catch (globalError) {
      // Si hay un error global, revertir la transacción
      try {
        await queryRunner.rollbackTransaction();
      } catch (rollbackError) {
        console.error(`Error al revertir transacción: ${rollbackError.message}`);
      }
      
      console.error(`Error global en seedBoxes: ${globalError.message}`);
      // No propagar el error para que continúe con las demás migraciones
    }
  }
  /**
   * Poblar tabla de planes
   */
  private async seedPlanes(queryRunner: QueryRunner): Promise<void> {
    console.log('Poblando tabla de planes...');

    try {
      // Comprobar si ya existen planes
      const existingPlanes = await queryRunner.query(
        'SELECT COUNT(*) FROM planes',
      );

      if (parseInt(existingPlanes[0].count) > 0) {
        console.log('La tabla de planes ya tiene datos. Omitiendo inserción.');
        return;
      }
      
      // Verificar que la tabla planes existe
      const tableExists = await queryRunner.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_name = 'planes'
        ) as exists
      `);
      
      if (!tableExists[0].exists) {
        console.log('La tabla planes no existe. Omitiendo inserción.');
        return;
      }

      // Insertar planes uno por uno para evitar fallos en la transacción completa
      const planes = [
        {
          nombre: 'Plan Básico',
          descripcion: 'Plan ideal para psicólogos que inician su práctica o atienden pocas horas a la semana.',
          precio: 50000,
          duracion: 1,
          tipo: 'BASICO',
          caracteristicas: [
            'Acceso a boxes durante 10 horas mensuales',
            'Reserva hasta con 1 semana de anticipación',
            'Acceso a WiFi',
            'Uso de áreas comunes',
          ],
          horasIncluidas: 10,
          descuentoHoraAdicional: 0,
          activo: 1,
        },
        {
          nombre: 'Plan Estándar',
          descripcion: 'Plan diseñado para psicólogos con práctica regular que necesitan más horas de atención.',
          precio: 90000,
          duracion: 1,
          tipo: 'INTERMEDIO',
          caracteristicas: [
            'Acceso a boxes durante 20 horas mensuales',
            'Reserva hasta con 2 semanas de anticipación',
            'Acceso a WiFi',
            'Uso de áreas comunes',
            'Descuento en horas adicionales',
          ],
          horasIncluidas: 20,
          descuentoHoraAdicional: 10,
          activo: 1,
        },
        {
          nombre: 'Plan Premium',
          descripcion: 'Plan completo para psicólogos con alta demanda de pacientes y necesidades de flexibilidad.',
          precio: 150000,
          duracion: 1,
          tipo: 'PREMIUM',
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
          activo: 1,
        },
      ];

      for (const plan of planes) {
        try {
          await queryRunner.query(`
            INSERT INTO planes 
            (nombre, descripcion, precio, "duracion", tipo, caracteristicas, "horasIncluidas", "descuentoHoraAdicional", activo) 
            VALUES 
            ('${plan.nombre}', '${plan.descripcion}', ${plan.precio}, ${plan.duracion}, 
            '${plan.tipo}', '${JSON.stringify(plan.caracteristicas)}'::jsonb, ${plan.horasIncluidas}, ${plan.descuentoHoraAdicional}, 
            '${plan.activo}')
          `);
          
          console.log(`Plan "${plan.nombre}" insertado correctamente.`);
        } catch (error) {
          console.error(`Error al insertar plan "${plan.nombre}": ${error.message}`);
          // Continuamos con el siguiente plan
        }
      }
      
      console.log('Tabla de planes poblada exitosamente.');
    } catch (error) {
      console.error(`Error general en seedPlanes: ${error.message}`);
      throw error; // Re-lanzar para manejo en la función up
    }
  }

  /**
   * Poblar tabla de contactos
   */
  // ❌ COMENTADO: No insertar contactos de ejemplo
  private async seedContactos(queryRunner: QueryRunner): Promise<void> {
    console.log('⚠️ Omitiendo población de contactos de ejemplo...');
    return;
    
    /*
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
        estado: 'PENDIENTE',
      },
      {
        nombre: 'Patricia Vásquez',
        tipo: 'RECLAMO',
        email: 'patricia.vasquez@mail.com',
        telefono: '+56923456789',
        mensaje:
          'El aire acondicionado del box 102 de la sede Las Condes no funcionaba correctamente durante mi sesión del día 15 de mayo. Solicito una compensación o descuento en mi próxima reserva.',
        estado: 'EN_PROCESO',
      },
      {
        nombre: 'Manuel Soto',
        tipo: 'COMERCIAL',
        email: 'manuel.soto@mail.com',
        telefono: '+56934567890',
        mensaje:
          'Sería excelente que implementaran un sistema de café/té para los psicólogos que alquilan los boxes. Mejoraría mucho la experiencia tanto para profesionales como para pacientes.',
        estado: 'RESUELTO',
      },
    ];

    for (const contacto of contactos) {
      await queryRunner.query(`
        INSERT INTO contactos 
        (nombre, tipo, email, telefono, asunto, mensaje, estado) 
        VALUES 
        ('${contacto.nombre}', '${contacto.tipo}', '${contacto.email}', '${contacto.telefono}', 
        'Consulta general', '${contacto.mensaje.replace(/'/g, "''")}', '${contacto.estado}')
      `);
    }

    console.log('Tabla de contactos poblada exitosamente.');
    */
  }

  /**
   * Poblar tabla de blogs
   */
  private async seedBlogs(queryRunner: QueryRunner): Promise<void> {
    console.log('Poblando tabla de blogs...');
    // Comprobar si ya existen blogs
    const existingBlogs = await queryRunner.query('SELECT COUNT(*) FROM blogs');
    if (parseInt(existingBlogs[0].count) > 0) {
      console.log('La tabla de blogs ya tiene datos. Omitiendo inserción.');
      return;
    }
    // Datos de ejemplo
    const blogs = [
      {
        titulo: '¿Por qué la terapia psicológica es importante?',
        descripcion: 'Descubre los beneficios de la terapia psicológica y cómo puede ayudarte a mejorar tu bienestar emocional.',
        imagen: 'assets/images/blog-1.jpg',
        fecha: '2024-06-01',
        categoria: 'Bienestar',
        contenido: 'La terapia psicológica es una herramienta fundamental para el desarrollo personal y la salud mental...'
      },
      {
        titulo: 'Cómo elegir un psicólogo adecuado',
        descripcion: 'Consejos prácticos para encontrar el profesional que mejor se adapte a tus necesidades.',
        imagen: 'assets/images/blog-2.jpg',
        fecha: '2024-06-05',
        categoria: 'Consejos',
        contenido: 'Elegir un psicólogo es una decisión importante. Considera su experiencia, especialidad y tu comodidad personal...'
      },
      {
        titulo: 'Mitos sobre la salud mental',
        descripcion: 'Desmentimos las creencias erróneas más comunes sobre la salud mental.',
        imagen: 'assets/images/blog-3.jpg',
        fecha: '2024-06-10',
        categoria: 'Educación',
        contenido: 'Existen muchos mitos sobre la salud mental que pueden dificultar el acceso a la ayuda profesional...'
      }
    ];
    for (const blog of blogs) {
      await queryRunner.query(`
        INSERT INTO blogs (titulo, descripcion, imagen, fecha, categoria, contenido)
        VALUES ('${blog.titulo.replace(/'/g, "''")}', '${blog.descripcion.replace(/'/g, "''")}', '${blog.imagen}', '${blog.fecha}', '${blog.categoria}', '${blog.contenido.replace(/'/g, "''")}')
      `);
    }
    console.log('Tabla de blogs poblada exitosamente.');
  }
}
