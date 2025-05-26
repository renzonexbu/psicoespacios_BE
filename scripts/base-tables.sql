-- Archivo SQL para crear las tablas base necesarias

-- Extensión uuid-ossp para generar UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla configuracion_sistema
CREATE TABLE IF NOT EXISTS "configuracion_sistema" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "configuracionGeneral" jsonb NOT NULL DEFAULT '{"nombreSistema":"PsicoEspacios","colorPrimario":"#3f51b5","colorSecundario":"#f50057","contactoSoporte":"contacto@psicoespacios.com"}',
  "configuracionReservas" jsonb NOT NULL DEFAULT '{"tiempoMinimoReserva":60,"tiempoMaximoReserva":240,"anticipacionMinima":24,"anticipacionMaxima":720,"intervaloHorario":[9,19]}',
  "configuracionPagos" jsonb NOT NULL DEFAULT '{"moneda":"CLP","comisionPlataforma":5,"metodosHabilitados":["TARJETA","TRANSFERENCIA"]}',
  "configuracionDerivacion" jsonb NOT NULL DEFAULT '{"especialidades":[],"modalidades":[],"tiempoMaximoRespuesta":48,"comisionDerivacion":10}',
  "configuracionSuscripciones" jsonb NOT NULL DEFAULT '{"periodosRenovacion":[1,3,6,12],"descuentosRenovacion":[]}',
  "configuracionNotificaciones" jsonb NOT NULL DEFAULT '{"emailsHabilitados":true,"plantillasEmail":{}}',
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "PK_7a64268fe7d5d782f91277b5f8c" PRIMARY KEY ("id")
);

-- Tabla users
CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "email" character varying NOT NULL,
  "password" character varying NOT NULL,
  "nombre" character varying NOT NULL,
  "apellido" character varying NOT NULL,
  "rut" character varying,
  "telefono" character varying,
  "role" character varying NOT NULL DEFAULT 'USUARIO',
  "especialidad" character varying,
  "bio" text,
  "fotoPerfil" character varying,
  "estado" character varying NOT NULL DEFAULT 'ACTIVO',
  "fechaCreacion" TIMESTAMP NOT NULL DEFAULT now(),
  "fechaActualizacion" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
  CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
);

-- Tabla sedes
CREATE TABLE IF NOT EXISTS "sedes" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "nombre" character varying NOT NULL,
  "direccion" character varying NOT NULL,
  "ciudad" character varying NOT NULL,
  "comuna" character varying,
  "descripcion" text,
  "activa" boolean NOT NULL DEFAULT true,
  "telefono" character varying,
  "email" character varying,
  "horarioAtencion" jsonb,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "PK_eef454a9fc26b3c3dc74a4c9e9a" PRIMARY KEY ("id")
);

-- Tabla boxes
CREATE TABLE IF NOT EXISTS "boxes" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "numero" character varying NOT NULL,
  "piso" integer NOT NULL,
  "descripcion" text,
  "capacidad" integer NOT NULL DEFAULT 2,
  "precioHora" numeric(10,2) NOT NULL,
  "precioJornada" numeric(10,2) NOT NULL,
  "equipamiento" jsonb,
  "dimensiones" jsonb,
  "activo" boolean NOT NULL DEFAULT true,
  "caracteristicas" text[],
  "sedeId" uuid,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "PK_46b1769cd5fdae40e51b24c0993" PRIMARY KEY ("id")
);

-- Relación boxes -> sedes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'FK_3c5e1ebfb1d5b6a42a5ae1be41b'
  ) THEN
    ALTER TABLE "boxes" 
    ADD CONSTRAINT "FK_3c5e1ebfb1d5b6a42a5ae1be41b" 
    FOREIGN KEY ("sedeId") 
    REFERENCES "sedes"("id") 
    ON DELETE SET NULL 
    ON UPDATE NO ACTION;
  END IF;
END
$$;

