# Flujo de Pago con Flow - Guía para Frontend

## 📋 Resumen

**⚠️ IMPORTANTE: Todos los pagos ahora pasan por Flow**

Este documento explica cómo implementar el flujo de pago con Flow en el frontend. **Todos los pagos de sesiones deben usar Flow**, independientemente del método de pago elegido por el usuario (tarjeta, transferencia, etc.).

**Endpoint Principal:** `POST /api/v1/pagos/crear-orden-flow`

## 🔄 Flujo Completo con Flow

### ⚠️ Todos los Pagos Pasan por Flow

**No importa qué método de pago elija el usuario** (tarjeta, transferencia, efectivo, etc.), **siempre debes usar el endpoint `crear-orden-flow`**. Flow manejará todos los métodos de pago disponibles.

### Paso 1: Crear Orden en Flow

Cuando el usuario hace clic en "Pagar" o "Confirmar Reserva", el frontend **siempre** debe llamar al endpoint de crear orden:

```typescript
// Ejemplo en TypeScript/JavaScript
async function crearOrdenFlow(datosSesion) {
  const response = await fetch('http://127.0.0.1:3000/api/v1/pagos/crear-orden-flow', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // Token JWT del usuario
    },
    body: JSON.stringify({
      psicologoId: datosSesion.psicologoId,
      pacienteId: datosSesion.pacienteId,
      fecha: datosSesion.fecha, // Formato: "YYYY-MM-DD"
      horaInicio: datosSesion.horaInicio, // Formato: "HH:mm"
      horaFin: datosSesion.horaFin, // Formato: "HH:mm"
      modalidad: datosSesion.modalidad, // "online" o "presencial"
      boxId: datosSesion.boxId, // Solo si es presencial
      fonasa: datosSesion.fonasa || false,
      cuponId: datosSesion.cuponId, // Opcional
      precio: datosSesion.precio,
      observaciones: datosSesion.observaciones // Opcional
    })
  });

  const data = await response.json();
  return data;
}
```

### Respuesta del Endpoint

```json
{
  "flowOrderId": "12345678",
  "flowUrl": "https://flow.cl/pay/12345678",
  "monto": 50000,
  "descuentoAplicado": 0,
  "montoFinal": 50000,
  "cupon": null,
  "reservaTemporalId": "uuid-de-la-reserva-temporal"
}
```

### Paso 2: Redirigir al usuario a Flow

Una vez que recibes la respuesta, redirige al usuario a la URL de Flow:

```typescript
const resultado = await crearOrdenFlow(datosSesion);

// Guardar el reservaTemporalId en localStorage o sessionStorage
// para verificar después del pago
localStorage.setItem('reservaTemporalId', resultado.reservaTemporalId);
localStorage.setItem('flowOrderId', resultado.flowOrderId);

// Redirigir al usuario a Flow
window.location.href = resultado.flowUrl;
```

### Paso 3: Usuario completa el pago en Flow

El usuario será redirigido a Flow donde:
- Verá los detalles del pago
- Ingresará sus datos de tarjeta
- Completará el pago

### Paso 4: Flow redirige de vuelta al backend

Después del pago (exitoso o fallido), Flow hace POST a: `{API_URL}/api/v1/flow/return`

**Importante:** 
- Flow llama automáticamente a `urlConfirmation` (`/api/v1/flow/confirm`) cuando el pago se completa
- Flow redirige al usuario a `urlReturn` (`/api/v1/flow/return`) después del pago
- Ambos callbacks se envían como parámetros en cada orden (no hay webhook global en el panel)
- Puede haber un pequeño delay entre el pago y la confirmación

### Paso 5: Backend redirige al frontend

El endpoint `/api/v1/flow/return`:
- Recibe el POST de Flow
- Busca la reserva temporal
- Redirige al usuario a: `{FRONT_URL}/agenda/confirmacion-sesion?reservaId={id}&flowOrder={order}&status={status}`

### Paso 6: Verificar estado de la reserva

En la página de retorno (`/agenda/confirmacion-sesion`), el frontend debe:

