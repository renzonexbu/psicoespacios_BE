# Endpoints Públicos - Guía de Implementación

## Descripción General

Los endpoints públicos son aquellos que no requieren autenticación (JWT token) y están diseñados para mostrar información que debe ser accesible sin que el usuario esté logueado.

## Patrón de Implementación

### 1. Estructura de Controladores

Para manejar endpoints públicos, se recomienda:

- **Remover el guard de autenticación del controlador**: No usar `@UseGuards(JwtAuthGuard)` a nivel de controlador
- **Aplicar guards por método**: Usar `@UseGuards(JwtAuthGuard)` solo en los métodos que requieren autenticación
- **Crear endpoints públicos con prefijo**: Usar rutas como `/public` para diferenciar

### 2. Ejemplo de Implementación

```typescript
@Controller('api/v1/sedes')
export class SedesController {
  
  // Endpoint público - sin autenticación
  @Get('public')
  async findAllPublic() {
    return this.sedesService.findAllPublic();
  }

  // Endpoint privado - requiere autenticación
  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll() {
    return this.sedesService.findAll();
  }
}
```

### 3. DTOs para Respuestas Públicas

Crear DTOs específicos para respuestas públicas que excluyan información sensible:

```typescript
export class SedePublicDto {
  id: string;
  nombre: string;
  description: string;
  direccion: string;
  telefono?: string;
  email?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  features?: string[];
  horarioAtencion?: HorarioAtencion;
  serviciosDisponibles?: string[];
  estado: string;
  // NO incluir: boxes, timestamps, datos internos
}
```

## Endpoints Públicos Implementados

### Sedes

- `GET /api/v1/sedes/public` - Lista todas las sedes activas (información pública)
- `GET /api/v1/sedes/public/:id` - Obtiene una sede específica (información pública)

### Planes de Suscripción

- `GET /api/v1/gestion/planes/public` - Lista todos los planes activos (información pública)
- `GET /api/v1/gestion/planes/public/:id` - Obtiene un plan específico (información pública)

### Psicólogos

- `GET /psicologos/public` - Lista todos los psicólogos activos (información pública)
- `GET /psicologos/public/:id` - Obtiene un psicólogo específico (información pública)

### Autenticación

- `POST /api/v1/auth/login` - Login de usuario
- `POST /api/v1/auth/register` - Registro de usuario
- `POST /api/v1/auth/logout` - Logout de usuario

## Consideraciones de Seguridad

### Información que SÍ se puede exponer públicamente:

- Información de contacto básica (nombre, dirección, teléfono, email)
- Horarios de atención
- Servicios disponibles
- Imágenes y recursos visuales
- Estado de disponibilidad general
- **Planes de suscripción** (precios, beneficios, duración)
- **Información de sedes** (ubicación, servicios)
- **Perfiles de psicólogos** (nombre, especialidad, experiencia, precios)

### Información que NO se debe exponer públicamente:

- Datos de reservas específicas
- Información de usuarios
- Datos de pagos
- Información interna del sistema
- Timestamps de creación/actualización
- Relaciones con otras entidades sensibles
- **Suscripciones específicas de usuarios**
- **Datos de transacciones**
- **Datos personales sensibles** (RUT, teléfono, fecha de nacimiento, dirección)

## Mejores Prácticas

1. **Validación de datos**: Mantener validaciones en endpoints públicos
2. **Rate limiting**: Implementar límites de velocidad para endpoints públicos
3. **Caching**: Considerar cache para información pública que no cambia frecuentemente
4. **Documentación**: Documentar claramente qué información se expone públicamente
5. **Monitoreo**: Monitorear el uso de endpoints públicos para detectar abusos

## Ejemplo de Uso

```bash
# Endpoint público - no requiere token
curl -X GET http://localhost:3000/api/v1/sedes/public
curl -X GET http://localhost:3000/api/v1/gestion/planes/public
curl -X GET http://localhost:3000/psicologos/public

# Endpoint privado - requiere token
curl -X GET http://localhost:3000/api/v1/sedes \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
curl -X GET http://localhost:3000/api/v1/gestion/planes \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
curl -X GET http://localhost:3000/psicologos \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Extensión para Otros Módulos

Para implementar endpoints públicos en otros módulos, seguir el mismo patrón:

1. Crear métodos en el servicio con sufijo `Public`
2. Crear DTOs específicos para respuestas públicas
3. Agregar rutas con prefijo `/public`
4. Aplicar guards solo en métodos privados
5. Documentar las diferencias entre endpoints públicos y privados

## Casos de Uso Comunes

### Información de Catálogo
- **Planes de suscripción**: Para que usuarios vean opciones antes de registrarse
- **Sedes disponibles**: Para mostrar ubicaciones y servicios
- **Servicios ofrecidos**: Para informar sobre capacidades del sistema
- **Psicólogos disponibles**: Para mostrar profesionales disponibles

### Información de Contacto
- **Datos de contacto**: Para facilitar comunicación
- **Horarios de atención**: Para planificar visitas
- **Ubicaciones**: Para navegación y planificación

### Información de Marketing
- **Beneficios de planes**: Para atraer nuevos usuarios
- **Imágenes y recursos**: Para presentación visual
- **Testimonios públicos**: Para generar confianza
- **Perfiles profesionales**: Para mostrar experiencia y especialidades 