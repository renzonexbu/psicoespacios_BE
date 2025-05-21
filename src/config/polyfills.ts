/**
 * Polyfill para crypto.randomUUID() en versiones de Node.js anteriores a 20
 * 
 * Este archivo proporciona compatibilidad con versiones anteriores para el método randomUUID
 * que se utiliza en NestJS 11+ pero no está disponible globalmente en Node.js 18 y anteriores.
 */

// Solo aplicar el polyfill si no existe crypto.randomUUID
if (typeof globalThis.crypto?.randomUUID !== 'function') {
  console.log('Aplicando polyfill para crypto.randomUUID');
  
  // Importar el módulo crypto de Node.js
  const nodeCrypto = require('crypto');
  
  // Si no existe randomUUID en el módulo crypto, añadirlo
  if (typeof nodeCrypto.randomUUID !== 'function') {
    console.warn('crypto.randomUUID no está disponible, usando una implementación alternativa');
    
    // Implementación básica usando crypto.randomBytes
    nodeCrypto.randomUUID = function() {
      const bytes = nodeCrypto.randomBytes(16);
      
      // Ajustar según RFC4122 para UUIDv4
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;
      
      // Convertir a formato UUID
      const uuidChars = bytes.toString('hex').match(/(.{8})(.{4})(.{4})(.{4})(.{12})/);
      if (!uuidChars) {
        throw new Error('Error al generar UUID');
      }
      return `${uuidChars[1]}-${uuidChars[2]}-${uuidChars[3]}-${uuidChars[4]}-${uuidChars[5]}`;
    };
  }
  
  // Hacer disponible crypto globalmente si no lo está
  if (!globalThis.crypto) {
    globalThis.crypto = nodeCrypto;
  } else if (!globalThis.crypto.randomUUID) {
    globalThis.crypto.randomUUID = nodeCrypto.randomUUID;
  }
}
