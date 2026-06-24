# Traspaso del proyecto — PsicoEspacios Backend

Documento orientado a un desarrollador nuevo que asume el mantenimiento del API. Última revisión: junio 2026.

---

## 1. Qué es este repositorio

API REST en **NestJS 11** + **TypeScript** + **PostgreSQL** para la plataforma **PsicoEspacios**: reservas de boxes, sesiones con psicólogos, pagos (Flow), matching paciente–psicólogo, derivaciones, packs de horas, correos transaccionales y gestión administrativa.

| Item | Valor |
|------|--------|
| Runtime | Node.js **≥ 20.11.1** |
| Puerto por defecto | `3000` |
| Rama principal | `main` (remoto: `origin/main`; también existe `origin/dev`) |
| Último commit revisado | `Enhance reservation and email services with detailed location information` |

---

## 2. Puesta en marcha local (checklist)

```bash
git clone <repo>
cd psicoespacios_BE
npm install
cp .env.example .env   # completar credenciales
docker-compose up -d   # PostgreSQL en 5432
npm run db:setup-full  # o db:migrate:win en Windows
npm run start:dev
```

Verificar:

- `GET http://localhost:3000/api/v1/health` → debe responder OK.
- Logs: migraciones al arranque (`AppModule.onModuleInit` ejecuta `runMigrations()`).

Verificar health: `GET http://localhost:3000/api/v1/health` tras `docker-compose up -d` y `npm run start:dev`. La contraseña por defecto coincide con Docker (`psicoespacios_pass`).

---

## 3. Arquitectura de módulos

```
src/
├── auth/              Login, JWT, refresh tokens, onboarding-status
├── psicologos/        Perfil, agenda, disponibilidad, matching, documentos
├── reservas/          Reservas de box (tabla reservas)
├── reservas-psicologos/  Sesiones psicólogo–paciente (reservas_sesiones)
├── boxes/             CRUD boxes + reservas de box
├── sedes/             Sedes y horarios
├── pagos/             Flow, confirmación de sesión, simulador
├── derivacion/        Centro de derivación
├── gestion/           Pacientes, planes, suscripciones, archivos, historial
├── mail/              Nodemailer + plantillas Handlebars (.hbs)
├── packs/             Packs de horas
├── arriendos/         Arriendos recurrentes de box
├── consolidado/       Reportes consolidados
├── uploads/           Backblaze B2
├── admin/, reportes/, blogs/, vouchers/, contacto/, notas/
└── common/            Entidades, guards, enums, utils
```

**Entidades clave:**

| Tabla / entidad | Uso |
|-----------------|-----|
| `users` | Usuarios (roles: ADMIN, PSICOLOGO, PACIENTE) |
| `psicologo` | Perfil profesional + **matching** (arrays de experiencia, modalidad, etc.) |
| `pacientes` | Perfil paciente + matching |
| `reservas` | Reserva de **box** por hora (psicólogo arrienda espacio) |
| `reservas_sesiones` | **Sesión** clínica psicólogo–paciente |
| `boxes`, `sedes` | Espacios físicos |
| `pagos` | Pagos de sesiones y otros |

Relación importante: `psicologo` tiene `id` propio (UUID) y relación `OneToOne` con `users`. Muchos endpoints usan **`req.user.id`** (id del usuario JWT), no el id de la fila `psicologo`.

---

## 4. Prefijos de rutas (inconsistencia a tener en cuenta)

No todos los controladores usan `api/v1`:

| Prefijo | Ejemplos |
|---------|----------|
| `api/v1/...` | `auth`, `reservas`, `reservas-sesiones`, `pagos`, `flow`, `sedes`, `boxes` |
| Sin prefijo | `matching`, `arriendos`, `psicologos` (gestión legacy), `pacientes-matching` |

El frontend debe concatenar `{API_URL}` + ruta exacta. Ejemplos:

- Login: `POST /api/v1/auth/login`
- Onboarding psicólogo: `POST /matching/psicologo/perfil`
- Sesiones: `POST /api/v1/reservas-sesiones`

---