```typescript
// En tu página /agenda/confirmacion-sesion
async function verificarReserva() {
  // Obtener reservaId de los query params (viene del redirect del backend)
  const urlParams = new URLSearchParams(window.location.search);
  const reservaId = urlParams.get('reservaId');
  const flowOrder = urlParams.get('flowOrder');
  const status = urlParams.get('status');
  
  // Si no hay reservaId en los params, intentar desde localStorage
  const reservaTemporalId = reservaId || localStorage.getItem('reservaTemporalId');
  
  if (!reservaTemporalId) {
    // No hay reserva pendiente
    console.warn('No se encontró reservaId en los parámetros');
    return;
  }

  try {
    const response = await fetch(
      `http://127.0.0.1:3000/api/v1/pagos/verificar-reserva/${reservaTemporalId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    const data = await response.json();
    
    if (data.confirmada) {
      // ✅ Reserva confirmada - mostrar mensaje de éxito
      mostrarMensajeExito(data);
      // Limpiar localStorage
      localStorage.removeItem('reservaTemporalId');
      localStorage.removeItem('flowOrderId');
    } else {
      // ⏳ Aún pendiente - el webhook puede estar procesando
      // Puedes implementar un polling o mostrar un mensaje
      mostrarMensajePendiente(data);
    }
  } catch (error) {
    console.error('Error al verificar reserva:', error);
  }
}

// Llamar cuando la página carga
verificarReserva();

// Opcional: Implementar polling si la reserva no está confirmada
let intentos = 0;
const maxIntentos = 10; // 10 intentos máximo

const intervalo = setInterval(async () => {
  intentos++;
  const data = await verificarReserva();
  
  if (data.confirmada || intentos >= maxIntentos) {
    clearInterval(intervalo);
  }
}, 2000); // Verificar cada 2 segundos
```

### Respuesta del Endpoint de Verificación

```json
{
  "reservaId": "uuid-de-la-reserva",
  "estado": "confirmada", // o "pendiente_pago"
  "confirmada": true,
  "pagoId": "uuid-del-pago",
  "flowOrderId": "12345678",
  "mensaje": "Reserva confirmada exitosamente"
}
```

## ❌ Endpoints Deprecados

### `POST /api/v1/pagos/confirmar-sesion` (DEPRECADO)

⚠️ **Este endpoint está deprecado**. Ahora redirige internamente a Flow.

**No uses este endpoint.** Siempre usa `crear-orden-flow` en su lugar.

Si necesitas procesar pagos directos sin Flow, contacta al equipo de desarrollo.

## 📝 Ejemplo Completo de Implementación

```typescript
// servicio-pago.ts
export class ServicioPago {
  private baseUrl = 'http://127.0.0.1:3000';
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  /**
   * Crear orden en Flow - ÚNICO método para crear reservas
   * Todos los pagos pasan por Flow, independientemente del método elegido
   */
  async crearOrdenFlow(datosSesion: any) {
    const response = await fetch(`${this.baseUrl}/api/v1/pagos/crear-orden-flow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify(datosSesion)
    });

    if (!response.ok) {
      throw new Error('Error al crear orden en Flow');
    }

    return await response.json();
  }

  /**
   * Verificar estado de una reserva después del pago
   */
  async verificarReserva(reservaTemporalId: string) {
    const response = await fetch(
      `${this.baseUrl}/api/v1/pagos/verificar-reserva/${reservaTemporalId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      }
    );

    if (!response.ok) {
      throw new Error('Error al verificar reserva');
    }

    return await response.json();
  }
}

// En tu componente React/Vue/etc.
async function manejarPago() {
  const servicioPago = new ServicioPago(token);
  
  try {
    // ⚠️ IMPORTANTE: Siempre usar crearOrdenFlow, sin importar el método de pago
    // Flow manejará todos los métodos (tarjeta, transferencia, etc.)
    const resultado = await servicioPago.crearOrdenFlow({
      psicologoId: '...',
      pacienteId: '...',
      fecha: '2025-01-15',
      horaInicio: '10:00',
      horaFin: '11:00',
      modalidad: 'online',
      precio: 50000,
      fonasa: false,
      cuponId: null, // Opcional
      observaciones: null // Opcional
    });

    // 2. Guardar IDs para verificación posterior
    sessionStorage.setItem('reservaTemporalId', resultado.reservaTemporalId);
    sessionStorage.setItem('flowOrderId', resultado.flowOrderId);

    // 3. Redirigir a Flow (Flow mostrará todos los métodos de pago disponibles)
    window.location.href = resultado.flowUrl;
  } catch (error) {
    console.error('Error:', error);
    // Mostrar mensaje de error al usuario
  }
}

