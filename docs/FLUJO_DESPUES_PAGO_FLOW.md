# Flujo Completo Después del Pago en Flow

## 🔄 ¿Qué Sucede Después de que el Usuario Paga en Flow?

### Flujo Automático (Backend)

1. **Usuario completa el pago en Flow** ✅
   - El usuario ingresa sus datos de tarjeta/transferencia
   - Flow procesa el pago

2. **Flow llama automáticamente a urlConfirmation** 🔔
   - Flow hace POST a: `{API_URL}/api/v1/flow/confirm` (urlConfirmation enviada en la orden)
   - Esto sucede automáticamente, sin intervención del usuario
   - El callback incluye: `flowOrder`, `status`, `token`, `transactionId`, etc.
   - **Nota:** No hay webhook global en el panel. Se envía como parámetro en cada orden.

3. **Backend procesa el callback (urlConfirmation)** ⚙️
   - Valida la firma de Flow (seguridad)
   - Busca la reserva temporal por `flowOrderId`
   - Crea el registro de pago
   - Cambia el estado de la reserva de `PENDIENTE_PAGO` → `CONFIRMADA`
   - Envía emails de confirmación al paciente y psicólogo

4. **Flow redirige al usuario (urlReturn)** 🔄
   - Flow hace POST a: `{API_URL}/api/v1/flow/return` (urlReturn enviada en la orden)
   - El backend verifica si la reserva ya está confirmada
   - Si no está confirmada Y el pago fue exitoso → Confirma la reserva (redundancia)
   - Backend redirige al usuario a: `{FRONT_URL}/agenda/confirmacion-sesion`

### Flujo en el Frontend

5. **Usuario llega a `/agenda/confirmacion-sesion`** 📱
   - El frontend debe verificar el estado de la reserva
   - Usar el endpoint: `GET /api/v1/pagos/verificar-reserva/:reservaTemporalId`
   - Si está confirmada → mostrar éxito
   - Si aún está pendiente → implementar polling (verificar cada 2-3 segundos)

## 📋 Checklist Antes de Subir a Producción

### 1. Variables de Entorno en el Servidor

Asegúrate de tener configuradas estas variables:

```env
# Flow Configuration
FLOW_API_KEY=tu_api_key_produccion
FLOW_SECRET_KEY=tu_secret_key_produccion
FLOW_COMMERCE_ID=tu_commerce_id_produccion

# URLs (IMPORTANTE: Deben ser URLs públicas accesibles)
API_URL=https://tu-servidor.com
FRONT_URL=https://tu-frontend.com
```

### 2. URLs de Callback (Ya Configuradas)

**IMPORTANTE:** Los callbacks se envían automáticamente con cada orden de pago. No necesitas configurar nada en el panel de Flow.

- `urlConfirmation`: `{API_URL}/api/v1/flow/confirm` (ya configurado en el código)
- `urlReturn`: `{API_URL}/api/v1/flow/return` (ya configurado en el código)

**Asegúrate de que estas URLs sean accesibles públicamente** desde Flow.

### 3. Verificar Endpoints Públicos

Ambos endpoints deben ser:
- ✅ Accesibles públicamente (sin autenticación)
- ✅ Aceptar POST requests
- ✅ Recibir datos de Flow en formato `application/x-www-form-urlencoded`

**Endpoints:**
- `/api/v1/flow/confirm` - Recibe callback automático de Flow (urlConfirmation)
- `/api/v1/flow/return` - Recibe redirección del usuario (urlReturn)

### 4. Probar el Flujo Completo

#### Prueba Local (con ngrok o similar):

```bash
# 1. Exponer tu servidor local
ngrok http 3000

# 2. Configurar en Flow (temporalmente):
# URL de confirmación: https://tu-ngrok-url.ngrok.io/api/v1/flow/confirm

# 3. Probar el flujo completo:
# - Crear orden
# - Pagar en Flow
# - Verificar que el webhook llegue
# - Verificar que la reserva se confirme
```

#### Prueba en Producción:

1. **Crear una orden de prueba**
2. **Completar el pago en Flow** (usar datos de prueba de Flow)
3. **Verificar logs del servidor:**
   - Debe aparecer: `Callback recibido de Flow`
   - Debe aparecer: `Reserva temporal encontrada`
   - Debe aparecer: `Pago de sesión confirmado`
4. **Verificar en la base de datos:**
   - La reserva debe cambiar a estado `CONFIRMADA`
   - Debe crearse un registro en la tabla `pago`
   - Los emails deben enviarse

## 🔍 Verificación Post-Pago

### En el Backend (Logs)

Después de un pago, deberías ver estos logs:

```
[FlowController] Callback recibido de Flow: {...}
[FlowController] Reserva temporal encontrada para flowOrder: 5044820
[PagoSesionService] Confirmando pago Flow: 5044820
[PagoSesionService] Pago Flow confirmado: pago {id}, reserva {id}
[MailService] Email enviado exitosamente...
```

