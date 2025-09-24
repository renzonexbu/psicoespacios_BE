# 🚀 Guía de Despliegue en Render

## 📋 Configuración para Render

### 1. Variables de Entorno en Render

Configura las siguientes variables de entorno en tu proyecto de Render:

#### **Base de Datos**
```
DB_HOST=tu-host-postgresql.render.com
DB_PORT=5432
DB_USERNAME=tu_username
DB_PASSWORD=tu_password
DB_DATABASE=tu_database_name
DB_URL=postgresql://tu_username:tu_password@tu-host-postgresql.render.com:5432/tu_database_name
```

#### **JWT**
```
JWT_SECRET=tu_jwt_secret_super_seguro_y_largo_minimo_32_caracteres
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=tu_refresh_secret_super_seguro_y_largo_minimo_32_caracteres
JWT_REFRESH_EXPIRES_IN=7d
```

#### **Flow (Pagos)**
```
# Sandbox (desarrollo)
FLOW_API_KEY=5B2A0FB8-CE70-455E-AAAB-5AB11L67E99A
FLOW_SECRET_KEY=3699c4008de7bc5e08ce58ddde71e76348c5e104
FLOW_COMMERCE_ID=TU_COMMERCE_ID_SANDBOX

# Producción (cambiar cuando esté listo)
# FLOW_API_KEY=tu_api_key_produccion
# FLOW_SECRET_KEY=tu_secret_key_produccion
# FLOW_COMMERCE_ID=tu_commerce_id_produccion
```

#### **URLs**
```
API_URL=https://tu-app.onrender.com
FRONT_URL=https://tu-frontend.onrender.com
```

#### **Entorno**
```
NODE_ENV=production
PORT=10000
```

#### **CORS**
```
CORS_ORIGIN=https://tu-frontend.onrender.com
```

### 2. Configuración de Flow

#### **URLs de Callback en Flow:**

Una vez que tengas tu URL de Render, configura en Flow:

- **URL de confirmación (webhook):** `https://tu-app.onrender.com/api/v1/flow/confirm`
- **URL de retorno:** `https://tu-frontend.onrender.com/pago-exitoso`

#### **Datos de Prueba de Flow:**
- **Tarjeta:** 4051885600446623
- **CVV:** 123
- **Fecha:** Cualquier fecha futura
- **RUT:** 11.111.111-1

### 3. Comandos de Build en Render

```
Build Command: npm run build:prod
Start Command: npm run start:prod
```

### 4. Pruebas

#### **Prueba Local:**
```bash
# 1. Configurar .env local
cp env.example .env
# Editar .env con tus valores locales

# 2. Iniciar API
npm run start:dev

# 3. Probar Flow
npm run test:flow:local
```

#### **Prueba en Render:**
```bash
# 1. Configurar variables de entorno en Render
# 2. Desplegar
# 3. Probar con la URL de producción
npm run test:flow
```

### 5. Monitoreo de Pagos

#### **Local:**
```bash
npm run test:flow:local:monitor FLOW_ORDER_ID
```

#### **Producción:**
```bash
npm run test:flow:monitor FLOW_ORDER_ID
```

### 6. Endpoints de Flow

#### **Crear Orden:**
```
POST https://tu-app.onrender.com/api/v1/flow/crear-orden
```

#### **Consultar Estado:**
```
GET https://tu-app.onrender.com/api/v1/flow/status/:flowOrder
```

#### **Ver Detalles del Pago:**
```
GET https://tu-app.onrender.com/api/v1/flow/pago/:pagoId
```

#### **Webhook (Flow → Tu API):**
```
POST https://tu-app.onrender.com/api/v1/flow/confirm
```

### 7. Flujo Completo

1. **Usuario crea orden** → `POST /api/v1/flow/crear-orden`
2. **API crea pago en Flow** → Flow devuelve URL de pago
3. **Usuario completa pago** → En Flow con datos de prueba
4. **Flow envía webhook** → `POST /api/v1/flow/confirm`
5. **API actualiza estado** → Pago marcado como COMPLETADO
6. **Usuario es redirigido** → A `FRONT_URL/pago-exitoso`

### 8. Troubleshooting

#### **Error: "Usuario no encontrado"**
- Verifica que el `userId` existe en la base de datos
- Usa el script `node scripts/get-valid-user.js` para obtener un ID válido

#### **Error: "Firma de Flow no válida"**
- Verifica que `FLOW_SECRET_KEY` esté correctamente configurado
- Asegúrate de que las URLs de callback estén bien configuradas en Flow

#### **Error: "Error al crear pago en Flow"**
- Verifica que `FLOW_API_KEY` y `FLOW_COMMERCE_ID` estén correctos
- Asegúrate de que estés usando las credenciales correctas (sandbox vs producción)

#### **Webhook no llega**
- Verifica que la URL de confirmación en Flow sea accesible públicamente
- Revisa los logs de Render para ver si hay errores
- Asegúrate de que el endpoint `/api/v1/flow/confirm` esté funcionando

### 9. Logs y Monitoreo

#### **Ver logs en Render:**
- Ve a tu proyecto en Render
- Click en "Logs" para ver logs en tiempo real

#### **Logs importantes a monitorear:**
- `[FlowController] Creando orden de pago para usuario:`
- `[FlowController] Callback recibido de Flow:`
- `[FlowController] Pago marcado como COMPLETADO`

### 10. Seguridad

#### **Variables de Entorno Sensibles:**
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `FLOW_SECRET_KEY`
- `DB_PASSWORD`

**NUNCA** commits estos valores en el código. Siempre usa variables de entorno.

#### **Validación de Firma:**
Flow valida automáticamente la firma de los webhooks para asegurar que vengan de Flow.

### 11. Próximos Pasos

1. ✅ Configurar variables de entorno en Render
2. ✅ Configurar URLs de callback en Flow
3. ✅ Probar con datos de sandbox
4. 🔄 Migrar a credenciales de producción
5. 🔄 Configurar monitoreo y alertas
6. 🔄 Implementar manejo de errores avanzado 