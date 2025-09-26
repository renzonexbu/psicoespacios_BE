# Endpoint de Consolidado Mensual

## Descripción

Se ha implementado un endpoint para que los psicólogos puedan ver un consolidado mensual de sus reservas de boxes, incluyendo detalles de pagos, estadísticas y resúmenes por estado.

## Endpoints Disponibles

### 1. Consolidado Mensual (Psicólogos)

**GET** `/api/v1/consolidado/mensual`

**URL**: `{{base_url}}/api/v1/consolidado/mensual`

**Método**: `GET`

**Autenticación**: Requerida (JWT Bearer Token)

**Roles**: PSICOLOGO, ADMIN

#### Parámetros de Query

| Parámetro | Tipo | Requerido | Descripción | Ejemplo |
|-----------|------|-----------|-------------|---------|
| `mes` | string | Sí | Mes en formato YYYY-MM | `2024-01` |
| `psicologoId` | string | No | ID del psicólogo (solo para admins) | `uuid-del-psicologo` |

#### Headers Requeridos

```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

#### Respuesta Exitosa (200)

```json
{
  "psicologoId": "uuid-del-psicologo",
  "nombrePsicologo": "Juan Pérez",
  "emailPsicologo": "juan@example.com",
  "mes": "2024-01",
  "año": 2024,
  "mesNumero": 1,
  "totalReservas": 15,
  "totalMonto": 450000.00,
  "detalleReservas": [
    {
      "id": "uuid-de-reserva",
      "boxId": "uuid-del-box",
      "nombreBox": "Box 1 - Consultorio Principal",
      "fecha": "2024-01-15",
      "horaInicio": "09:00",
      "horaFin": "10:00",
      "precio": 30000.00,
      "estado": "completada",
      "createdAt": "2024-01-10T10:30:00.000Z"
    }
  ],
  "resumen": {
    "reservasCompletadas": 12,
    "reservasCanceladas": 2,
    "reservasPendientes": 1,
    "montoCompletadas": 360000.00,
    "montoCanceladas": 60000.00,
    "montoPendientes": 30000.00
  },
  "estadisticas": {
    "promedioPorReserva": 30000.00,
    "reservasPorSemana": [3, 4, 2, 3, 3],
    "diasConReservas": 8
  }
}
```

### 2. Consolidado Mensual (Admin)

**GET** `/api/v1/consolidado/mensual/:psicologoId`

**URL**: `{{base_url}}/api/v1/consolidado/mensual/{psicologoId}`

**Método**: `GET`

**Autenticación**: Requerida (JWT Bearer Token)

**Roles**: Solo ADMIN

#### Parámetros

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `psicologoId` | string | Sí | ID del psicólogo (en la URL) |
| `mes` | string | Sí | Mes en formato YYYY-MM (query param) |

## Campos de Respuesta

### **Información del Psicólogo**
- `psicologoId`: UUID del psicólogo
- `nombrePsicologo`: Nombre completo del psicólogo
- `emailPsicologo`: Email del psicólogo

### **Información del Período**
- `mes`: Mes en formato YYYY-MM
- `año`: Año numérico
- `mesNumero`: Número del mes (1-12)

### **Totales Generales**
- `totalReservas`: Número total de reservas en el mes
- `totalMonto`: Monto total de todas las reservas

### **Detalle de Reservas**
- `detalleReservas`: Array con información detallada de cada reserva
  - `id`: UUID de la reserva
  - `boxId`: UUID del box
  - `nombreBox`: Nombre del box
  - `fecha`: Fecha de la reserva (YYYY-MM-DD)
  - `horaInicio`: Hora de inicio (HH:MM)
  - `horaFin`: Hora de fin (HH:MM)
  - `precio`: Precio de la reserva
  - `estado`: Estado de la reserva
  - `createdAt`: Fecha de creación de la reserva

### **Resumen por Estado**
- `reservasCompletadas`: Número de reservas completadas
- `reservasCanceladas`: Número de reservas canceladas
- `reservasPendientes`: Número de reservas pendientes
- `montoCompletadas`: Monto total de reservas completadas
- `montoCanceladas`: Monto total de reservas canceladas
- `montoPendientes`: Monto total de reservas pendientes

### **Estadísticas**
- `promedioPorReserva`: Promedio de precio por reserva
- `reservasPorSemana`: Array con número de reservas por semana del mes
- `diasConReservas`: Número de días diferentes con reservas

## Estados de Reserva

- **completada**: Reserva realizada exitosamente
- **cancelada**: Reserva cancelada
- **pendiente**: Reserva pendiente de confirmación

## Ejemplos de Uso

### **Obtener Consolidado del Mes Actual**
```bash
curl -X GET "http://localhost:3000/api/v1/consolidado/mensual?mes=2024-01" \
  -H "Authorization: Bearer {psicologo_token}" \
  -H "Content-Type: application/json"
```

### **Obtener Consolidado de un Psicólogo Específico (Admin)**
```bash
curl -X GET "http://localhost:3000/api/v1/consolidado/mensual/uuid-del-psicologo?mes=2024-01" \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json"
```

### **Uso en Frontend (JavaScript)**
```javascript
// Obtener consolidado del mes actual
const mesActual = new Date().toISOString().slice(0, 7);
const response = await fetch(`/api/v1/consolidado/mensual?mes=${mesActual}`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
const consolidado = await response.json();

// Mostrar información
console.log(`Total: $${consolidado.totalMonto}`);
console.log(`Reservas: ${consolidado.totalReservas}`);
console.log(`Días con reservas: ${consolidado.estadisticas.diasConReservas}`);
```

## Validaciones

### **Formato de Mes**
- Debe ser YYYY-MM (ej: 2024-01)
- Mes debe estar entre 01 y 12
- Año debe ser válido

### **Permisos**
- Los psicólogos solo pueden ver su propio consolidado
- Los admins pueden ver el consolidado de cualquier psicólogo
- Se requiere autenticación JWT válida

### **Errores Comunes**

#### **400 Bad Request - Formato de Mes Inválido**
```json
{
  "statusCode": 400,
  "message": "El mes debe tener el formato YYYY-MM (ej: 2024-01)",
  "error": "Bad Request"
}
```

#### **404 Not Found - Psicólogo No Encontrado**
```json
{
  "statusCode": 404,
  "message": "Psicólogo no encontrado",
  "error": "Not Found"
}
```

#### **401 Unauthorized - Token Inválido**
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

## Casos de Uso

1. **Dashboard del Psicólogo**: Mostrar resumen mensual de ingresos
2. **Reportes Financieros**: Generar reportes de facturación
3. **Análisis de Rendimiento**: Ver estadísticas de reservas
4. **Gestión Administrativa**: Los admins pueden revisar consolidados de cualquier psicólogo
5. **Facturación**: Calcular montos a pagar por arriendo de boxes

## Notas Técnicas

- Los cálculos se basan en la tabla `reservas`
- Se incluyen todas las reservas del mes, independientemente del estado
- Los montos se redondean a 2 decimales
- Las fechas se manejan en UTC
- El endpoint es optimizado para consultas mensuales frecuentes





