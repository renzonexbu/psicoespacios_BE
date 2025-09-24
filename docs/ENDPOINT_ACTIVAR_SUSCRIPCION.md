# Endpoint para Activar Suscripciones

## Descripción
Endpoint para activar una suscripción que está en estado `PENDIENTE_PAGO` y cambiarla a estado `ACTIVA`.

## Base URL
```
/api/v1/gestion/suscripciones
```

## Endpoint Disponible

### Activar Suscripción
**POST** `/:id/activar`

Cambia el estado de una suscripción de `PENDIENTE_PAGO` a `ACTIVA`, confirmando que el pago ha sido procesado.

#### Parámetros
- `id` (string, requerido): ID de la suscripción a activar

#### Headers
```
Authorization: Bearer {token}
Content-Type: application/json
```

#### Roles Permitidos
- ADMIN
- PSICOLOGO

#### Body (ActivarSuscripcionDto)
```json
{
  "datosPago": {
    "metodo": "TRANSFERENCIA_BANCARIA",
    "referencia": "TRX-123456789",
    "metadatos": {
      "banco": "Banco de Chile",
      "cuenta": "12345678-9"
    }
  }
}
```

**Campos:**
- `datosPago` (opcional): Información del pago confirmado
  - `metodo` (string, opcional): Método de pago utilizado
  - `referencia` (string, opcional): Referencia o comprobante del pago
  - `metadatos` (object, opcional): Información adicional del pago

#### Respuesta Exitosa (200)
```json
{
  "id": "a1129fd3-5456-49e4-a11f-96563a8aacc2",
  "usuarioId": "b2230fe4-6567-50f5-b230-07674b9b3dd3",
  "planId": "c3341gf5-7678-61g6-c341-18785c0c4ee4",
  "fechaInicio": "2024-08-14T10:00:00.000Z",
  "fechaFin": "2024-09-14T10:00:00.000Z",
  "estado": "ACTIVA",
  "precioTotal": 25000,
  "horasConsumidas": 0,
  "horasDisponibles": 20,
  "fechaCreacion": "2024-08-14T10:00:00.000Z",
  "fechaActualizacion": "2024-08-14T10:30:00.000Z",
  "fechaProximaRenovacion": "2024-09-07T10:00:00.000Z",
  "precioRenovacion": 25000,
  "renovacionAutomatica": false,
  "datosPago": {
    "metodo": "TRANSFERENCIA_BANCARIA",
    "referencia": "TRX-123456789",
    "metadatos": {
      "banco": "Banco de Chile",
      "cuenta": "12345678-9"
    }
  },
  "historialPagos": [
    {
      "fecha": "2024-08-14T10:00:00.000Z",
      "monto": 25000,
      "metodo": "PENDIENTE",
      "referencia": "",
      "estado": "PENDIENTE"
    },
    {
      "fecha": "2024-08-14T10:30:00.000Z",
      "monto": 25000,
      "metodo": "CONFIRMADO",
      "referencia": "TRX-123456789",
      "estado": "CONFIRMADO"
    }
  ]
}
```

## Ejemplos de Uso

### Activar Suscripción con Datos de Pago
```bash
curl -X POST "http://localhost:3000/api/v1/gestion/suscripciones/a1129fd3-5456-49e4-a11f-96563a8aacc2/activar" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "datosPago": {
      "metodo": "TRANSFERENCIA_BANCARIA",
      "referencia": "TRX-123456789",
      "metadatos": {
        "banco": "Banco de Chile",
        "cuenta": "12345678-9"
      }
    }
  }'
```

