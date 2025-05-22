# Dockerfile para la aplicación psicoespacios_BE en Fly.io

# Etapa de construcción (Builder Stage)
FROM node:23.11.0-alpine AS builder

# Establecer el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiar package.json y package-lock.json para instalar dependencias primero
# Esto ayuda a optimizar el caché de Docker
COPY package*.json ./

# Instalar las dependencias de producción y desarrollo
RUN npm ci

# Copiar el código fuente completo del proyecto
COPY . .

# Construir la aplicación (asumiendo que `npm run build` genera archivos en `dist/`)
RUN npm run build

# --- Etapa de Producción (Production Stage) ---
# Se utiliza una imagen base ligera para el entorno de producción
FROM node:23.11.0-alpine

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar package.json y package-lock.json para instalar solo las dependencias de producción
COPY package*.json ./

# Instalar solo las dependencias de producción
RUN npm ci --only=production

# Copiar los archivos de la aplicación ya construidos desde la etapa 'builder'
COPY --from=builder /app/dist ./dist

# Exponer el puerto en el que la aplicación escuchará (Fly.io lo redirigirá)
EXPOSE 3000

# Copiar los scripts de migración de la base de datos desde la etapa 'builder'
COPY --from=builder /app/src/database/migrations ./src/database/migrations

# Copiar el script de inicio específico para Fly.io
COPY --from=builder /app/scripts/start-in-fly.sh ./start.sh

# Asegurarse de que el script de inicio sea ejecutable
RUN chmod +x ./start.sh

# --- Consideraciones sobre .env ---
# Evita copiar archivos .env directamente a la imagen de Docker en producción.
# Es mejor usar las variables de entorno de Fly.io para secretos y configuraciones:
# flyctl secrets set VARIABLE_NOMBRE=valor
# Si realmente necesitas copiar un .env para desarrollo o pruebas en Fly.io,
# puedes descomentar la siguiente línea, pero no es la práctica recomendada para prod.
# RUN if [ -f /app/.env ]; then cp /app/.env ./; fi


# Configurar la variable de entorno HOST para que la aplicación escuche en todas las interfaces
# Esto es crucial para que Fly.io pueda alcanzar tu aplicación.
ENV HOST=0.0.0.0

# Comando para iniciar la aplicación cuando el contenedor se ejecute
# Este comando ejecutará el script 'start.sh' que hemos copiado y hecho ejecutable.
CMD ["./start.sh"]