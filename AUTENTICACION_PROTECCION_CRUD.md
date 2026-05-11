# 🔐 Protección de Rutas CRUD - Guía Completa

## Problema Identificado

En tu Hostinger funcionaba la autenticación pero en IONOS VPS no porque:

1. **Las rutas CRUD NO tenían autenticación** - POST/PUT/DELETE estaban completamente abiertas
2. **Los componentes NO enviaban cookies** - Los fetch calls no incluían `credentials: 'include'`
3. **CORS no permitía credenciales** - Headers CORS no tenían `Access-Control-Allow-Credentials: true`

### Ejemplo del problema anterior:
```javascript
// ❌ ANTES - Sin autenticación ni credenciales
const response = await fetch('/api/products', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
})
```

## Solución Implementada ✅

### 1. Protección de Endpoints

#### `/api/products/route.ts`
- ✅ GET: Requiere autenticación JWT
- ✅ POST: Requiere autenticación JWT

#### `/api/products/[id]/route.ts`
- ✅ GET: Público (para componentes internos)
- ✅ PUT: Requiere autenticación JWT
- ✅ DELETE: Requiere autenticación JWT

#### `/api/products/public` (sin cambios)
- ✅ GET: PÚBLICO - sin autenticación (para clientes externos)

### 2. Actualización de Componentes

Ahora todos los fetch calls que realizan CRUD incluyen:

```javascript
// ✅ AHORA - Con credenciales
const response = await fetch('/api/products', {
  method: 'POST',
  credentials: 'include',  // ← IMPORTANTE: Envía cookies httpOnly
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
})
```

**Componentes actualizados:**
- `components/add-product-modal.tsx` - POST productos
- `components/edit-product-modal.tsx` - PUT productos
- `components/inventory-content.tsx` - PUT stock, DELETE productos
- `components/admin-content.tsx` - POST/PUT catálogos

### 3. Configuración CORS Corregida

**Antes:**
```javascript
"Access-Control-Allow-Methods": "GET, OPTIONS",  // ❌ Sin POST/PUT/DELETE
// ❌ Sin Allow-Credentials
```

**Después:**
```javascript
"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",  // ✅
"Access-Control-Allow-Credentials": "true",  // ✅ Permite cookies httpOnly
"Access-Control-Allow-Headers": "Content-Type, Authorization",
```

## Flujo de Autenticación

### 1. Login
```
Cliente → POST /api/autenticacion/iniciar-sesion
         (correo, contraseña)
Servidor → Responde con JWT en cookie httpOnly (automático)
Cliente → Cookie guardada automáticamente por navegador
```

### 2. Operaciones CRUD
```
Cliente → POST/PUT/DELETE /api/products
         { credentials: 'include' }
Navegador → Envía automáticamente cookie httpOnly
Servidor → Valida JWT desde la cookie
         → Procesa operación si JWT válido
         → 401 si JWT no válido o expirado
```

## Flujos de Seguridad

### ✅ Productos PÚBLICOS (sin autenticación)
- Endpoint: `/api/products/public`
- Usado por: Catálogos, tienda pública, búsqueda de productos
- Retorna: Solo productos activos (información pública)

### ✅ Productos PRIVADOS (con autenticación)
- Endpoints: `/api/products`, `/api/products/[id]`
- GET: Admin/staff ven todos los productos
- POST: Crear productos (solo autenticado)
- PUT: Editar productos (solo autenticado)
- DELETE: Desactivar productos (solo autenticado)

### ✅ Catálogos (categorías, roles, métodos de pago)
- Público: `/api/catalogos/categorias/public` - sin autenticación
- Privado: `/api/catalogos/*` - con autenticación POST/PUT/DELETE

## Testing en IONOS

Después de desplegar, verifica:

### 1. Login funciona
```bash
curl -X POST https://fiora.mascontrol.app/api/autenticacion/iniciar-sesion \
  -H "Content-Type: application/json" \
  -d '{"correo":"admin@fiora.com","contrasena":"..."}'
# Respuesta debe incluir Set-Cookie con JWT
```

### 2. CRUD protegido (sin credenciales = 401)
```bash
curl -X POST https://fiora.mascontrol.app/api/products \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Test"}'
# Response: 401 "Token no proporcionado"
```

### 3. CRUD protegido (con cookies = 200)
```bash
# Primero login para obtener cookie
curl -X POST https://fiora.mascontrol.app/api/autenticacion/iniciar-sesion \
  -c cookies.txt \
  -d '{"correo":"admin@fiora.com","contrasena":"..."}'

# Luego uso la cookie
curl -X POST https://fiora.mascontrol.app/api/products \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Test","precio":100,...}'
# Response: 201 Producto creado
```

### 4. Público sin autenticación funciona
```bash
curl https://fiora.mascontrol.app/api/products/public
# Response: 200 Lista de productos públicos
```

## Cambios por Archivo

### `/lib/cors-utils.ts`
- ✅ Agregado `"Access-Control-Allow-Credentials": "true"`
- ✅ Expandido métodos: GET, POST, PUT, DELETE, OPTIONS
- ✅ Agregado header Authorization en Allow-Headers

### `/app/api/products/route.ts`
- ✅ Importado `verificarTokenJWT`
- ✅ Agregada función `validarAutenticacion()`
- ✅ GET requiere autenticación
- ✅ POST requiere autenticación

### `/app/api/products/[id]/route.ts`
- ✅ Importado `verificarTokenJWT`
- ✅ Agregada función `validarAutenticacion()`
- ✅ PUT requiere autenticación
- ✅ DELETE requiere autenticación

### Componentes
- ✅ Todos agregaron `credentials: 'include'` en fetch calls
- ✅ POST/PUT/DELETE ahora envían cookies automáticamente

## Próximos Pasos

1. **Deploy a IONOS:**
   ```bash
   git add .
   git commit -m "feat: Proteger rutas CRUD con autenticación JWT y CORS correcto"
   git push
   ```

2. **En el VPS:**
   ```bash
   cd /path/to/fiora-app
   git pull
   npm install
   npm run build
   pm2 restart fiora
   ```

3. **Verificar funcionamiento:**
   - Accede a https://fiora.mascontrol.app/inventario
   - Intenta crear/editar/eliminar producto
   - Verifica que funciona correctamente

## Debugging

Si aún hay problemas:

1. **Verifica headers CORS en respuesta:**
   ```bash
   curl -v -X OPTIONS https://fiora.mascontrol.app/api/products
   ```
   Debe incluir:
   - `Access-Control-Allow-Credentials: true`
   - `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
   - `Access-Control-Allow-Headers: Content-Type, Authorization`

2. **Revisa logs del servidor:**
   ```bash
   pm2 logs fiora
   ```

3. **Verifica JWT_SECRET:**
   ```bash
   echo $JWT_SECRET
   # Debe ser igual en desarrollo y producción
   ```

---

**Resumen:** Las operaciones CRUD ahora están protegidas con JWT. Los clientes deben estar autenticados para crear/editar/eliminar productos. La lectura pública es por `/api/products/public`.
