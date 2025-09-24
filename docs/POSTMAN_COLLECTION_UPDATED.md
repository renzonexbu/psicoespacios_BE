# 📮 Colección Postman Actualizada - Sistema de Autenticación Mejorado

## 🔄 Cambios en los Endpoints

### ✅ Endpoints Mejorados

#### 1. **POST /api/v1/auth/refresh-token** (SIN AUTENTICACIÓN)
- **Antes**: Requería `Authorization: Bearer <token>`
- **Ahora**: Solo requiere el refresh token en el body
- **Mejora**: Funciona incluso si el access token expiró

#### 2. **POST /api/v1/auth/logout** (SIN AUTENTICACIÓN)
- **Antes**: Requería `Authorization: Bearer <token>`
- **Ahora**: Solo requiere el refresh token en el body
- **Mejora**: Permite cerrar sesión sin access token válido

#### 3. **POST /api/v1/auth/register** (CON REFRESH TOKEN)
- **Antes**: Solo devolvía access_token y user
- **Ahora**: Devuelve access_token, refresh_token y user
- **Mejora**: El registro ahora inicia una sesión completa

## 📋 Colección Postman Actualizada

### Variables de Entorno
```json
{
  "base_url": "http://localhost:3000",
  "access_token": "",
  "refresh_token": "",
  "user_id": ""
}
```

### 1. Registro de Usuario
```http
POST {{base_url}}/api/v1/auth/register
Content-Type: application/json

{
  "email": "nuevo@ejemplo.com",
  "password": "contraseña123",
  "nombre": "Juan",
  "apellido": "Pérez",
  "rut": "12345678-9",
  "telefono": "+56912345678",
  "fechaNacimiento": "1990-05-15",
  "role": "PSICOLOGO"
}
```

**Tests (JavaScript):**
```javascript
pm.test("Registro exitoso", function () {
    pm.response.to.have.status(201);
});

pm.test("Respuesta incluye tokens", function () {
    const response = pm.response.json();
    pm.expect(response).to.have.property('access_token');
    pm.expect(response).to.have.property('refresh_token');
    pm.expect(response).to.have.property('user');
});

// Guardar tokens en variables
if (pm.response.code === 201) {
    const response = pm.response.json();
    pm.environment.set("access_token", response.access_token);
    pm.environment.set("refresh_token", response.refresh_token);
    pm.environment.set("user_id", response.user.id);
}
```

### 2. Login
```http
POST {{base_url}}/api/v1/auth/login
Content-Type: application/json

{
  "email": "usuario@ejemplo.com",
  "password": "contraseña123"
}
```

**Tests (JavaScript):**
```javascript
pm.test("Login exitoso", function () {
    pm.response.to.have.status(200);
});

pm.test("Respuesta incluye tokens", function () {
    const response = pm.response.json();
    pm.expect(response).to.have.property('access_token');
    pm.expect(response).to.have.property('refresh_token');
    pm.expect(response).to.have.property('user');
});

// Guardar tokens en variables
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set("access_token", response.access_token);
    pm.environment.set("refresh_token", response.refresh_token);
    pm.environment.set("user_id", response.user.id);
}
```

### 3. Refresh Token (MEJORADO)
```http
POST {{base_url}}/api/v1/auth/refresh-token
Content-Type: application/json

{
  "refresh_token": "{{refresh_token}}"
}
```

**Tests (JavaScript):**
```javascript
pm.test("Refresh token exitoso", function () {
    pm.response.to.have.status(200);
});

pm.test("Respuesta incluye nuevos tokens", function () {
    const response = pm.response.json();
    pm.expect(response).to.have.property('access_token');
    pm.expect(response).to.have.property('refresh_token');
});

// Actualizar tokens en variables
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set("access_token", response.access_token);
    pm.environment.set("refresh_token", response.refresh_token);
}
```

### 4. Obtener Perfil
```http
GET {{base_url}}/api/v1/auth/profile
Authorization: Bearer {{access_token}}
```

**Tests (JavaScript):**
```javascript
pm.test("Perfil obtenido exitosamente", function () {
    pm.response.to.have.status(200);
});

pm.test("Respuesta incluye datos del usuario", function () {
    const response = pm.response.json();
    pm.expect(response).to.have.property('user');
    pm.expect(response.user).to.have.property('id');
    pm.expect(response.user).to.have.property('email');
});
```

### 5. Logout (MEJORADO)
```http
POST {{base_url}}/api/v1/auth/logout
Content-Type: application/json

{
  "refresh_token": "{{refresh_token}}"
}
```

