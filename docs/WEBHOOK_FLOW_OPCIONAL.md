# Callbacks de Flow - urlConfirmation y urlReturn

## 📋 ¿Cómo Funciona Flow?

Según la [documentación oficial de Flow](https://developers.sandbox.flow.cl/api), cuando creas una orden de pago con `payment/create`, puedes enviar dos parámetros de callback:

1. **`urlConfirmation`**: URL que Flow llama automáticamente cuando el pago se completa (POST)
2. **`urlReturn`**: URL donde Flow redirige al usuario después del pago (POST)

**Importante:** No hay un webhook global configurado en el panel de Flow. Los callbacks se envían como parámetros en cada orden de pago.

## 🔄 Cómo Funciona en Tu Sistema

### Flujo Actual (Ya Implementado)

```
1. Crear orden → Enviamos urlConfirmation y urlReturn a Flow
2. Usuario paga en Flow
3. Flow llama automáticamente → POST /api/v1/flow/confirm (urlConfirmation)
4. Flow redirige usuario → POST /api/v1/flow/return (urlReturn)
5. Backend confirma reserva en ambos endpoints (redundancia)
```

### Endpoint 1: `/api/v1/flow/confirm` (urlConfirmation)

- Flow llama automáticamente cuando el pago se completa
- Se ejecuta en segundo plano (sin intervención del usuario)
- Confirma la reserva automáticamente
- Funciona incluso si el usuario cierra el navegador

### Endpoint 2: `/api/v1/flow/return` (urlReturn)

- Flow redirige al usuario aquí después del pago
- El backend verifica si la reserva ya está confirmada
- Si no está confirmada Y el pago fue exitoso → Confirma la reserva
- Redirige al frontend con los parámetros necesarios

## ✅ Tu Sistema Ya Está Configurado

El código actual **ya envía ambos callbacks** en cada orden de pago:

```typescript
// En flow.service.ts
const urlConfirmation = `${this.apiUrl}/api/v1/flow/confirm`;
const urlReturn = `${this.apiUrl}/api/v1/flow/return`;

const params = {
  // ... otros parámetros
  urlConfirmation: urlConfirmation,  // ✅ Ya configurado
  urlReturn: urlReturn,              // ✅ Ya configurado
};
```

**No necesitas configurar nada en el panel de Flow.** Los callbacks se envían automáticamente con cada orden.

## 🔧 Verificar que Funcione

Ambos endpoints ya están implementados y:
- ✅ Son públicos (sin autenticación)
- ✅ Validan la firma de Flow (seguridad)
- ✅ Confirman reservas automáticamente
- ✅ Tienen redundancia (si uno falla, el otro confirma)

## 📊 Ventajas del Sistema Actual

| Aspecto | Beneficio |
|---------|-----------|
| **Redundancia** | Dos endpoints confirman la reserva (confirm + return) |
| **Confiabilidad** | Si `urlConfirmation` falla, `urlReturn` confirma |
| **Inmediatez** | `urlConfirmation` confirma en 1-5 segundos |
| **UX** | `urlReturn` redirige al usuario al frontend |
| **Sin configuración** | No necesitas configurar nada en el panel de Flow |

## 🔍 Verificar que los Callbacks Funcionen

Revisa los logs después de un pago:

**Si ambos callbacks funcionan:**
```
[FlowController] Callback recibido de Flow: {...}  // urlConfirmation
[FlowController] Reserva temporal encontrada...
[PagoSesionService] Pago Flow confirmado...
[FlowController] Retorno de Flow recibido: {...}  // urlReturn
[FlowController] Reserva ya está confirmada       // Ya confirmada por urlConfirmation
```

**Si solo urlReturn funciona:**
```
[FlowController] Retorno de Flow recibido: {...}  // urlReturn
[FlowController] Pago exitoso detectado en retorno, confirmando reserva...
[PagoSesionService] Pago Flow confirmado...
```

**Ambos métodos confirman la reserva correctamente.** El sistema tiene redundancia incorporada.

## 📚 Referencias

- [Documentación oficial de Flow API](https://developers.sandbox.flow.cl/api)
- Sección: "Notificaciones de Flow a su comercio"
- Endpoint: `POST /payment/create` (parámetros `urlConfirmation` y `urlReturn`)