## 5. Flujos de negocio críticos

### 5.1 Autenticación

- JWT en header `Authorization: Bearer <token>`.
- Refresh token en `POST /api/v1/auth/refresh-token`.
- Psicólogo con subrol `CDD` o `AMBOS`: login devuelve `user.hasOnboarding` según **perfil de matching completo** (no solo existencia de fila en `psicologo`).
- Doc detallada: [AUTH_INTEGRATION.md](./AUTH_INTEGRATION.md).

### 5.2 Onboarding psicólogo (matching)

| Acción | Método y ruta |
|--------|----------------|
| Guardar formulario | `POST /matching/psicologo/perfil` |
| Estado del perfil | `GET /matching/estado-perfil` |
| Reset (rehacer onboarding) | `DELETE /matching/psicologo/perfil` |
| Reset por admin | `DELETE /matching/psicologo/usuario/:usuarioId/perfil` |
| Estado vía auth | `GET /api/v1/auth/onboarding-status` |

Campos del body: `diagnosticos_experiencia`, `temas_experiencia`, `estilo_terapeutico`, `enfoque_teorico`, `afinidad_paciente_preferida`, `genero` (M/F/N), `modalidad_atencion` (array).

Al completar perfil válido, el servicio puede pasar `users.estado` de `PENDIENTE` → `ACTIVO`.

Doc: [SISTEMA_MATCHING.md](./SISTEMA_MATCHING.md).

**Bug corregido (jun 2026):** `crearPerfilMatchingPsicologo` debe buscar por `usuario.id`, no por `psicologo.id`, para no intentar duplicar fila (`UQ_psicologo_usuario`) tras un reset.

### 5.3 Reserva de box (psicólogo arrienda hora)

- Crear: `POST /api/v1/boxes/reservations` (o módulo boxes según controller).
- Cancelar: `DELETE` / cancel en `reservas.service` → email `reserva-box-confirmada` / `reserva-box-cancelada`.
- Precio de box en sesión presencial: se toma de `boxes.precio` × duración (no tarifa fija 5000).

### 5.4 Sesión psicólogo–paciente

- CRUD: `/api/v1/reservas-sesiones`.
- Sesión presencial: crea también reserva en `reservas` (box) y guarda en `metadatos.ubicacion` sede + dirección + box.
- Emails: `sesion-confirmada-derivacion` (paciente, cuenta ALT), `sesion-confirmada-psicologo`.

### 5.5 Pagos Flow

- Crear orden: `POST /api/v1/pagos/crear-orden-flow`.
- Callbacks y redirects: `/api/v1/flow/*`.
- Doc: [FLUJO_PAGO_FLOW_FRONTEND.md](./FLUJO_PAGO_FLOW_FRONTEND.md), [FLUJO_DESPUES_PAGO_FLOW.md](./FLUJO_DESPUES_PAGO_FLOW.md).

### 5.6 Correos

- Plantillas: `src/mail/templates/*.hbs`.
- Dos cuentas SMTP: default (psicólogos) y `alt` (pacientes / derivación).
- Utilidad de ubicación: `src/common/utils/ubicacion-presencial.ts`.

---

## 6. Variables de entorno

Plantilla completa: [.env.example](../.env.example) y [VARIABLES_ENTORNO.md](./VARIABLES_ENTORNO.md).

Mínimo para desarrollo local:

- `DATABASE_*` o `DATABASE_URL`
- `JWT_SECRET`
- `FRONT_URL`, `API_URL`
- Mail y Flow según funcionalidad a probar

---

## 7. Base de datos y migraciones

- Migraciones en `src/database/migrations/`.
- Al iniciar la app se ejecutan migraciones automáticamente.
- Scripts: `npm run db:migrate`, `npm run db:migrate:win`, `npm run db:setup-full`.
- Doc: [DATABASE_SETUP.md](./DATABASE_SETUP.md), [MIGRATIONS.md](./MIGRATIONS.md).

- Al iniciar la app se ejecutan migraciones automáticamente (`onModuleInit`). Desarrollo y producción usan `synchronize: false`.

---

