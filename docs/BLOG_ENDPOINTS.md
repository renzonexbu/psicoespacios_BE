# 📝 Endpoints de Blogs

## 🔐 **Autenticación**
Los endpoints de creación, actualización y eliminación requieren autenticación JWT y rol de ADMIN.

## 📋 **Endpoints Disponibles**

### **1. Obtener Todos los Blogs**
```http
GET /api/v1/blogs
```

**Respuesta:**
```json
[
  {
    "id": 1,
    "titulo": "Título del Blog",
    "descripcion": "Descripción corta del blog",
    "imagen": "https://ejemplo.com/imagen.jpg",
    "fecha": "2024-01-15",
    "categoria": "Psicología",
    "contenido": "Contenido completo del blog..."
  }
]
```

### **2. Buscar Blogs**
```http
GET /api/v1/blogs/search?q=psicología
```

**Parámetros:**
- `q` (string): Término de búsqueda

**Respuesta:** Lista de blogs que coinciden con la búsqueda

### **3. Obtener Blogs por Categoría**
```http
GET /api/v1/blogs/category/psicología
```

**Respuesta:** Lista de blogs de la categoría especificada

### **4. Obtener Blog por ID**
```http
GET /api/v1/blogs/1
```

**Respuesta:**
```json
{
  "id": 1,
  "titulo": "Título del Blog",
  "descripcion": "Descripción corta del blog",
  "imagen": "https://ejemplo.com/imagen.jpg",
  "fecha": "2024-01-15",
  "categoria": "Psicología",
  "contenido": "Contenido completo del blog..."
}
```

### **5. Crear Blog** 🔐
```http
POST /api/v1/blogs
Authorization: Bearer <JWT_TOKEN>
```

**Body:**
```json
{
  "titulo": "Nuevo Blog de Psicología",
  "descripcion": "Descripción del nuevo blog",
  "imagen": "https://ejemplo.com/imagen.jpg",
  "fecha": "2024-01-15",
  "categoria": "Psicología",
  "contenido": "Contenido completo del blog en formato HTML..."
}
```

**Campos requeridos:**
- `titulo` (string, 1-255 caracteres)
- `descripcion` (string, 1-1000 caracteres)
- `categoria` (string, 1-100 caracteres)
- `contenido` (string, 1-10000 caracteres)

**Campos opcionales:**
- `imagen` (string, URL válida)
- `fecha` (string, formato YYYY-MM-DD)

**Respuesta:** Blog creado con ID asignado

### **6. Actualizar Blog** 🔐
```http
PUT /api/v1/blogs/1
Authorization: Bearer <JWT_TOKEN>
```

**Body:** Mismo formato que crear, pero todos los campos son opcionales

**Respuesta:** Blog actualizado

### **7. Eliminar Blog** 🔐
```http
DELETE /api/v1/blogs/1
Authorization: Bearer <JWT_TOKEN>
```

**Respuesta:** 200 OK (sin contenido)

## ⚠️ **Validaciones**

### **Crear Blog:**
- Título único (no puede existir otro blog con el mismo título)
- Longitudes de campos respetadas
- URL de imagen válida (si se proporciona)
- Fecha en formato YYYY-MM-DD (si se proporciona)

### **Actualizar Blog:**
- Si se cambia el título, debe ser único
- Campos opcionales
- Validaciones de formato igual que crear

## 🚨 **Códigos de Error**

- `400 Bad Request`: Datos inválidos o título duplicado
- `401 Unauthorized`: Token JWT inválido o faltante
- `403 Forbidden`: Rol insuficiente (se requiere ADMIN)
- `404 Not Found`: Blog no encontrado

## 📝 **Ejemplo de Uso Completo**

### **1. Crear un nuevo blog:**
```bash
curl -X POST http://localhost:3000/api/v1/blogs \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Beneficios de la Terapia Cognitivo-Conductual",
    "descripcion": "Descubre cómo la TCC puede ayudarte a superar problemas emocionales",
    "categoria": "Terapias",
    "contenido": "<h2>¿Qué es la TCC?</h2><p>La terapia cognitivo-conductual...</p>",
    "imagen": "https://ejemplo.com/tcc-imagen.jpg"
  }'
```

### **2. Buscar blogs:**
```bash
curl "http://localhost:3000/api/v1/blogs/search?q=terapia"
```

### **3. Obtener blogs por categoría:**
```bash
curl "http://localhost:3000/api/v1/blogs/category/psicología"
``` 