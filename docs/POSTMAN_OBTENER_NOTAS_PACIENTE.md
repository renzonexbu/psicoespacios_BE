# Postman Collection: Obtener Notas por Paciente

## Endpoint: GET /api/v1/notas/paciente/:pacienteId

### **Configuración de la Request**

#### **1. Request Básica**
```
Method: GET
URL: {{base_url}}/api/v1/notas/paciente/{{pacienteId}}
```

#### **2. Headers**
```
Authorization: Bearer {{access_token}}
Content-Type: application/json
```

#### **3. Variables de Entorno**
```json
{
  "base_url": "http://localhost:3000",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "pacienteId": "123e4567-e89b-12d3-a456-426614174000"
}
```

### **Ejemplos de Uso**

#### **Ejemplo 1: Obtener Notas de un Paciente Específico**

**Request**:
```http
GET {{base_url}}/api/v1/notas/paciente/{{pacienteId}}
Authorization: Bearer {{access_token}}
```

**Response (200 OK)**:
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "pacienteId": "123e4567-e89b-12d3-a456-426614174000",
    "pacienteNombre": "María González",
    "contenido": "Evaluación inicial del paciente. Se observan síntomas de ansiedad moderada. El paciente presenta dificultades para dormir y concentrarse en el trabajo.",
    "titulo": "Evaluación Inicial - Ansiedad",
    "tipo": "evaluacion",
    "esPrivada": false,
    "metadatos": {
      "prioridad": "alta",
      "estado": "completada",
      "tags": ["evaluacion", "ansiedad", "inicial"],
      "sintomas": ["insomnio", "dificultad_concentracion", "preocupacion_excesiva"]
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "pacienteId": "123e4567-e89b-12d3-a456-426614174000",
    "pacienteNombre": "María González",
    "contenido": "Primera sesión de terapia cognitivo-conductual. Trabajamos en técnicas de respiración y relajación muscular progresiva. El paciente mostró buena disposición.",
    "titulo": "Sesión 1 - Técnicas de Relajación",
    "tipo": "sesion",
    "esPrivada": false,
    "metadatos": {
      "prioridad": "media",
      "estado": "completada",
      "tags": ["sesion", "tecnicas", "relajacion"],
      "tecnicas_aplicadas": ["respiración_diafragmática", "relajación_muscular_progresiva"],
      "duracion_sesion": "50_minutos"
    },
    "createdAt": "2024-01-10T09:00:00.000Z",
    "updatedAt": "2024-01-10T09:00:00.000Z"
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "pacienteId": "123e4567-e89b-12d3-a456-426614174000",
    "pacienteNombre": "María González",
    "contenido": "Nota privada: El paciente mencionó en confianza que tiene pensamientos suicidas ocasionales. Se requiere monitoreo estrecho y posible derivación a psiquiatra.",
    "titulo": "Nota Privada - Pensamientos Suicidas",
    "tipo": "observacion",
    "esPrivada": true,
    "metadatos": {
      "prioridad": "critica",
      "estado": "requiere_accion",
      "tags": ["privada", "riesgo", "suicidio"],
      "acciones_requeridas": ["monitoreo_estrecho", "derivacion_psiquiatra"],
      "nivel_riesgo": "alto"
    },
    "createdAt": "2024-01-08T14:15:00.000Z",
    "updatedAt": "2024-01-08T14:15:00.000Z"
  }
]
```

#### **Ejemplo 2: Paciente sin Notas**

**Request**:
```http
GET {{base_url}}/api/v1/notas/paciente/00000000-0000-0000-0000-000000000000
Authorization: Bearer {{access_token}}
```

**Response (200 OK)**:
```json
[]
```

#### **Ejemplo 3: Error - Paciente No Encontrado**

**Request**:
```http
GET {{base_url}}/api/v1/notas/paciente/paciente-inexistente
Authorization: Bearer {{access_token}}
```

**Response (400 Bad Request)**:
```json
{
  "statusCode": 400,
  "message": "ID de paciente inválido",
  "error": "Bad Request"
}
```

#### **Ejemplo 4: Error - Sin Autenticación**

**Request**:
```http
GET {{base_url}}/api/v1/notas/paciente/{{pacienteId}}
```

**Response (401 Unauthorized)**:
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

#### **Ejemplo 5: Error - Sin Permisos**

**Request**:
```http
GET {{base_url}}/api/v1/notas/paciente/{{pacienteId}}
Authorization: Bearer {{token_sin_permisos}}
```

**Response (403 Forbidden)**:
```json
{
  "statusCode": 403,
  "message": "Prohibido: no tiene permisos para acceder a este recurso",
  "error": "Authorization Error"
}
```

### **Tests de Postman**

#### **Test 1: Verificar Status Code**
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});
```

#### **Test 2: Verificar Estructura de Respuesta**
```javascript
pm.test("Response is an array", function () {
    const response = pm.response.json();
    pm.expect(response).to.be.an('array');
});
```