## 8. Despliegue

- Documentación histórica: [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md), sección Fly.io en [README.md](../README.md).
- Producción típica: `DATABASE_URL`, `NODE_ENV=production`, secrets de Flow/Mail/Backblaze en el panel del hosting.

---

## 9. Pruebas y scripts

- Tests Jest formales: pocos (`*.spec.ts`); cobertura limitada.
- Muchos scripts manuales en raíz: `test-*.js`, `scripts/test-*.js` (Flow, matching, uploads, etc.).
- Postman: `PsicoEspacios_Matching_System.postman_collection.json`.

Para smoke test rápido: health + login + un endpoint del módulo que vayas a tocar.

---

## 10. Hallazgos de revisión (estado al traspaso)

### OK / estable

- Build: `npm run build` compila sin errores.
- Repositorio en `main` limpio (sin cambios sin commitear al momento de la revisión).
- Flujos recientes de correos (ubicación sede/box), precio de box desde BD, reset y re-onboarding de psicólogo corregidos en código.

### Atención / deuda técnica

1. **Prefijos de API inconsistentes** (`api/v1` vs rutas sueltas) — coordinar con frontend.
2. **FlowService** incluye valores por defecto de sandbox en código (`flow.service.ts`) — en producción deben sobrescribirse siempre con env.
3. **Scripts `test-*.js` en raíz** — útiles pero desordenados; no son suite CI.

### Corregido en mantenimiento reciente

- Contraseña por defecto alineada con Docker (`psicoespacios_pass`).
- `synchronize: false` también en desarrollo local (solo migraciones).
- Referencias a Swagger eliminadas del README (no está configurado en `main.ts`).
- **Limpieza de esquema legacy** (migración `DropLegacyUnusedTables1767000000000`): eliminadas tablas `disponibilidad_psicologos`, `reservas_psicologos`, `fichas_sesion`, `configuracion_matching`. Eliminado código muerto: entidad `reservas_boxes`, mock `psicologos.service.ts` en memoria, clases TS sueltas en `psicologos/entities/`.

**Mapa de tablas vigente (no confundir):**

| Tabla | Qué guarda |
|-------|------------|
| `reservas` | Arriendo/reserva de **box** |
| `reservas_sesiones` | **Sesión** clínica psicólogo–paciente |
| `psicologo_disponibilidad` | Horarios disponibles del psicólogo |
| `psicologo` | Perfil profesional (no existe tabla `psicologos`) |

### Seguridad

- No commitear `.env`, claves Flow, SMTP ni Backblaze.
- Rotar `JWT_SECRET` si hubo exposición.
- Revisar permisos `RolesGuard` al añadir endpoints nuevos.

---

## 11. Índice de documentación existente

Ver [INDICE_DOCUMENTACION.md](./INDICE_DOCUMENTACION.md) para listado completo de archivos en `/docs`.

Documentos más usados día a día:

| Tema | Archivo |
|------|---------|
| Auth / tokens | AUTH_INTEGRATION.md |
| Matching | SISTEMA_MATCHING.md |
| Pagos Flow | FLUJO_PAGO_FLOW_FRONTEND.md |
| BD local | DATABASE_SETUP.md |
| Migraciones | MIGRATIONS.md |
| Backblaze | BACKBLAZE_SETUP.md |
| Variables | VARIABLES_ENTORNO.md |

---

## 12. Contacto y accesos a transferir (rellenar por el equipo saliente)

| Recurso | Responsable / notas |
|---------|---------------------|
| Repositorio Git | |
| Hosting API (URL prod) | |
| PostgreSQL prod | |
| Cuenta Flow (sandbox + prod) | |
| SMTP principal + ALT | |
| Backblaze B2 | |
| Frontend (repo + URL) | |
| DNS / SSL | |

---

## 13. Comandos de referencia rápida

```bash
npm run start:dev          # desarrollo con hot reload
npm run build              # compilar
npm run lint               # ESLint
npm run test               # Jest unitario
docker-compose up -d       # PostgreSQL local
npm run db:migrate:win     # migraciones (Windows)
```
