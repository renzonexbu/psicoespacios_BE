# Sistema de Subroles para Psicólogos

## Descripción

Se ha implementado un sistema de subroles para psicólogos que requiere aprobación administrativa antes de que puedan acceder al sistema. Los psicólogos nuevos quedan en estado pendiente hasta que un administrador les asigne un subrol específico.

## Subroles Disponibles

- **ADB**: Psicólogo con subrol ADB
- **CDD**: Psicólogo con subrol CDD  
- **AMBOS**: Psicólogo con ambos subroles

## Flujo de Registro

1. **Registro de Psicólogo**: Los psicólogos se registran normalmente pero quedan con estado `PENDIENTE` y sin subrol asignado
2. **Bloqueo de Acceso**: Los psicólogos sin subrol no pueden hacer login al sistema
3. **Asignación de Subrol**: Un administrador debe asignar un subrol para activar la cuenta
4. **Activación**: Una vez asignado el subrol, el estado cambia a `ACTIVO` y el psicólogo puede acceder

## Endpoints Implementados

### 1. Asignar Subrol a Psicólogo

**POST** `/api/v1/auth/assign-subrol`

**Autenticación**: Requerida (JWT Bearer Token)  
**Roles**: Solo ADMIN

#### Headers
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

#### Body
```json
{
  "userId": "uuid-del-psicologo",
  "subrol": "ADB" | "CDD" | "AMBOS"
}
```

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "message": "Subrol asignado exitosamente",
  "user": {
    "id": "uuid-del-psicologo",
    "email": "psicologo@example.com",
    "nombre": "Juan",
    "apellido": "Psicólogo",
    "role": "PSICOLOGO",
    "estado": "ACTIVO",
    "subrol": "ADB"
  }
}
```

### 2. Obtener Psicólogos Pendientes

**GET** `/api/v1/auth/pending-psychologists`

**Autenticación**: Requerida (JWT Bearer Token)  
**Roles**: Solo ADMIN

#### Headers
```
Authorization: Bearer {jwt_token}
```

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "count": 2,
  "psychologists": [
    {
      "id": "uuid-del-psicologo-1",
      "email": "psicologo1@example.com",
      "nombre": "Juan",
      "apellido": "Psicólogo",
      "rut": "12.345.678-9",
      "telefono": "+56912345678",
      "fechaNacimiento": "1990-01-01",
      "especialidad": "Psicología Clínica",
      "numeroRegistroProfesional": "PSI-12345",
      "experiencia": "5 años de experiencia",
      "estado": "PENDIENTE",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

## Cambios en la Base de Datos

### Nueva Columna en Tabla `users`
```sql
ALTER TABLE "users" 
ADD COLUMN "subrol" subrol_psicologo_enum;
```

### Nuevo Tipo Enum
```sql
CREATE TYPE subrol_psicologo_enum AS ENUM ('ADB', 'CDD', 'AMBOS');
```

### Índice para Performance
```sql
CREATE INDEX "IDX_users_subrol" ON "users" ("subrol");
```

## Validaciones Implementadas

### 1. Login de Psicólogos
- Los psicólogos sin subrol no pueden hacer login
- Mensaje de error: "Tu cuenta de psicólogo está pendiente de aprobación. Un administrador debe asignarte un subrol para poder acceder al sistema."

### 2. Asignación de Subrol
- Solo administradores pueden asignar subroles
- Solo se puede asignar a usuarios con rol PSICOLOGO
- Al asignar subrol, el estado cambia automáticamente a ACTIVO

### 3. JWT Token
- El subrol se incluye en el payload del JWT
- Disponible en `req.user.subrol` en todos los endpoints

## Ejemplo de Uso

### 1. Registrar Psicólogo
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nuevo.psicologo@example.com",
    "password": "password123",
    "nombre": "María",
    "apellido": "González",
    "rut": "98.765.432-1",
    "telefono": "+56987654321",
    "fechaNacimiento": "1985-05-20",
    "role": "PSICOLOGO"
  }'
```

### 2. Login como Admin
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@psicoespacios.com",
    "password": "admin123"
  }'
```

### 3. Ver Psicólogos Pendientes
```bash
curl -X GET http://localhost:3000/api/v1/auth/pending-psychologists \
  -H "Authorization: Bearer {admin_token}"
```

### 4. Asignar Subrol
```bash
curl -X POST http://localhost:3000/api/v1/auth/assign-subrol \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "uuid-del-psicologo",
    "subrol": "ADB"
  }'
```

## Migración

Para aplicar los cambios a la base de datos, ejecutar:

```bash
npm run migration:run
```

O manualmente:

```sql
-- Crear el tipo enum
CREATE TYPE subrol_psicologo_enum AS ENUM ('ADB', 'CDD', 'AMBOS');

-- Agregar la columna
ALTER TABLE "users" ADD COLUMN "subrol" subrol_psicologo_enum;

-- Crear índice
CREATE INDEX "IDX_users_subrol" ON "users" ("subrol");
```

## Testing

Se incluye un script de prueba `test-subrol-psicologo.js` que verifica:

1. Registro de psicólogo nuevo
2. Bloqueo de login sin subrol
3. Login como admin
4. Listado de psicólogos pendientes
5. Asignación de subrol
6. Login exitoso con subrol
7. Verificación de que ya no aparece en pendientes
8. Cambio de subrol

Para ejecutar las pruebas:

```bash
node test-subrol-psicologo.js
```








