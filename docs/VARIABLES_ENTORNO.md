# Variables de entorno — PsicoEspacios Backend

Plantilla lista para copiar: [.env.example](../.env.example).

## Obligatorias (casi todos los entornos)

| Variable | Descripción |
|----------|-------------|
| `JWT_SECRET` | Secreto para firmar access tokens. **Cambiar en producción.** |
| `DATABASE_URL` | Connection string PostgreSQL (recomendado en prod). |
| *o* `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_NAME` | Conexión por campos (desarrollo local). |

## Aplicación

| Variable | Default | Descripción |
|----------|---------|-------------|
| `NODE_ENV` | `development` | `production` activa SSL en BD y URLs Flow prod. |
| `PORT` | `3000` | Puerto HTTP del API. |
| `FRONT_URL` | `http://localhost:3001` | Frontend (redirects Flow, links en mails). |
| `API_URL` | `http://localhost:3000` | URL pública del backend (callbacks). |

## JWT

| Variable | Default |
|----------|---------|
| `JWT_EXPIRATION` | `24h` |

## Flow (pagos y suscripciones)

| Variable | Descripción |
|----------|-------------|
| `FLOW_API_KEY` | API Key comercio Flow |
| `FLOW_SECRET_KEY` | Secret para firmar requests |
| `FLOW_COMMERCE_ID` | ID comercio |
| `FLOW_PAYMENT_METHOD` | Método de pago (default `1`) |
| `FLOW_SUBSCRIPTIONS_CALLBACK_URL` | Webhook suscripciones (opcional) |
| `FLOW_CUSTOMER_REGISTER_RETURN_URL` | Return URL registro cliente Flow |

> En sandbox, si no configuras env, `flow.service.ts` usa valores por defecto de prueba — **no usar así en producción**.

## Correo (SMTP)

### Cuenta principal (`MailService` default)

| Variable | Descripción |
|----------|-------------|
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_SECURE` | Servidor SMTP |
| `MAIL_USER`, `MAIL_PASS` | Credenciales |
| `MAIL_FROM`, `MAIL_FROM_NAME` | Remitente |

### Cuenta alternativa (pacientes / derivación — `fromAccount: 'alt'`)

| Variable | Descripción |
|----------|-------------|
| `MAIL_ALT_HOST`, `MAIL_ALT_PORT`, `MAIL_ALT_SECURE` | |
| `MAIL_ALT_USER`, `MAIL_ALT_PASS` | |
| `MAIL_ALT_FROM`, `MAIL_ALT_FROM_NAME` | |

| Variable | Descripción |
|----------|-------------|
| `MAIL_TEMPLATES_PATH` | Ruta custom a `.hbs` (opcional) |

## Backblaze B2 (uploads S3-compatible)

| Variable | Descripción |
|----------|-------------|
| `BACKBLAZE_ACCESS_KEY_ID` o `BACKBLAZE_ACCOUNT_ID` | |
| `BACKBLAZE_SECRET_ACCESS_KEY` o `BACKBLAZE_APPLICATION_KEY` | |
| `BACKBLAZE_BUCKET_NAME` | Nombre del bucket |
| `BACKBLAZE_REGION` | ej. `us-east-005` |
| `BACKBLAZE_ENDPOINT` | URL S3 del bucket |

Ver [BACKBLAZE_SETUP.md](./BACKBLAZE_SETUP.md).

## reCAPTCHA (opcional)

| Variable | Default |
|----------|---------|
| `RECAPTCHA_SECRET_KEY` | — |
| `RECAPTCHA_V3_MIN_SCORE` | `0.5` |

## Variables legacy / scripts

Algunos scripts en raíz usan nombres distintos: `DB_HOST`, `DB_USERNAME`, `DB_NAME`, etc. Preferir las variables documentadas en `.env.example` para la app Nest.

## Docker Compose local

En `docker-compose.yml`:

- Usuario: `psicoespacios_user`
- Contraseña: **`psicoespacios_pass`**
- Base: `psicoespacios`
- Puerto: `5432`