**Tests (JavaScript):**
```javascript
pm.test("Logout exitoso", function () {
    pm.response.to.have.status(200);
});

pm.test("Respuesta incluye mensaje de confirmación", function () {
    const response = pm.response.json();
    pm.expect(response).to.have.property('message');
    pm.expect(response.message).to.include('revocado');
});

// Limpiar variables después del logout
if (pm.response.code === 200) {
    pm.environment.set("access_token", "");
    pm.environment.set("refresh_token", "");
    pm.environment.set("user_id", "");
}
```

### 6. Actualizar Perfil
```http
PATCH {{base_url}}/api/v1/auth/profile
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "nombre": "Juan Actualizado",
  "telefono": "+56987654321"
}
```

**Tests (JavaScript):**
```javascript
pm.test("Perfil actualizado exitosamente", function () {
    pm.response.to.have.status(200);
});

pm.test("Datos actualizados correctamente", function () {
    const response = pm.response.json();
    pm.expect(response.user.nombre).to.eql("Juan Actualizado");
    pm.expect(response.user.telefono).to.eql("+56987654321");
});
```

### 7. Cambiar Contraseña
```http
POST {{base_url}}/api/v1/auth/change-password
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "currentPassword": "contraseña123",
  "newPassword": "nuevaContraseña456"
}
```

**Tests (JavaScript):**
```javascript
pm.test("Contraseña cambiada exitosamente", function () {
    pm.response.to.have.status(200);
});

pm.test("Respuesta incluye mensaje de confirmación", function () {
    const response = pm.response.json();
    pm.expect(response).to.have.property('message');
    pm.expect(response.message).to.include('actualizada');
});
```

## 🔄 Flujo de Pruebas Recomendado

### Secuencia de Pruebas
1. **Registro** → Obtener tokens iniciales
2. **Login** → Verificar autenticación
3. **Perfil** → Verificar acceso con token
4. **Refresh Token** → Probar renovación
5. **Perfil con nuevo token** → Verificar nuevo token
6. **Actualizar perfil** → Probar funcionalidad
7. **Logout** → Probar cierre de sesión
8. **Refresh después de logout** → Verificar revocación

### Script de Pre-request (Automático)
```javascript
// Agregar automáticamente el token si existe
const accessToken = pm.environment.get("access_token");
if (accessToken) {
    pm.request.headers.add({
        key: 'Authorization',
        value: `Bearer ${accessToken}`
    });
}
```

## 🧪 Casos de Prueba Especiales

### 1. Refresh Token con Token Inválido
```http
POST {{base_url}}/api/v1/auth/refresh-token
Content-Type: application/json

{
  "refresh_token": "token-invalido"
}
```

**Resultado esperado:** 401 Unauthorized

### 2. Perfil Sin Token
```http
GET {{base_url}}/api/v1/auth/profile
```

**Resultado esperado:** 401 Unauthorized

### 3. Refresh Token Después de Logout
```http
POST {{base_url}}/api/v1/auth/refresh-token
Content-Type: application/json

{
  "refresh_token": "{{refresh_token}}"
}
```

**Resultado esperado:** 401 Unauthorized (token revocado)

## 📊 Monitoreo de Variables

### Variables a Monitorear
- `access_token`: Token de acceso actual
- `refresh_token`: Token de renovación actual
- `user_id`: ID del usuario autenticado

### Verificación de Variables
```javascript
// Script para verificar que las variables están configuradas
pm.test("Variables de entorno configuradas", function () {
    const accessToken = pm.environment.get("access_token");
    const refreshToken = pm.environment.get("refresh_token");
    
    pm.expect(accessToken).to.not.be.empty;
    pm.expect(refreshToken).to.not.be.empty;
});
```

## 🚀 Importar Colección

1. Abrir Postman
2. Click en "Import"
3. Seleccionar el archivo `PsicoEspacios_API_completa.postman_collection.json`
4. Configurar las variables de entorno
5. Ejecutar las pruebas en secuencia

## 📝 Notas Importantes

1. **Rotación de tokens**: Cada refresh genera nuevos tokens
2. **Revocación automática**: Los tokens anteriores se revocan
3. **Sin dependencias**: Refresh token funciona independientemente
4. **Validación robusta**: Todos los endpoints tienen validación
5. **Manejo de errores**: Respuestas consistentes y claras

¿Necesitas ayuda para configurar la colección o tienes alguna duda sobre los endpoints mejorados? 