// En la página de retorno (/pago-exitoso)
async function verificarPagoCompletado() {
  const servicioPago = new ServicioPago(token);
  const reservaTemporalId = sessionStorage.getItem('reservaTemporalId');

  if (!reservaTemporalId) {
    return; // No hay reserva pendiente
  }

  try {
    const estado = await servicioPago.verificarReserva(reservaTemporalId);

    if (estado.confirmada) {
      // ✅ Pago exitoso
      mostrarMensajeExito('¡Reserva confirmada exitosamente!');
      sessionStorage.removeItem('reservaTemporalId');
      sessionStorage.removeItem('flowOrderId');
      
      // Redirigir a página de mis reservas o dashboard
      setTimeout(() => {
        window.location.href = '/mis-reservas';
      }, 3000);
    } else {
      // ⏳ Aún procesando
      mostrarMensajePendiente('Procesando pago...');
      
      // Implementar polling
      const intervalo = setInterval(async () => {
        const nuevoEstado = await servicioPago.verificarReserva(reservaTemporalId);
        if (nuevoEstado.confirmada) {
          clearInterval(intervalo);
          mostrarMensajeExito('¡Reserva confirmada!');
          sessionStorage.removeItem('reservaTemporalId');
          sessionStorage.removeItem('flowOrderId');
        }
      }, 2000);
    }
  } catch (error) {
    console.error('Error al verificar pago:', error);
    mostrarMensajeError('Error al verificar el estado del pago');
  }
}
```

## ⚠️ Consideraciones Importantes

1. **Todos los Pagos Pasan por Flow**: No importa si el usuario quiere pagar con tarjeta, transferencia o efectivo. **Siempre usa `crear-orden-flow`**. Flow manejará todos los métodos de pago disponibles.

2. **Webhook Automático**: El webhook de Flow se ejecuta automáticamente en el backend. No necesitas llamar manualmente a ningún endpoint para confirmar el pago.

3. **Delay del Webhook**: Puede haber un pequeño delay (1-5 segundos) entre que el usuario completa el pago y el webhook procesa la confirmación. Por eso implementamos el polling.

4. **Manejo de Errores**: Siempre maneja los casos de error:
   - Usuario cancela el pago en Flow
   - Error de red
   - Timeout del webhook

5. **URLs de Retorno**: Asegúrate de que las URLs de retorno estén configuradas correctamente en Flow y en las variables de entorno del backend (`FRONT_URL`).

6. **Seguridad**: Nunca expongas el `FLOW_SECRET_KEY` en el frontend. La validación de firmas se hace en el backend.

7. **Métodos de Pago en Flow**: Flow permite al usuario elegir entre múltiples métodos de pago (tarjeta, transferencia, etc.) directamente en su plataforma. No necesitas manejar esto en el frontend.

## 🔗 Endpoints Disponibles

| Método | Endpoint | Descripción | Estado |
|--------|----------|-------------|--------|
| POST | `/api/v1/pagos/crear-orden-flow` | **Crear orden en Flow y reserva temporal** | ✅ **USAR ESTE** |
| GET | `/api/v1/pagos/verificar-reserva/:reservaTemporalId` | Verificar estado de una reserva | ✅ Activo |
| POST | `/api/v1/pagos/crear-orden` | Alias de `crear-orden-flow` | ✅ Activo |
| POST | `/api/v1/pagos/confirmar-sesion` | ⚠️ **DEPRECADO** - Redirige a Flow | ❌ No usar |
| POST | `/api/v1/flow/confirm` | Callback automático de Flow (urlConfirmation) | 🔒 Backend only |

## 📞 Soporte

Si tienes dudas sobre la implementación, revisa:
- Los logs del backend para ver el flujo completo
- La documentación de Flow: https://www.flow.cl/documentacion/api
- Los tests en `scripts/test-flow-payment.js`

