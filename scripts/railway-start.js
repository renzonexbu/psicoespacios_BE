/**
 * Script para iniciar la aplicación en Railway después de la compilación
 */

const { execSync } = require('child_process');

try {
  // Verificar la estructura de directorios
  console.log('Verificando estructura de directorios...');
  execSync('ls -la', { stdio: 'inherit' });

  // Verificar si ya existe un directorio dist
  const fs = require('fs');
  const hasDistDir = fs.existsSync('./dist');

  if (hasDistDir) {
    console.log('Directorio dist encontrado, usando la compilación existente');
    console.log('Contenido del directorio dist:');
    execSync('ls -la dist', { stdio: 'inherit' });
  } else {
    console.log('No existe el directorio dist, compilando la aplicación...');
    console.log('Contenido del directorio src:');
    execSync('ls -la src', { stdio: 'inherit' });

    // Compilar la aplicación sin usar postbuild
    console.log('Compilando la aplicación...');
    execSync('npx nest build', { stdio: 'inherit' });

    console.log('Verificando el directorio dist después de la compilación:');
    execSync('ls -la dist', { stdio: 'inherit' });
  }

  // Iniciar la aplicación
  console.log('Iniciando la aplicación...');

  // Verificar versión de Node.js
  console.log('Versión de Node.js:', process.version);

  // Verificar variables de entorno importantes
  console.log('Validando variables de entorno...');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('DATABASE_URL configurada:', !!process.env.DATABASE_URL);

  // Determinar el punto de entrada
  try {
    console.log('Buscando puntos de entrada posibles...');
    const possibleEntries = ['./dist/main.js', './dist/src/main.js'];

    let entryFound = false;

    for (const entry of possibleEntries) {
      if (require('fs').existsSync(entry)) {
        console.log(`Usando ${entry} como punto de entrada`);
        entryFound = true;
        execSync(`node ${entry}`, { stdio: 'inherit' });
        break;
      }
    }

    if (!entryFound) {
      console.error(
        'No se pudo encontrar el punto de entrada de la aplicación',
      );
      console.log('Contenido del directorio raíz:');
      execSync('find . -type f -name "main.js" | grep -v node_modules', {
        stdio: 'inherit',
      });
      process.exit(1);
    }
  } catch (entryError) {
    console.error('Error al ejecutar el punto de entrada:', entryError);
    process.exit(1);
  }
} catch (error) {
  console.error('Error durante el inicio de la aplicación:', error);
  process.exit(1);
}
