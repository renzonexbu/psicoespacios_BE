# Validación de Suscripción en Login

## Descripción
Ahora cuando un usuario psicólogo se loguea, el sistema valida automáticamente si tiene una suscripción activa y devuelve información detallada sobre su estado de suscripción.

## Endpoint
```
POST /api/v1/auth/login
```

## Respuesta para Psicólogos

### Con Suscripción Activa
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "uuid-uuid-uuid-uuid",
  "user": {
    "id": "user-id",
    "email": "psicologo@example.com",
    "nombre": "Juan",
    "apellido": "Pérez",
    "rut": "12.345.678-9",
    "telefono": "+56912345678",
    "fechaNacimiento": "1985-05-15",
    "fotoUrl": "https://example.com/foto.jpg",
    "role": "PSICOLOGO",
    "estado": "ACTIVO"
  },
  "suscripcion": {
    "tieneSuscripcion": true,
    "mensaje": "Suscripción activa",
    "estado": "ACTIVA",
    "plan": "Plan Mensual Premium",
    "fechaVencimiento": "2024-09-15T00:00:00.000Z",
    "diasRestantes": 15,
    "renovacionAutomatica": true,
    "precioRenovacion": 29990
  }
}
```

### Sin Suscripción
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "uuid-uuid-uuid-uuid",
  "user": {
    "id": "user-id",
    "email": "psicologo@example.com",
    "nombre": "Juan",
    "apellido": "Pérez",
    "rut": "12.345.678-9",
    "telefono": "+56912345678",
    "fechaNacimiento": "1985-05-15",
    "fotoUrl": "https://example.com/foto.jpg",
    "role": "PSICOLOGO",
    "estado": "ACTIVO"
  },
  "suscripcion": {
    "tieneSuscripcion": false,
    "mensaje": "No tienes una suscripción activa",
    "estado": "SIN_SUSCRIPCION"
  }
}
```

### Suscripción Vencida
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "uuid-uuid-uuid-uuid",
  "user": {
    "id": "user-id",
    "email": "psicologo@example.com",
    "nombre": "Juan",
    "apellido": "Pérez",
    "rut": "12.345.678-9",
    "telefono": "+56912345678",
    "fechaNacimiento": "1985-05-15",
    "fotoUrl": "https://example.com/foto.jpg",
    "role": "PSICOLOGO",
    "estado": "ACTIVO"
  },
  "suscripcion": {
    "tieneSuscripcion": false,
    "mensaje": "Tu suscripción ha vencido",
    "estado": "VENCIDA",
    "fechaVencimiento": "2024-08-01T00:00:00.000Z",
    "plan": "Plan Mensual Premium"
  }
}
```

## Respuesta para Otros Roles
Para usuarios que no son psicólogos (PACIENTE, ADMIN), el campo `suscripcion` será `null`:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "uuid-uuid-uuid-uuid",
  "user": {
    "id": "user-id",
    "email": "paciente@example.com",
    "nombre": "María",
    "apellido": "González",
    "rut": "98.765.432-1",
    "telefono": "+56987654321",
    "fechaNacimiento": "1990-10-20",
    "fotoUrl": "https://example.com/foto.jpg",
    "role": "PACIENTE",
    "estado": "ACTIVO"
  },
  "suscripcion": null
}
```

## Estados de Suscripción

| Estado | Descripción |
|--------|-------------|
| `ACTIVA` | Suscripción vigente y funcional |
| `VENCIDA` | Suscripción expirada |
| `SIN_SUSCRIPCION` | No tiene suscripción activa |
| `ERROR` | Error al verificar suscripción |

## Campos de Suscripción

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `tieneSuscripcion` | boolean | Indica si tiene suscripción válida |
| `mensaje` | string | Mensaje descriptivo del estado |
| `estado` | string | Estado de la suscripción |
| `plan` | string | Nombre del plan contratado |
| `fechaVencimiento` | Date | Fecha de vencimiento |
| `diasRestantes` | number | Días restantes hasta vencimiento |
| `renovacionAutomatica` | boolean | Si tiene renovación automática |
| `precioRenovacion` | number | Precio para renovar |

## Uso en Frontend

### Verificar Estado de Suscripción
```javascript
const response = await fetch('/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(loginData)
});

const data = await response.json();

if (data.user.role === 'PSICOLOGO') {
  if (data.suscripcion.tieneSuscripcion) {
    console.log(`Suscripción activa: ${data.suscripcion.plan}`);
    console.log(`Días restantes: ${data.suscripcion.diasRestantes}`);
  } else {
    console.log(`Estado: ${data.suscripcion.estado}`);
    console.log(`Mensaje: ${data.suscripcion.mensaje}`);
  }
}
```

### Mostrar Alertas
```javascript
if (data.suscripcion?.estado === 'VENCIDA') {
  showAlert('Tu suscripción ha vencido. Renueva para continuar usando el servicio.');
} else if (data.suscripcion?.estado === 'SIN_SUSCRIPCION') {
  showAlert('No tienes una suscripción activa. Contrata un plan para comenzar.');
}
```

## Notas Técnicas

- La validación se ejecuta automáticamente en cada login
- Solo se valida para usuarios con rol `PSICOLOGO`
- Se incluye información del plan asociado
- Se calculan días restantes en tiempo real
- Manejo de errores robusto con fallback a estado `ERROR`
