### En la Base de Datos

Verificar que:

1. **Tabla `reservas_sesiones`:**
   - Estado cambió de `pendiente_pago` → `confirmada`
   - `metadatos.pagoId` tiene el ID del pago creado
   - `metadatos.confirmadoEn` tiene la fecha

2. **Tabla `pago`:**
   - Existe un registro nuevo con `tipo = 'SESION'`
   - `estado = 'COMPLETADO'`
   - `metadatos.flowOrderId` coincide con el flowOrder

3. **Tabla `users` (si aplica cupón):**
   - El cupón tiene `usosActuales` incrementado

## ⚠️ Problemas Comunes y Soluciones

### Problema 1: El webhook no llega

**Síntomas:**
- El usuario paga pero la reserva no se confirma
- No hay logs de "Callback recibido de Flow"

**Soluciones:**
1. Verificar que la URL del webhook sea accesible públicamente
2. Verificar que el endpoint `/api/v1/flow/confirm` acepte POST sin autenticación
3. Revisar firewall del servidor
4. Verificar logs de Flow en su panel de administración

### Problema 2: El webhook llega pero falla

**Síntomas:**
- Logs muestran "Callback recibido" pero error después

**Soluciones:**
1. Verificar que la firma de Flow sea válida (`FLOW_SECRET_KEY` correcto)
2. Verificar que la reserva temporal exista con el `flowOrderId` correcto
3. Revisar logs de error específicos

### Problema 3: La reserva no se encuentra

**Síntomas:**
- Webhook llega pero dice "Reserva temporal no encontrada"

**Soluciones:**
1. Verificar que el `flowOrderId` en el webhook coincida con el guardado en `metadatos.flowOrderId`
2. Verificar que la reserva tenga estado `PENDIENTE_PAGO`
3. Revisar que la transacción no se haya revertido

## 🧪 Script de Prueba

Puedes usar este script para verificar que todo funcione:

```javascript
// test-flow-completo.js
const axios = require('axios');

const BASE_URL = 'https://tu-servidor.com'; // Cambiar por tu URL de producción
const JWT_TOKEN = 'tu-token-jwt';

async function testFlujoCompleto() {
  console.log('🧪 Probando flujo completo de Flow...\n');

  // 1. Crear orden
  console.log('1. Creando orden...');
  const ordenResponse = await axios.post(
    `${BASE_URL}/api/v1/pagos/crear-orden-flow`,
    {
      psicologoId: '...',
      pacienteId: '...',
      fecha: '2026-01-27',
      horaInicio: '09:00',
      horaFin: '10:00',
      modalidad: 'online',
      precio: 1000
    },
    {
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }
  );

  console.log('✅ Orden creada:', ordenResponse.data);
  console.log('🔗 URL de pago:', ordenResponse.data.flowUrl);
  console.log('\n📝 INSTRUCCIONES:');
  console.log('1. Abre la URL de pago en tu navegador');
  console.log('2. Completa el pago en Flow');
  console.log('3. Espera a que Flow redirija');
  console.log('4. Verifica la reserva con:');
  console.log(`   GET ${BASE_URL}/api/v1/pagos/verificar-reserva/${ordenResponse.data.reservaTemporalId}`);
}

testFlujoCompleto();
```

## 📝 Resumen del Flujo

```
Usuario → Crea Orden → Flow → Paga → Flow Webhook → Backend Confirma → Emails → Usuario Redirigido
```

**Tiempo estimado:**
- Pago en Flow: ~1-2 minutos
- Webhook: ~1-5 segundos después del pago
- Redirección: Inmediata después del pago

## ✅ Checklist Final

Antes de subir a producción, verifica:

- [ ] Variables de entorno configuradas correctamente
- [ ] Webhook configurado en Flow apuntando a tu servidor
- [ ] URL del webhook es accesible públicamente
- [ ] Endpoint `/api/v1/flow/confirm` acepta POST sin autenticación
- [ ] `FLOW_SECRET_KEY` es correcto (para validar firmas)
- [ ] `FRONT_URL` apunta a tu frontend de producción
- [ ] `API_URL` apunta a tu backend de producción
- [ ] Probado el flujo completo en sandbox
- [ ] Logs funcionando para depurar
- [ ] Emails configurados y funcionando

## 🚀 Listo para Producción

Una vez que hayas verificado todo lo anterior, el flujo debería funcionar automáticamente:

1. Usuario crea orden → Backend crea reserva temporal
2. Usuario paga en Flow → Flow procesa pago
3. Flow envía webhook → Backend confirma reserva automáticamente
4. Usuario es redirigido → Frontend verifica estado
5. ✅ Reserva confirmada y emails enviados

