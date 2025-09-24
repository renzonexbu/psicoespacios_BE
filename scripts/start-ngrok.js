const ngrok = require('ngrok');
const fs = require('fs');
const path = require('path');

async function startNgrok() {
  try {
    console.log('🚀 Iniciando ngrok...');
    
    // Iniciar ngrok en el puerto 3000
    const url = await ngrok.connect({
      addr: 3000,
      authtoken: process.env.NGROK_AUTH_TOKEN // Opcional, pero recomendado
    });
    
    console.log('✅ ngrok iniciado exitosamente!');
    console.log(`🌐 URL pública: ${url}`);
    console.log(`📡 URL de callback para Flow: ${url}/api/v1/flow/confirm`);
    
    // Crear archivo con las URLs para copiar fácilmente
    const configData = {
      ngrokUrl: url,
      callbackUrl: `${url}/api/v1/flow/confirm`,
      frontendUrl: `${url.replace('https://', 'http://')}`,
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync(
      path.join(__dirname, '../ngrok-config.json'), 
      JSON.stringify(configData, null, 2)
    );
    
    console.log('\n📋 Configuración guardada en: ngrok-config.json');
    console.log('\n🔧 Variables de entorno para tu .env:');
    console.log(`API_URL=${url}`);
    console.log(`FRONT_URL=${url.replace('https://', 'http://')}`);
    
    console.log('\n📝 Para configurar en Flow:');
    console.log(`URL de confirmación: ${url}/api/v1/flow/confirm`);
    console.log(`URL de retorno: ${url.replace('https://', 'http://')}/pago-exitoso`);
    
    console.log('\n⚠️  IMPORTANTE:');
    console.log('- Cada vez que reinicies ngrok, la URL cambiará');
    console.log('- Actualiza las URLs en Flow después de cada reinicio');
    console.log('- Mantén esta terminal abierta mientras pruebas');
    
    // Manejar cierre de ngrok
    process.on('SIGINT', async () => {
      console.log('\n🛑 Cerrando ngrok...');
      await ngrok.kill();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Error al iniciar ngrok:', error.message);
    process.exit(1);
  }
}

startNgrok(); 