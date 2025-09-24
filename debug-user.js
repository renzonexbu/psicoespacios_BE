require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_DATABASE || 'psicoespacios',
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

async function debugUser() {
  const userId = 'a1129fd3-5456-49e4-a11f-96563a8aacc2';
  
  try {
    console.log('🔍 Debuggeando usuario:', userId);
    console.log('🔧 Configuración DB:', {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_DATABASE,
      user: process.env.DB_USERNAME
    });
    
    // 1. Verificar si existe en la tabla users
    const userQuery = await pool.query(
      'SELECT id, email, role, estado FROM users WHERE id = $1',
      [userId]
    );
    
    if (userQuery.rows.length === 0) {
      console.log('❌ Usuario no encontrado en tabla users');
      return;
    }
    
    const user = userQuery.rows[0];
    console.log('✅ Usuario encontrado en users:', {
      id: user.id,
      email: user.email,
      role: user.role,
      estado: user.estado
    });
    
    // 2. Verificar si existe en la tabla psicologo
    const psicologoQuery = await pool.query(
      'SELECT id, usuario_id FROM psicologo WHERE usuario_id = $1',
      [userId]
    );
    
    if (psicologoQuery.rows.length === 0) {
      console.log('❌ Usuario no encontrado en tabla psicologo');
      console.log('💡 Necesitas crear un registro en la tabla psicologo para este usuario');
      return;
    }
    
    const psicologo = psicologoQuery.rows[0];
    console.log('✅ Usuario encontrado en psicologo:', {
      id: psicologo.id,
      usuario_id: psicologo.usuario_id
    });
    
    // 3. Verificar si la tabla documento_psicologo existe
    const tableExistsQuery = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'documento_psicologo'
      );
    `);
    
    console.log('📋 Tabla documento_psicologo existe:', tableExistsQuery.rows[0].exists);
    
    if (tableExistsQuery.rows[0].exists) {
      // 4. Verificar estructura de la tabla
      const structureQuery = await pool.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'documento_psicologo' 
        ORDER BY ordinal_position;
      `);
      
      console.log('🏗️ Estructura de documento_psicologo:');
      structureQuery.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

debugUser(); 