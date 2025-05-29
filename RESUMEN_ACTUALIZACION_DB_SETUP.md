# Configuración de Base de Datos en PsicoEspacios

**Fecha:** 28 de mayo de 2025

## Solución a problemas con la creación de la base de datos

Se han creado tres scripts diferentes para inicializar la base de datos desde cero, cada uno con un enfoque diferente para resolver los problemas que se estaban experimentando:

### 1. Script PowerShell (Recomendado para Windows)

El script `Reset-Database.ps1` es la opción más robusta para Windows.

**Para ejecutarlo:**

```powershell
# Abrir PowerShell y ejecutar
.\Reset-Database.ps1
```

Este script:

- Verifica que Docker esté en ejecución
- Elimina el contenedor y volumen existente
- Crea un nuevo contenedor usando docker-compose
- Espera apropiadamente a que PostgreSQL esté listo
- Crea la extensión uuid-ossp de manera confiable
- Ejecuta todas las migraciones

### 2. Script Batch para Windows

El archivo `setup-database.bat` se ha mejorado para ser más robusto.

**Para ejecutarlo:**

```cmd
setup-database.bat
```

Este script hace esencialmente lo mismo que la versión PowerShell, pero usando comandos batch de Windows.

### 3. Script Node.js

Se ha creado una versión mejorada del script Node.js como `db-reset-docker-fixed.js` que también implementa una solución más robusta.

**Para ejecutarlo:**

```bash
npm run db:reset
```

## Detalles técnicos de la solución

El problema principal que se estaba experimentando era:

1. El contenedor de PostgreSQL iniciaba correctamente, pero el servicio PostgreSQL dentro del contenedor no estaba completamente listo cuando se intentaba ejecutar los comandos SQL.

2. La sintaxis para ejecutar comandos SQL dentro de un contenedor Docker desde PowerShell/CMD requiere un manejo especial de las comillas y caracteres de escape.

Las soluciones implementadas abordan estos problemas mediante:

1. **Esperas adecuadas**: Se aumentó el tiempo de espera y se implementaron comprobaciones activas usando `pg_isready` para verificar que PostgreSQL esté completamente disponible.

2. **Manejo correcto de comandos SQL**: Se mejoró la forma de pasar comandos SQL al contenedor Docker, utilizando bash como intermediario.

3. **Gestión de errores mejorada**: Se implementaron verificaciones adicionales y mensajes de error más descriptivos.

## Recomendaciones

1. **Usar el script PowerShell** (Reset-Database.ps1) en entornos Windows, ya que proporciona la experiencia más confiable.

2. En caso de problemas, el script proporciona mensajes detallados para facilitar la solución.

3. Asegurarse de que Docker Desktop esté en ejecución antes de iniciar cualquier script.

## Recordatorios importantes

1. **TODOS estos scripts eliminarán los datos existentes** en la base de datos. Úsalos solo en entornos de desarrollo o cuando sea seguro perder los datos.

2. Si necesitas preservar datos, considera realizar una copia de seguridad antes de ejecutar estos scripts.

3. En producción, usa el enfoque adecuado según tu estrategia de despliegue, generalmente a través de migraciones controladas sin restablecer toda la base de datos.
