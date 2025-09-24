const { DataSource } = require('typeorm');
const { config } = require('dotenv');

// Cargar variables de entorno
config();

// Configuración de la base de datos
const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'psicoespacios',
  synchronize: false,
  logging: true,
});

async function runMigration() {
  try {
    console.log('🚀 Conectando a la base de datos...');
    await dataSource.initialize();
    console.log('✅ Conexión exitosa');

    // Verificar si la tabla notas existe
    const tableExists = await dataSource.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'notas'
      );
    `);

    if (tableExists[0].exists) {
      console.log('📋 Tabla notas ya existe, verificando estructura...');
      
      // Verificar columnas existentes
      const columns = await dataSource.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'notas'
        ORDER BY ordinal_position;
      `);

      console.log('📊 Columnas actuales en la tabla notas:');
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
      });

      // Verificar si falta la columna es_privada
      const hasEsPrivada = columns.some(col => col.column_name === 'es_privada');
      
      if (!hasEsPrivada) {
        console.log('⚠️ Columna es_privada no existe, agregándola...');
        
        await dataSource.query(`
          ALTER TABLE "notas" 
          ADD COLUMN "es_privada" boolean NOT NULL DEFAULT false;
        `);
        
        console.log('✅ Columna es_privada agregada exitosamente');
      } else {
        console.log('✅ Columna es_privada ya existe');
      }

      // Verificar si falta la columna metadatos
      const hasMetadatos = columns.some(col => col.column_name === 'metadatos');
      
      if (!hasMetadatos) {
        console.log('⚠️ Columna metadatos no existe, agregándola...');
        
        await dataSource.query(`
          ALTER TABLE "notas" 
          ADD COLUMN "metadatos" jsonb;
        `);
        
        console.log('✅ Columna metadatos agregada exitosamente');
      } else {
        console.log('✅ Columna metadatos ya existe');
      }

      // Verificar si falta la columna tipo
      const hasTipo = columns.some(col => col.column_name === 'tipo');
      
      if (!hasTipo) {
        console.log('⚠️ Columna tipo no existe, agregándola...');
        
        // Crear el enum si no existe
        const enumExists = await dataSource.query(`
          SELECT EXISTS (
            SELECT FROM pg_type 
            WHERE typname = 'tipo_nota_enum'
          );
        `);
        
        if (!enumExists[0].exists) {
          console.log('📝 Creando enum tipo_nota_enum...');
          await dataSource.query(`
            CREATE TYPE "public"."tipo_nota_enum" AS ENUM(
              'sesion',
              'evaluacion', 
              'observacion',
              'plan_tratamiento',
              'progreso',
              'otro'
            );
          `);
          console.log('✅ Enum tipo_nota_enum creado');
        }
        
        await dataSource.query(`
          ALTER TABLE "notas" 
          ADD COLUMN "tipo" "public"."tipo_nota_enum" NOT NULL DEFAULT 'otro';
        `);
        
        console.log('✅ Columna tipo agregada exitosamente');
      } else {
        console.log('✅ Columna tipo ya existe');
      }

    } else {
      console.log('📋 Tabla notas no existe, creándola...');
      
      // Crear el enum
      console.log('📝 Creando enum tipo_nota_enum...');
      await dataSource.query(`
        CREATE TYPE "public"."tipo_nota_enum" AS ENUM(
          'sesion',
          'evaluacion', 
          'observacion',
          'plan_tratamiento',
          'progreso',
          'otro'
        );
      `);
      console.log('✅ Enum tipo_nota_enum creado');

      // Crear la tabla
      await dataSource.query(`
        CREATE TABLE "notas" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "psicologo_id" uuid NOT NULL,
          "paciente_id" uuid NOT NULL,
          "contenido" text NOT NULL,
          "titulo" character varying(255),
          "tipo" "public"."tipo_nota_enum" NOT NULL DEFAULT 'otro',
          "es_privada" boolean NOT NULL DEFAULT false,
          "metadatos" jsonb,
          "created_at" TIMESTAMP NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_notas_id" PRIMARY KEY ("id")
        );
      `);
      console.log('✅ Tabla notas creada exitosamente');

      // Agregar foreign keys
      await dataSource.query(`
        ALTER TABLE "notas" 
        ADD CONSTRAINT "FK_notas_psicologo" 
        FOREIGN KEY ("psicologo_id") 
        REFERENCES "users"("id") 
        ON DELETE CASCADE ON UPDATE NO ACTION
      `);
      console.log('✅ Foreign key para psicologo agregado');

      await dataSource.query(`
        ALTER TABLE "notas" 
        ADD CONSTRAINT "FK_notas_paciente" 
        FOREIGN KEY ("paciente_id") 
        REFERENCES "users"("id") 
        ON DELETE CASCADE ON UPDATE NO ACTION
      `);
      console.log('✅ Foreign key para paciente agregado');

      // Crear índices
      await dataSource.query(`CREATE INDEX "IDX_notas_psicologo_id" ON "notas" ("psicologo_id")`);
      await dataSource.query(`CREATE INDEX "IDX_notas_paciente_id" ON "notas" ("paciente_id")`);
      await dataSource.query(`CREATE INDEX "IDX_notas_tipo" ON "notas" ("tipo")`);
      await dataSource.query(`CREATE INDEX "IDX_notas_created_at" ON "notas" ("created_at")`);
      console.log('✅ Índices creados exitosamente');
    }

    // Verificar estructura final
    console.log('\n🔍 Verificando estructura final de la tabla notas...');
    const finalColumns = await dataSource.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'notas'
      ORDER BY ordinal_position;
    `);

    console.log('📊 Estructura final de la tabla notas:');
    finalColumns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });

    console.log('\n🎉 Migración completada exitosamente!');

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('🔌 Conexión cerrada');
    }
  }
}

// Ejecutar migración
runMigration().catch(console.error); 