-- Tabla planes
CREATE TABLE IF NOT EXISTS "planes" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "tipo" character varying NOT NULL DEFAULT 'BASICO',
  "nombre" character varying NOT NULL,
  "descripcion" text,
  "precio" numeric(10,2) NOT NULL,
  "duracionMeses" integer NOT NULL DEFAULT 1,
  "caracteristicas" jsonb DEFAULT '[]',
  "horasIncluidas" integer NOT NULL DEFAULT 0,
  "descuentoHoraAdicional" numeric(5,2) DEFAULT 0,
  "descuento" numeric(5,2) DEFAULT 0,
  "activo" boolean NOT NULL DEFAULT true,
  "estado" character varying NOT NULL DEFAULT 'ACTIVO',
  "fechaCreacion" TIMESTAMP NOT NULL DEFAULT now(),
  "fechaActualizacion" TIMESTAMP NOT NULL DEFAULT now(),
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "PK_7b47e30cc7c4ecc52458b973673" PRIMARY KEY ("id")
);

-- Tabla suscripciones
CREATE TABLE IF NOT EXISTS "suscripciones" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "fechaInicio" TIMESTAMP NOT NULL,
  "fechaFin" TIMESTAMP NOT NULL,
  "estado" character varying NOT NULL DEFAULT 'PENDIENTE',
  "precioTotal" numeric(10,2) NOT NULL,
  "planId" uuid,
  "usuarioId" uuid,
  "horasConsumidas" integer NOT NULL DEFAULT 0,
  "horasDisponibles" integer NOT NULL DEFAULT 0,
  "fechaCreacion" TIMESTAMP NOT NULL DEFAULT now(),
  "fechaActualizacion" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "PK_ad388dc7a1c954827616213bc8b" PRIMARY KEY ("id")
);

-- Relaciones suscripciones
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'FK_d2f1ae9e6f0f1aba0d1b1b1b1b1'
  ) THEN
    ALTER TABLE "suscripciones" 
    ADD CONSTRAINT "FK_d2f1ae9e6f0f1aba0d1b1b1b1b1" 
    FOREIGN KEY ("planId") 
    REFERENCES "planes"("id") 
    ON DELETE SET NULL 
    ON UPDATE NO ACTION;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'FK_e2f1ae9e6f0f1aba0d1b1b1b1b1'
  ) THEN
    ALTER TABLE "suscripciones" 
    ADD CONSTRAINT "FK_e2f1ae9e6f0f1aba0d1b1b1b1b1" 
    FOREIGN KEY ("usuarioId") 
    REFERENCES "users"("id") 
    ON DELETE CASCADE 
    ON UPDATE NO ACTION;
  END IF;
END
$$;

-- Tabla pagos
CREATE TABLE IF NOT EXISTS "pagos" (
  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
  "monto" numeric(10,2) NOT NULL,
  "estado" character varying NOT NULL DEFAULT 'PENDIENTE',
  "tipo" character varying NOT NULL,
  "datosTransaccion" jsonb,
  "metadatos" jsonb,
  "notasReembolso" text,
  "fechaCompletado" TIMESTAMP,
  "fechaReembolso" TIMESTAMP,
  "suscripcionId" uuid,
  "solicitudDerivacionId" uuid,
  "usuarioId" uuid,
  "fechaCreacion" TIMESTAMP NOT NULL DEFAULT now(),
  "fechaActualizacion" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "PK_c7b3cf6a0bf49af33a4c2cb7dc7" PRIMARY KEY ("id")
);

-- Relaciones pagos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'FK_f7b3cf6a0bf49af33a4c2cb7dc7'
  ) THEN
    ALTER TABLE "pagos" 
    ADD CONSTRAINT "FK_f7b3cf6a0bf49af33a4c2cb7dc7" 
    FOREIGN KEY ("suscripcionId") 
    REFERENCES "suscripciones"("id") 
    ON DELETE SET NULL 
    ON UPDATE NO ACTION;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'FK_g7b3cf6a0bf49af33a4c2cb7dc7'
  ) THEN
    ALTER TABLE "pagos" 
    ADD CONSTRAINT "FK_g7b3cf6a0bf49af33a4c2cb7dc7" 
    FOREIGN KEY ("usuarioId") 
    REFERENCES "users"("id") 
    ON DELETE SET NULL 
    ON UPDATE NO ACTION;
  END IF;
END
$$;
