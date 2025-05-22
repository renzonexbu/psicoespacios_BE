## 🚀 Scripts de Población de Base de Datos

El proyecto incluye scripts para poblar la base de datos con datos de prueba que facilitan el desarrollo y las pruebas del sistema. Estos scripts son especialmente útiles para configurar rápidamente un entorno de prueba en Fly.io o localmente.

Para más información sobre cómo utilizar estos scripts y qué datos incluyen, consulta la [documentación específica de población de base de datos](./docs/POPULATE_DB.md).

### Uso Rápido

```bash
# Ejecución local con conexión a Fly.io
./scripts/run-populate-flyio.sh

# Ejecución remota en Fly.io
./scripts/remote-populate-flyio.sh
```

> ⚠️ **Nota:** Estos scripts están diseñados para no crear duplicados si ya existen datos en las tablas.
