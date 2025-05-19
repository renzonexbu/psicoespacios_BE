# 🏥 PsicoEspacios - Backend

<p align="center">
  <img src="https://img.shield- `/src/pagos` - Procesamiento de pagos
- `/src/reportes` - Generación de reportes
- `/src/reservas` - Sistema de reservas
- `/src/sedes` - Administración de sedes
- `/src/contacto` - Gestión de mensajes de contacto/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS Badge"/>
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript Badge"/>
  <img src="https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white" alt="Docker Badge"/>
</p>

## 📋 Descripción

PsicoEspacios es una plataforma integral para la gestión de espacios terapéuticos y consultas psicológicas. Este repositorio contiene el backend de la aplicación, desarrollado con NestJS.

### 🎯 Características Principales

- 👥 Gestión de usuarios y roles (profesionales, pacientes, administradores)
- 📅 Sistema de reservas y agenda
- 💰 Gestión de pagos y suscripciones
- 📍 Administración de sedes y boxes
- 📊 Reportes y estadísticas
- 🔄 Sistema de derivaciones
- 📝 Gestión de fichas de sesión
- 📞 Módulo de contacto y atención al cliente

## 🛠️ Tecnologías Utilizadas

- **Framework:** NestJS
- **Lenguaje:** TypeScript
- **Base de Datos:** PostgreSQL
- **Contenedorización:** Docker
- **Autenticación:** JWT

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js (v16 o superior)
- Docker y Docker Compose
- npm o yarn

### Instalación

1. Clonar el repositorio:
\`\`\`bash
git clone [URL_DEL_REPOSITORIO]
cd psicoespacios_BE
\`\`\`

2. Instalar dependencias:
\`\`\`bash
npm install
\`\`\`

3. Configurar variables de entorno:
\`\`\`bash
cp .env.example .env
# Editar .env con tus configuraciones
\`\`\`

4. Iniciar servicios con Docker:
\`\`\`bash
docker-compose up -d
\`\`\`

5. Iniciar la aplicación:
\`\`\`bash
# Desarrollo
npm run start:dev

# Producción
npm run start:prod
\`\`\`

## 🗂️ Estructura del Proyecto

- \`/src/admin\` - Módulo de administración
- \`/src/auth\` - Autenticación y autorización
- \`/src/boxes\` - Gestión de espacios terapéuticos
- \`/src/derivacion\` - Sistema de derivaciones
- \`/src/gestion\` - Gestión de pacientes y planes
- \`/src/pagos\` - Procesamiento de pagos
- \`/src/reportes\` - Generación de reportes
- \`/src/reservas\` - Sistema de reservas
- \`/src/sedes\` - Administración de sedes

## 🧪 Testing

\`\`\`bash
# Tests unitarios
npm run test

# Tests e2e
npm run test:e2e

# Cobertura
npm run test:cov
\`\`\`

## 📚 Documentación API

La documentación de la API está disponible en:
- Swagger UI: \`http://localhost:3000/api\`
- OpenAPI JSON: \`http://localhost:3000/api-json\`

## 🤝 Contribución

1. Fork el proyecto
2. Crea tu Feature Branch (\`git checkout -b feature/AmazingFeature\`)
3. Commit tus cambios (\`git commit -m 'Add some AmazingFeature'\`)
4. Push al Branch (\`git push origin feature/AmazingFeature\`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo \`LICENSE\` para más detalles.
