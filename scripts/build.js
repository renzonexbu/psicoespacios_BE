const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Ejecutar el build de NestJS
console.log('Building NestJS application...');
execSync('nest build', { stdio: 'inherit' });

// Eliminar archivos innecesarios del dist
console.log('Cleaning up dist folder...');
const distPath = path.join(__dirname, 'dist');

function cleanDir(dirPath) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      cleanDir(filePath);
    } else {
      // Eliminar archivos de test y archivos de mapa
      if (
        file.includes('.spec.') ||
        file.includes('.test.') ||
        file.endsWith('.map')
      ) {
        fs.unlinkSync(filePath);
      }
    }
  });
}

cleanDir(distPath);

// Copiar solo los archivos necesarios de node_modules
console.log('Optimizing node_modules...');
const necessaryModules = [
  '@nestjs',
  'typescript',
  'reflect-metadata',
  'rxjs',
  'typeorm',
  'pg',
  'class-transformer',
  'class-validator',
  'passport',
  'bcrypt',
  'jsonwebtoken',
];

console.log('Build completed successfully!');
