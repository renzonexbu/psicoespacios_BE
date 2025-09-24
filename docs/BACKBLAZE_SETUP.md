# 🚀 Configuración de Backblaze B2 para Uploads

## 📋 Variables de Entorno Requeridas

Agrega estas variables a tu archivo `.env`:

```bash
# ========================================
# CONFIGURACIÓN DE BACKBLAZE B2 (UPLOADS)
# ========================================
BACKBLAZE_ACCESS_KEY_ID=tu_access_key_id
BACKBLAZE_SECRET_ACCESS_KEY=tu_secret_access_key
BACKBLAZE_BUCKET_NAME=psicoespacios-uploads
BACKBLAZE_REGION=us-west-002
BACKBLAZE_ENDPOINT=https://s3.us-west-002.backblazeb2.com
```

## 🔧 Configuración de Backblaze B2

### 1. Crear cuenta en Backblaze B2
1. Ve a [backblaze.com](https://www.backblaze.com)
2. Crea una cuenta gratuita
3. Accede al panel de control

### 2. Crear Bucket
1. En el panel de control, ve a "B2 Cloud Storage"
2. Haz clic en "Create Bucket"
3. Configura el bucket:
   - **Bucket Name**: `psicoespacios-uploads`
   - **Files in bucket are**: `Public` (para acceso público)
   - **Default Upload**: `Public`
4. Haz clic en "Create Bucket"

### 3. Crear Application Key
1. Ve a "Account" → "Application Keys"
2. Haz clic en "Add a New Application Key"
3. Configura la key:
   - **Key Name**: `psicoespacios-app-key`
   - **Allow access to**: `All buckets` (o selecciona tu bucket específico)
   - **Allow access to**: `Read and Write`
4. Haz clic en "Create New Key"
5. **Guarda** el `keyID` y `applicationKey` (no se mostrarán de nuevo)

### 4. Configurar Variables de Entorno
```bash
BACKBLAZE_ACCESS_KEY_ID=tu_key_id_aqui
BACKBLAZE_SECRET_ACCESS_KEY=tu_application_key_aqui
BACKBLAZE_BUCKET_NAME=psicoespacios-uploads
BACKBLAZE_REGION=us-west-002
BACKBLAZE_ENDPOINT=https://s3.us-west-002.backblazeb2.com
```

## 📁 Estructura de Carpetas

Los archivos se organizarán automáticamente en las siguientes carpetas:

```
psicoespacios-uploads/
├── images/           # Imágenes generales
├── pdfs/            # Documentos PDF
├── documents/       # Documentos varios (Word, Excel, etc.)
└── profile-images/  # Imágenes de perfil de usuarios
```

## 🎯 Endpoints Disponibles

### Subir Imagen
```http
POST /api/v1/uploads/image
Content-Type: multipart/form-data
Authorization: Bearer <token>

file: [archivo de imagen]
```

### Subir PDF
```http
POST /api/v1/uploads/pdf
Content-Type: multipart/form-data
Authorization: Bearer <token>

file: [archivo PDF]
```

### Subir Documento
```http
POST /api/v1/uploads/document
Content-Type: multipart/form-data
Authorization: Bearer <token>

file: [archivo de documento]
```

### Subir Imagen de Perfil
```http
POST /api/v1/uploads/profile-image
Content-Type: multipart/form-data
Authorization: Bearer <token>

file: [archivo de imagen]
```

### Eliminar Archivo
```http
DELETE /api/v1/uploads/:key
Authorization: Bearer <token>
```

### Generar URL Firmada
```http
POST /api/v1/uploads/signed-url/:key
Authorization: Bearer <token>
```

## 📊 Tipos de Archivo Permitidos

### Imágenes
- JPEG/JPG
- PNG
- GIF
- WebP

### Documentos
- PDF
- Microsoft Word (.doc, .docx)
- Microsoft Excel (.xls, .xlsx)

## 📏 Límites de Tamaño

- **Imágenes**: 5MB
- **PDFs**: 10MB
- **Documentos**: 15MB
- **Imágenes de Perfil**: 3MB

## 🔒 Seguridad

- Todos los endpoints requieren autenticación JWT
- Los archivos se almacenan con nombres únicos (UUID)
- Se validan tipos MIME
- URLs públicas para acceso directo
- URLs firmadas para acceso privado temporal

## 💰 Costos

Backblaze B2 ofrece:
- **10GB gratuitos** de almacenamiento
- **1GB gratuitos** de transferencia por día
- Precios muy competitivos después del límite gratuito

## 🧪 Pruebas

### Ejemplo con cURL
```bash
# Subir imagen
curl -X POST http://localhost:3000/api/v1/uploads/image \
  -H "Authorization: Bearer <tu_token>" \
  -F "file=@imagen.jpg"

# Respuesta esperada
{
  "success": true,
  "url": "https://s3.us-west-002.backblazeb2.com/psicoespacios-uploads/images/uuid.jpg",
  "filename": "uuid.jpg",
  "originalname": "imagen.jpg",
  "mimetype": "image/jpeg",
  "size": 123456,
  "bucket": "psicoespacios-uploads",
  "key": "images/uuid.jpg",
  "message": "Imagen subida exitosamente"
}
```

### Ejemplo con Postman
1. Selecciona `POST`
2. URL: `http://localhost:3000/api/v1/uploads/image`
3. Headers: `Authorization: Bearer <tu_token>`
4. Body: `form-data`
5. Key: `file`, Type: `File`
6. Selecciona tu archivo

## 🚨 Troubleshooting

### Error: "Access Denied"
- Verifica que las credenciales sean correctas
- Asegúrate de que el bucket sea público
- Verifica los permisos de la Application Key

### Error: "Bucket not found"
- Verifica el nombre del bucket en `BACKBLAZE_BUCKET_NAME`
- Asegúrate de que el bucket exista en tu cuenta

### Error: "Invalid endpoint"
- Verifica la región en `BACKBLAZE_REGION`
- Asegúrate de que el endpoint sea correcto para tu región

### Error: "File too large"
- Verifica el tamaño del archivo
- Ajusta los límites en el interceptor si es necesario

## 🔄 Migración desde Sistema Local

Si ya tienes archivos en el sistema local:

1. **No elimines** la carpeta `uploads/` inmediatamente
2. Los nuevos archivos irán a Backblaze B2
3. Los archivos antiguos seguirán siendo accesibles localmente
4. Considera migrar archivos importantes a Backblaze B2

## 📈 Monitoreo

### Logs Importantes
```bash
# Configuración exitosa
Backblaze B2 configurado - Bucket: psicoespacios-uploads, Endpoint: https://s3.us-west-002.backblazeb2.com

# Subida exitosa
Subiendo archivo: imagen.jpg -> images/uuid.jpg
Archivo subido exitosamente: https://s3.us-west-002.backblazeb2.com/psicoespacios-uploads/images/uuid.jpg

# Error de subida
Error subiendo archivo: Access Denied
```

### Métricas a Monitorear
- Tasa de éxito de subidas
- Tiempo de respuesta
- Uso de almacenamiento
- Transferencia de datos
- Errores de autenticación 