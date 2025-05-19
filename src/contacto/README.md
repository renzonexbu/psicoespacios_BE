# 📞 Módulo de Contacto

Este módulo implementa la funcionalidad de formulario de contacto para PsicoEspacios, permitiendo a los usuarios enviar mensajes, consultas, reclamos o sugerencias a través de la plataforma.

## 📋 Características

- Creación de mensajes de contacto con diferentes tipos (consulta, reclamo, sugerencia, etc.)
- Gestión del estado de los mensajes (nueva, vista, solucionada)
- Endpoints protegidos para administradores
- Endpoint público para la creación de contactos

## 🏗️ Estructura

- **Entidad**: `Contacto`
- **DTOs**: 
  - `CreateContactoDto` - Datos para crear un nuevo contacto
  - `UpdateContactoDto` - Datos para actualizar un contacto existente
- **Servicios**: `ContactoService`
- **Controlador**: `ContactoController`

## 📝 Campos de la Entidad Contacto

| Campo       | Tipo       | Descripción                                       |
|-------------|------------|---------------------------------------------------|
| id          | UUID       | Identificador único del contacto                  |
| nombre      | string     | Nombre de la persona que realiza el contacto      |
| tipo        | enum       | Tipo de contacto (CONSULTA, RECLAMO, SUGERENCIA, OTRO) |
| email       | string     | Correo electrónico de contacto                    |
| telefono    | string     | Número telefónico (opcional)                      |
| mensaje     | text       | Contenido del mensaje de contacto                 |
| fecha       | Date       | Fecha y hora de creación del contacto             |
| estado      | enum       | Estado del contacto (NUEVA, VISTA, SOLUCIONADA)   |

## 🔄 Flujo de Trabajo

1. **Usuario** completa el formulario de contacto (sin autenticación requerida)
2. **Sistema** registra el contacto con estado inicial "NUEVA"
3. **Administrador** puede ver, actualizar el estado o eliminar contactos
4. El estado puede cambiarse de "NUEVA" a "VISTA" y luego a "SOLUCIONADA"

## 🌐 Endpoints

### Públicos

- `POST /api/v1/contacto` - Crear un nuevo contacto

### Protegidos (requieren rol ADMIN)

- `GET /api/v1/contacto` - Obtener todos los contactos
- `GET /api/v1/contacto/:id` - Obtener un contacto específico
- `PUT /api/v1/contacto/:id` - Actualizar un contacto
- `DELETE /api/v1/contacto/:id` - Eliminar un contacto

## 📦 Ejemplos de uso

### Crear un contacto

```bash
curl -X POST http://localhost:3000/api/v1/contacto \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Juan Pérez",
    "tipo": "CONSULTA",
    "email": "juan@ejemplo.com",
    "telefono": "+56912345678",
    "mensaje": "Me gustaría obtener más información sobre los servicios"
  }'
```

### Actualizar estado de un contacto (requiere autenticación como ADMIN)

```bash
curl -X PUT http://localhost:3000/api/v1/contacto/[ID] \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [TOKEN]" \
  -d '{
    "estado": "VISTA"
  }'
```

## 🔒 Seguridad

- La creación de contactos es pública para permitir a cualquier usuario enviar mensajes
- Los endpoints de gestión están protegidos con autenticación JWT y rol ADMIN
- Se implementa validación de datos para todos los campos
