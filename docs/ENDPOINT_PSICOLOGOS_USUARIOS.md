# Endpoint de Usuarios Psicólogos

## Descripción

Se ha implementado un endpoint específico para obtener todos los usuarios con rol de psicólogo, incluyendo información de subrol y estado de aprobación.

## Endpoint

### **GET /api/v1/users/admin/psychologists**

**URL**: `{{base_url}}/api/v1/users/admin/psychologists`

**Método**: `GET`

**Autenticación**: Requerida (JWT Bearer Token)

**Roles**: Solo ADMIN

## Headers Requeridos

```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

## Respuesta Exitosa

### **Status Code**: `200 OK`

### **Estructura de Respuesta**:
```json
[
  {
    "id": "uuid-del-psicologo",
    "email": "psicologo@ejemplo.com",
    "nombre": "Juan",
    "apellido": "Psicólogo",
    "rut": "12.345.678-9",
    "telefono": "+56912345678",
    "fechaNacimiento": "1990-01-15",
    "fotoUrl": "https://ejemplo.com/foto.jpg",
    "direccion": "Av. Principal 123",
    "especialidad": "Psicología Clínica",
    "numeroRegistroProfesional": "PSI-12345",
    "experiencia": "10 años de experiencia en terapia cognitivo-conductual",
    "role": "PSICOLOGO",
    "estado": "ACTIVO",
    "subrol": "ADB",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-20T14:45:00.000Z"
  },
  {
    "id": "uuid-del-psicologo-2",
    "email": "psicologo2@ejemplo.com",
    "nombre": "María",
    "apellido": "González",
    "rut": "98.765.432-1",
    "telefono": "+56987654321",
    "fechaNacimiento": "1985-05-20",
    "fotoUrl": null,
    "direccion": "Calle Secundaria 456",
    "especialidad": "Psicología Infantil",
    "numeroRegistroProfesional": "PSI-67890",
    "experiencia": "8 años de experiencia en terapia familiar",
    "role": "PSICOLOGO",
    "estado": "PENDIENTE",
    "subrol": null,
    "createdAt": "2024-01-10T09:15:00.000Z",
    "updatedAt": "2024-01-10T09:15:00.000Z"
  }
]
```

## Campos de Respuesta

### **Campos Obligatorios**:
- `id`: UUID único del usuario
- `email`: Correo electrónico del usuario
- `nombre`: Nombre del usuario
- `apellido`: Apellido del usuario
- `rut`: RUT del usuario
- `telefono`: Teléfono del usuario
- `fechaNacimiento`: Fecha de nacimiento
- `role`: Rol del usuario (siempre "PSICOLOGO")
- `estado`: Estado del usuario (ACTIVO, PENDIENTE, INACTIVO, etc.)
- `subrol`: Subrol asignado (ADB, CDD, AMBOS, o null si no asignado)
- `createdAt`: Fecha de creación del usuario
- `updatedAt`: Fecha de última actualización

### **Campos Opcionales**:
- `fotoUrl`: URL de la foto de perfil
- `direccion`: Dirección del usuario
- `especialidad`: Especialidad del psicólogo
- `numeroRegistroProfesional`: Número de registro profesional
- `experiencia`: Descripción de la experiencia

## Estados de Psicólogos

### **PENDIENTE**
- Usuario registrado como psicólogo pero sin subrol asignado
- No puede hacer login al sistema
- Requiere aprobación administrativa

### **ACTIVO**
- Usuario con subrol asignado
- Puede hacer login y acceder al sistema
- Cuenta completamente funcional

### **INACTIVO/SUSPENDIDO/BLOQUEADO**
- Usuario desactivado por el administrador
- No puede acceder al sistema

## Subroles Disponibles

- **ADB**: Psicólogo con subrol ADB
- **CDD**: Psicólogo con subrol CDD
- **AMBOS**: Psicólogo con ambos subroles
- **null**: Sin subrol asignado (estado PENDIENTE)

## Ejemplo de Uso

### **Obtener Todos los Psicólogos**
```bash
curl -X GET "http://localhost:3000/api/v1/users/admin/psychologists" \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json"
```

### **Filtrar por Estado (en el frontend)**
```javascript
// Filtrar psicólogos pendientes
const pendientes = psychologists.filter(p => p.estado === 'PENDIENTE' && !p.subrol);

// Filtrar psicólogos activos
const activos = psychologists.filter(p => p.estado === 'ACTIVO' && p.subrol);

// Filtrar por subrol específico
const adb = psychologists.filter(p => p.subrol === 'ADB');
const cdd = psychologists.filter(p => p.subrol === 'CDD');
const ambos = psychologists.filter(p => p.subrol === 'AMBOS');
```

## Diferencias con Otros Endpoints

### **vs /api/v1/users/admin/all**
- **Este endpoint**: Solo usuarios con rol PSICOLOGO
- **All users**: Todos los usuarios (PSICOLOGO, PACIENTE, ADMIN)

### **vs /api/v1/psicologos**
- **Este endpoint**: Información de usuarios psicólogos (tabla users)
- **Psicologos endpoint**: Información de perfiles de psicólogos (tabla psicologo)

### **vs /api/v1/auth/pending-psychologists**
- **Este endpoint**: Todos los psicólogos (pendientes y activos)
- **Pending psychologists**: Solo psicólogos sin subrol asignado

## Casos de Uso

1. **Panel de Administración**: Listar todos los psicólogos para gestión
2. **Gestión de Subroles**: Ver qué psicólogos necesitan subrol asignado
3. **Estadísticas**: Contar psicólogos por estado o subrol
4. **Filtrado**: Filtrar psicólogos por diferentes criterios
5. **Asignación de Subroles**: Identificar psicólogos pendientes para aprobar

## Notas Importantes

- Solo administradores pueden acceder a este endpoint
- La información incluye datos sensibles (email, teléfono, RUT)
- Los psicólogos sin subrol aparecen con `subrol: null`
- El orden es por fecha de creación (más recientes primero)
- No incluye la contraseña por seguridad