#### **Test 3: Verificar Campos Requeridos**
```javascript
pm.test("Each note has required fields", function () {
    const response = pm.response.json();
    
    if (response.length > 0) {
        const note = response[0];
        const requiredFields = [
            'id', 'pacienteId', 'pacienteNombre', 'contenido', 
            'tipo', 'esPrivada', 'createdAt', 'updatedAt'
        ];
        
        requiredFields.forEach(field => {
            pm.expect(note).to.have.property(field);
        });
    }
});
```

#### **Test 4: Verificar Ordenamiento por Fecha**
```javascript
pm.test("Notes are ordered by creation date (newest first)", function () {
    const response = pm.response.json();
    
    if (response.length > 1) {
        for (let i = 0; i < response.length - 1; i++) {
            const currentDate = new Date(response[i].createdAt);
            const nextDate = new Date(response[i + 1].createdAt);
            pm.expect(currentDate.getTime()).to.be.at.least(nextDate.getTime());
        }
    }
});
```

#### **Test 5: Verificar que las Notas Pertenecen al Paciente Correcto**
```javascript
pm.test("All notes belong to the requested patient", function () {
    const response = pm.response.json();
    const requestedPacienteId = pm.request.url.path[3]; // Obtener pacienteId de la URL
    
    response.forEach(note => {
        pm.expect(note.pacienteId).to.equal(requestedPacienteId);
    });
});
```

#### **Test 6: Verificar Tipos de Nota Válidos**
```javascript
pm.test("All notes have valid types", function () {
    const response = pm.response.json();
    const validTypes = ['sesion', 'evaluacion', 'observacion', 'plan_tratamiento', 'progreso', 'otro'];
    
    response.forEach(note => {
        pm.expect(validTypes).to.include(note.tipo);
    });
});
```

### **Pre-request Scripts**

#### **Script 1: Obtener Token de Autenticación**
```javascript
// Obtener token de autenticación si no existe
if (!pm.environment.get("access_token")) {
    const loginRequest = {
        url: pm.environment.get("base_url") + "/api/v1/auth/login",
        method: "POST",
        header: {
            "Content-Type": "application/json"
        },
        body: {
            mode: "raw",
            raw: JSON.stringify({
                email: "psicologo@psicoespacios.com",
                password: "psicologo123"
            })
        }
    };
    
    pm.sendRequest(loginRequest, function (err, response) {
        if (err) {
            console.error(err);
        } else {
            const responseJson = response.json();
            pm.environment.set("access_token", responseJson.access_token);
        }
    });
}
```

#### **Script 2: Generar PacienteId de Ejemplo**
```javascript
// Generar un UUID de ejemplo si no existe
if (!pm.environment.get("pacienteId")) {
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
    pm.environment.set("pacienteId", uuid);
}
```

### **Variables de Entorno Recomendadas**

```json
{
  "base_url": "http://localhost:3000",
  "access_token": "",
  "pacienteId": "",
  "psicologoId": "",
  "adminToken": ""
}
```

### **Colección Completa de Postman**

#### **1. Obtener Notas de Paciente**
- **Name**: Get Notes by Patient
- **Method**: GET
- **URL**: `{{base_url}}/api/v1/notas/paciente/{{pacienteId}}`
- **Headers**: Authorization: Bearer {{access_token}}

#### **2. Crear Nota de Prueba**
- **Name**: Create Test Note
- **Method**: POST
- **URL**: `{{base_url}}/api/v1/notas`
- **Headers**: Authorization: Bearer {{access_token}}
- **Body**: 
```json
{
  "pacienteId": "{{pacienteId}}",
  "contenido": "Nota de prueba para testing del endpoint",
  "titulo": "Nota de Test",
  "tipo": "observacion",
  "esPrivada": false,
  "metadatos": {
    "prioridad": "baja",
    "estado": "completada",
    "tags": ["test", "endpoint"]
  }
}
```

#### **3. Obtener Tipos de Nota Disponibles**
- **Name**: Get Available Note Types
- **Method**: GET
- **URL**: `{{base_url}}/api/v1/notas/tipos/disponibles`
- **Headers**: Authorization: Bearer {{access_token}}

### **Flujo de Testing Recomendado**

1. **Login como Psicólogo** → Obtener token
2. **Crear Nota de Prueba** → Para tener datos para probar
3. **Obtener Notas del Paciente** → Verificar endpoint principal
4. **Verificar Respuesta** → Validar estructura y datos
5. **Probar Casos de Error** → Sin token, sin permisos, etc.

### **Monitoreo y Logs**

#### **Headers de Respuesta Útiles**:
```
X-Response-Time: 45ms
X-Powered-By: Express
Content-Length: 1234
```

#### **Logs del Servidor**:
```
[INFO] Obteniendo notas del paciente: 123e4567-e89b-12d3-a456-426614174000
[INFO] Notas obtenidas: 3
[INFO] Request procesado en 45ms
```

### **Consideraciones de Seguridad**

1. **Token JWT**: Siempre usar HTTPS en producción
2. **Validación de Roles**: Verificar permisos en cada request
3. **Rate Limiting**: Implementar límites de requests por minuto
4. **Auditoría**: Log de todos los accesos a notas privadas
5. **Cifrado**: Considerar cifrado de contenido sensible en metadatos 