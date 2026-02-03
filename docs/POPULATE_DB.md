# 🚀 Población de la Base de Datos en Fly.io

Este documento explica cómo utilizar los scripts para poblar la base de datos en Fly.io con datos de ejemplo que facilitarán el desarrollo y las pruebas.

## 📊 Datos Incluidos

El script de población crea registros en todas las tablas del sistema:

- 👥 Usuarios con diferentes roles (admin, psicólogo, paciente)
- 🏢 Sedes y boxes con diversas configuraciones
- 📅 Reservas en diferentes estados (pendientes, confirmadas, canceladas)
- 💼 Perfiles de derivación con especialidades variadas
- 👨‍👩‍👧‍👦 Pacientes con diferentes condiciones
- 📝 Fichas de sesión con motivos de consulta diversos
- 💰 Suscripciones y pagos en varios estados
- 🔄 Solicitudes de derivación
- 📞 Contactos (consultas, reclamos, sugerencias)

## 🛠️ Scripts Disponibles

### 1. `populate-flyio-db.js`

Este es el script principal que contiene la lógica para poblar la base de datos. Incluye validadores para evitar errores si las tablas ya contienen datos.

### 2. `populate-db.sh`

Script auxiliar para ejecutar el script principal con la configuración correcta.

### 3. `run-populate-flyio.sh`

Script que configura las variables de entorno necesarias y ejecuta el script de población.

### 4. `remote-populate-flyio.sh`

Script para ejecutar el proceso de población remotamente desde tu máquina local, copiando el script a la instancia de Fly.io y ejecutándolo allí.

## 🧰 Formas de Uso

### Método 1: Verificación y Población con Detección Automática de Credenciales

Este método verifica la conexión a la base de datos, muestra información sobre las tablas existentes y luego te permite poblarla en un solo paso:

```bash
# Ejecutar el script de verificación y población
./scripts/check-and-populate-flyio.sh
```

### Método 2: Ejecución Directa de Población

Este método ejecuta directamente el script de población con detección automática de credenciales:

```bash
# Ejecutar el script de población
./scripts/run-populate-flyio.sh
```

### Método 3: Ejecución Remota

Este método ejecuta el script de población directamente en el servidor de fly.io:

```bash
# Ejecutar el script de población remotamente
./scripts/remote-populate-flyio.sh
```

También puedes usar el script auxiliar:

```bash
./scripts/run-populate-flyio.sh
```

### Método 2: Ejecución Remota desde tu Máquina

Este método copia el script a la instancia de Fly.io y lo ejecuta allí.

```bash
./scripts/remote-populate-flyio.sh
```

### Método 3: Ejecución Directa en Fly.io

Este método requiere que te conectes directamente a la instancia de Fly.io.

```bash
# Conéctate a la instancia
fly ssh console

# Navega al directorio de la aplicación
cd /app

# Ejecuta el script
node scripts/populate-flyio-db.js
```

## 🔌 Conexión mediante Proxy

Los scripts utilizan `fly proxy` para establecer una conexión local segura a la base de datos PostgreSQL en fly.io. Este método es más seguro y confiable que intentar conectarse directamente con la URL de la base de datos.

El proceso funciona así:

1. Se crea un túnel seguro desde tu máquina local al servidor PostgreSQL en fly.io
2. Los scripts intentan automáticamente diferentes combinaciones de credenciales hasta encontrar una que funcione
3. Una vez establecida la conexión, se ejecuta el script de población

Si tienes problemas de conexión, asegúrate de:

1. Estar correctamente autenticado en fly.io (`flyctl auth login`)
2. Tener una instancia PostgreSQL configurada y conectada a tu aplicación
3. Tener permisos suficientes para acceder a la base de datos

## ⚠️ Consideraciones Importantes

1. **Evitar Duplicados**: Los scripts están diseñados para verificar si ya existen datos en cada tabla antes de intentar insertar nuevos registros.

2. **Dependencias entre Tablas**: Las tablas se pueblan en un orden específico para respetar las dependencias (primero usuarios, luego pacientes, etc.).

3. **Contraseñas**: Las contraseñas de los usuarios de ejemplo están hasheadas con bcryptjs. La contraseña para todos los usuarios de ejemplo es "admin123".

4. **Estados Variados**: Se crean registros con diferentes estados para probar todas las funcionalidades del sistema.

5. **Datos Realistas**: Los datos generados intentan ser lo más realistas posible para facilitar las pruebas de la aplicación.

## 🔄 Mantenimiento y Actualización

Si se agregan nuevas tablas o campos al modelo de datos, asegúrate de actualizar el script `populate-flyio-db.js` para incluir estos cambios.

---

Para cualquier problema o sugerencia relacionada con estos scripts, por favor crear un issue en el repositorio.
