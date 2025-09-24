# 🔐 Sistema de Autenticación Mejorado - Guía de Integración Frontend

## 📋 Resumen de Mejoras Implementadas

### ✅ Cambios Realizados
1. **Endpoint refresh-token sin autenticación**: Ya no requiere access token válido
2. **Rotación de refresh tokens**: Cada renovación genera un nuevo refresh token
3. **Registro con refresh token**: El registro ahora también devuelve refresh token
4. **Validación mejorada**: DTOs específicos para refresh token
5. **Logout sin autenticación**: No requiere access token para cerrar sesión

## 🚀 Endpoints Actualizados

### 1. Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "usuario@ejemplo.com",
  "password": "contraseña123"
}
```

**Respuesta:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d-a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
  "user": {
    "id": "user-uuid",
    "email": "usuario@ejemplo.com",
    "nombre": "Juan",
    "apellido": "Pérez",
    "role": "PSICOLOGO"
  }
}
```

### 2. Register
```http
POST /api/v1/auth/register
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

**Respuesta:** (Igual que login, incluye access_token y refresh_token)

### 3. Refresh Token (MEJORADO)
```http
POST /api/v1/auth/refresh-token
Content-Type: application/json

{
  "refresh_token": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d-a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"
}
```

**Respuesta:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "nuevo-refresh-token-uuid-uuid-uuid-uuid-uuid-uuid-uuid-uuid"
}
```

### 4. Logout (MEJORADO)
```http
POST /api/v1/auth/logout
Content-Type: application/json

{
  "refresh_token": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d-a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"
}
```

**Respuesta:**
```json
{
  "message": "Refresh token revocado"
}
```

## 💻 Implementación en Frontend

### 1. Servicio de Autenticación (React/JavaScript)

```javascript
// authService.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api/v1';

class AuthService {
  constructor() {
    this.setupInterceptors();
  }

  // Configurar interceptores
  setupInterceptors() {
    // Interceptor para agregar token automáticamente
    axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Interceptor para renovación automática de tokens
    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            const newTokens = await this.refreshToken();
            
            // Actualizar tokens en localStorage
            localStorage.setItem('access_token', newTokens.access_token);
            localStorage.setItem('refresh_token', newTokens.refresh_token);
            
            // Reintentar la petición original
            originalRequest.headers.Authorization = `Bearer ${newTokens.access_token}`;
            return axios(originalRequest);
          } catch (refreshError) {
            // Refresh token expirado, redirigir al login
            this.logout();
            return Promise.reject(refreshError);
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Login
  async login(email, password) {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password
      });
      
      const { access_token, refresh_token, user } = response.data;
      
      // Guardar tokens y datos del usuario
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      localStorage.setItem('user', JSON.stringify(user));
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Register
  async register(userData) {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
      
      const { access_token, refresh_token, user } = response.data;
      
      // Guardar tokens y datos del usuario
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      localStorage.setItem('user', JSON.stringify(user));
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Refresh Token
  async refreshToken() {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
        refresh_token: refreshToken
      });
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Logout
  async logout() {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (refreshToken) {
        await axios.post(`${API_BASE_URL}/auth/logout`, {
          refresh_token: refreshToken
        });
      }
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      // Limpiar localStorage
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      
      // Redirigir al login
      window.location.href = '/login';
    }
  }

  // Verificar si está autenticado
  isAuthenticated() {
    return !!localStorage.getItem('access_token');
  }

  // Obtener usuario actual
  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  // Obtener token actual
  getAccessToken() {
    return localStorage.getItem('access_token');
  }
}

export default new AuthService();
```

### 2. Hook de React (React Hooks)

```javascript
// useAuth.js
import { useState, useEffect, createContext, useContext } from 'react';
import authService from './authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay usuario al cargar la app
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      setUser(response.user);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      setUser(response.user);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error('Error en logout:', error);
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
```

### 3. Componente de Login

```javascript
// Login.jsx
import React, { useState } from 'react';
import { useAuth } from './useAuth';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (error) {
      setError(error.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2>Iniciar Sesión</h2>
      {error && <div className="error">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        
        <div>
          <label>Contraseña:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        
        <button type="submit" disabled={loading}>
          {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
        </button>
      </form>
    </div>
  );
};

export default Login;
```

### 4. Componente Protegido

```javascript
// ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from './useAuth';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
```

### 5. Configuración de la App

```javascript
// App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './useAuth';
import ProtectedRoute from './ProtectedRoute';
import Login from './Login';
import Dashboard from './Dashboard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
```

## 🔒 Características de Seguridad

### ✅ Mejoras Implementadas
1. **Rotación de refresh tokens**: Cada renovación genera un nuevo refresh token
2. **Revocación inmediata**: Los refresh tokens anteriores se revocan automáticamente
3. **Sin dependencia de access token**: El refresh token funciona independientemente
4. **Validación robusta**: DTOs específicos para cada endpoint
5. **Manejo de errores mejorado**: Respuestas consistentes y claras

### 🛡️ Beneficios de Seguridad
- **Prevención de replay attacks**: Los refresh tokens se rotan automáticamente
- **Detección de compromiso**: Si se detecta un refresh token comprometido, se puede revocar
- **Sesiones más seguras**: Los tokens tienen tiempos de expiración apropiados
- **Logout efectivo**: Revoca inmediatamente el refresh token

## 📝 Notas Importantes

1. **Almacenamiento**: Los tokens se almacenan en localStorage (considera usar httpOnly cookies para mayor seguridad)
2. **Renovación automática**: El interceptor maneja automáticamente la renovación de tokens
3. **Manejo de errores**: Los errores de autenticación redirigen automáticamente al login
4. **Persistencia**: Los datos del usuario se mantienen entre recargas de página

## 🚀 Próximos Pasos

1. Implementar el servicio de autenticación en tu frontend
2. Configurar los interceptores de axios
3. Crear los componentes de login y registro
4. Implementar rutas protegidas
5. Probar el flujo completo de autenticación

¿Necesitas ayuda con alguna implementación específica o tienes alguna duda sobre el sistema mejorado? 