### Activar Suscripción sin Datos de Pago
```bash
curl -X POST "http://localhost:3000/api/v1/gestion/suscripciones/a1129fd3-5456-49e4-a11f-96563a8aacc2/activar" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Códigos de Respuesta

| Código | Descripción |
|--------|-------------|
| 200 | Suscripción activada exitosamente |
| 400 | Datos de entrada inválidos o suscripción no puede ser activada |
| 401 | No autorizado (token inválido) |
| 403 | Acceso denegado (rol insuficiente) |
| 404 | Suscripción no encontrada |
| 500 | Error interno del servidor |

## Validaciones

### Estado de Suscripción
- Solo se pueden activar suscripciones con estado `PENDIENTE_PAGO`
- Si la suscripción ya está `ACTIVA`, `CANCELADA` o `VENCIDA`, se devuelve error 400

### Permisos
- Solo usuarios con rol `ADMIN` o `PSICOLOGO` pueden activar suscripciones
- Los psicólogos solo pueden activar sus propias suscripciones (validación implícita)

## Notas Técnicas

### Cambios Automáticos
Al activar una suscripción, el sistema:

1. **Cambia el estado** de `PENDIENTE_PAGO` a `ACTIVA`
2. **Actualiza `fechaActualizacion`** con la fecha y hora actual
3. **Agrega entrada al historial de pagos** con estado `CONFIRMADO`
4. **Preserva los datos de pago** originales si se proporcionan

### Historial de Pagos
- Se mantiene el registro original del pago pendiente
- Se agrega un nuevo registro confirmando la activación
- Los metadatos del pago se almacenan para auditoría

### Seguridad
- **Autenticación requerida**: JWT válido
- **Autorización por roles**: ADMIN o PSICOLOGO
- **Validación de estado**: Solo suscripciones pendientes pueden ser activadas

## Casos de Uso

### 1. Confirmación de Pago
Cuando un psicólogo confirma que ha realizado el pago de su suscripción.

### 2. Activación Administrativa
Cuando un administrador confirma manualmente el pago de una suscripción.

### 3. Corrección de Estado
Para casos donde una suscripción quedó en estado pendiente por error del sistema.

## Implementación en el Código

### Controlador
```typescript
// src/gestion/controllers/suscripciones.controller.ts

@Post(':id/activar')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'PSICOLOGO')
async activarSuscripcion(
  @Param('id') id: string,
  @Body() activarDto: ActivarSuscripcionDto,
  @Req() req: any,
) {
  return this.suscripcionesService.activarSuscripcion(id, activarDto.datosPago);
}
```

### Servicio
```typescript
// src/gestion/services/suscripciones.service.ts

async activarSuscripcion(suscripcionId: string, datosPago: any = {}): Promise<Suscripcion> {
  const suscripcion = await this.suscripcionRepository.findOne({
    where: { id: suscripcionId },
    relations: ['plan']
  });

  if (!suscripcion) {
    throw new NotFoundException('Suscripción no encontrada');
  }

  if (suscripcion.estado !== EstadoSuscripcion.PENDIENTE_PAGO) {
    throw new BadRequestException(`No se puede activar una suscripción con estado: ${suscripcion.estado}`);
  }

  // Actualizar estado a ACTIVA
  suscripcion.estado = EstadoSuscripcion.ACTIVA;
  
  // Actualizar datos de pago si se proporcionan
  if (datosPago && Object.keys(datosPago).length > 0) {
    suscripcion.datosPago = datosPago;
  }

  // Actualizar historial de pagos
  if (suscripcion.historialPagos) {
    suscripcion.historialPagos.push({
      fecha: new Date(),
      monto: suscripcion.precioTotal,
      metodo: datosPago.metodo || 'CONFIRMADO',
      referencia: datosPago.referencia || '',
      estado: 'CONFIRMADO'
    });
  }

  // Actualizar fecha de actualización
  suscripcion.fechaActualizacion = new Date();

  return this.suscripcionRepository.save(suscripcion);
}
```

### DTO
```typescript
// src/gestion/dto/suscripcion.dto.ts

export class ActivarSuscripcionDto {
  @IsOptional()
  @IsObject()
  datosPago?: {
    metodo?: string;
    referencia?: string;
    metadatos?: Record<string, any>;
  };
}
```
















