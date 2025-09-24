# Endpoint de Precios de Psicólogos

## Descripción
Endpoints para obtener y actualizar los precios de consulta de los psicólogos (online y presencial).

## Base URL
```
/api/v1/psicologos
```

## Endpoints Disponibles

### 1. Obtener Precios del Psicólogo
**GET** `/:usuarioId/precios`

Obtiene los precios actuales de un psicólogo específico.

#### Parámetros
- `usuarioId` (string, requerido): ID del usuario psicólogo

#### Headers
```
Authorization: Bearer {token}
```

#### Roles Permitidos
- ADMIN
- PSICOLOGO
- PACIENTE

#### Respuesta Exitosa (200)
```json
{
  "precioOnline": 25000,
  "precioPresencial": 30000,
  "updatedAt": "2024-08-14T10:30:00.000Z"
}
```

#### Respuesta sin Precios (200)
```json
{
  "precioOnline": null,
  "precioPresencial": null,
  "updatedAt": "2024-08-14T10:30:00.000Z"
}
```

### 2. Actualizar Precios del Psicólogo
**PATCH** `/:usuarioId/precios`

Actualiza los precios de consulta de un psicólogo específico.

#### Parámetros
- `usuarioId` (string, requerido): ID del usuario psicólogo

#### Headers
```
Authorization: Bearer {token}
Content-Type: application/json
```

#### Roles Permitidos
- ADMIN
- PSICOLOGO

#### Body (UpdatePreciosDto)
```json
{
  "precioOnline": 25000,
  "precioPresencial": 30000
}
```

**Campos:**
- `precioOnline` (number, opcional): Precio para consultas online
- `precioPresencial` (number, opcional): Precio para consultas presenciales

**Validaciones:**
- Ambos campos son opcionales
- Deben ser números positivos
- Máximo valor: 999,999.99

#### Respuesta Exitosa (200)
```json
{
  "precioOnline": 25000,
  "precioPresencial": 30000,
  "updatedAt": "2024-08-14T10:35:00.000Z"
}
```

## Ejemplos de Uso

### Obtener Precios
```bash
curl -X GET "http://localhost:3000/api/v1/psicologos/a1129fd3-5456-49e4-a11f-96563a8aacc2/precios" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Actualizar Precios
```bash
curl -X PATCH "http://localhost:3000/api/v1/psicologos/a1129fd3-5456-49e4-a11f-96563a8aacc2/precios" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "precioOnline": 25000,
    "precioPresencial": 30000
  }'
```

### Actualizar Solo Precio Online
```bash
curl -X PATCH "http://localhost:3000/api/v1/psicologos/a1129fd3-5456-49e4-a11f-96563a8aacc2/precios" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "precioOnline": 25000
  }'
```

## Códigos de Respuesta

| Código | Descripción |
|--------|-------------|
| 200 | Operación exitosa |
| 400 | Datos de entrada inválidos |
| 401 | No autorizado (token inválido) |
| 403 | Acceso denegado (rol insuficiente) |
| 404 | Psicólogo no encontrado |
| 500 | Error interno del servidor |

## Notas Técnicas

### Seguridad
- **Autenticación requerida**: Todos los endpoints requieren JWT válido
- **Autorización por roles**: Diferentes niveles de acceso según el rol
- **Validación de datos**: Los precios se validan antes de guardar

### Base de Datos
- Los precios se almacenan en la tabla `psicologo`
- Se actualiza automáticamente el campo `updatedAt`
- Los precios pueden ser `null` si no están configurados

### Lógica de Negocio
- Solo se actualizan los campos proporcionados en el body
- Los precios se validan para ser números positivos
- Se mantiene el historial de cambios a través de `updatedAt`

## Implementación en el Código

### Controlador
```typescript
// src/psicologos/psicologos.controller.ts

@Get(':id/precios')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.PSICOLOGO, Role.PACIENTE)
async getPrecios(@Param('id') usuarioId: string) {
  return this.psicologosService.getPrecios(usuarioId);
}

@Patch(':id/precios')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.PSICOLOGO)
async updatePrecios(
  @Param('id') usuarioId: string, 
  @Body() updatePreciosDto: UpdatePreciosDto
) {
  return this.psicologosService.updatePrecios(usuarioId, updatePreciosDto);
}
```

### Servicio
```typescript
// src/gestion/services/psicologos.service.ts

async getPrecios(usuarioId: string): Promise<{
  precioOnline: number | null;
  precioPresencial: number | null;
  updatedAt: Date;
}> {
  const psicologo = await this.findByUserId(usuarioId);
  
  return {
    precioOnline: psicologo.precioOnline,
    precioPresencial: psicologo.precioPresencial,
    updatedAt: psicologo.updatedAt
  };
}

async updatePrecios(usuarioId: string, precios: {
  precioOnline?: number;
  precioPresencial?: number;
}): Promise<{
  precioOnline: number | null;
  precioPresencial: number | null;
  updatedAt: Date;
}> {
  const psicologo = await this.findByUserId(usuarioId);
  
  // Actualizar solo los precios proporcionados
  if (precios.precioOnline !== undefined) {
    psicologo.precioOnline = precios.precioOnline;
  }
  if (precios.precioPresencial !== undefined) {
    psicologo.precioPresencial = precios.precioPresencial;
  }
  
  // Guardar cambios
  const psicologoActualizado = await this.psicologoRepository.save(psicologo);
  
  return {
    precioOnline: psicologoActualizado.precioOnline,
    precioPresencial: psicologoActualizado.precioPresencial,
    updatedAt: psicologoActualizado.updatedAt
  };
}
```

### DTOs
```typescript
// src/psicologos/dto/precios.dto.ts

export class UpdatePreciosDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(999999.99)
  precioOnline?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(999999.99)
  precioPresencial?: number;
}

export class PreciosResponseDto {
  id: string;
  precioOnline: number | null;
  precioPresencial: number | null;
  updatedAt: Date;
}
```
