# 🌐 Acceso a Productos e Imágenes desde Página Web Externa

## ✅ Resumen

**SÍ, puedes acceder a todos los productos e imágenes desde cualquier página web (otro dominio, otra aplicación, etc.)**

---

## 📡 Endpoints Públicos Disponibles

### 1. Obtener lista de productos (paginado)

```bash
GET https://fiora.mascontrol.app/api/products/public?page=1&limit=12
```

**Parámetros query:**
- `page` (default: 1) - Número de página
- `limit` (default: 12, max: 50) - Productos por página
- `palabra` (opcional) - Buscar por nombre/descripción
- `categoriaId` (opcional) - Filtrar por categoría

**Respuesta:**
```json
{
  "productos": [
    {
      "id": 1,
      "codigo": "ORO-001",
      "nombre": "Anillo de Oro 18K",
      "descripcion": "Anillo elegante...",
      "precio": 599.99,
      "imagen": "/uploads/productos/1715338800000_a1b2c3d4.jpg",
      "stock": 5,
      "disponible": true,
      "palabrasClave": "oro, anillo, elegancia",
      "categoria": {
        "id": 1,
        "nombre": "Anillos"
      }
    }
    // ... más productos
  ],
  "total": 45,
  "page": 1,
  "limit": 12,
  "totalPages": 4,
  "hasMore": true
}
```

### 2. Obtener detalle de un producto

```bash
GET https://fiora.mascontrol.app/api/products/public/[id]
```

**Respuesta:**
```json
{
  "id": 1,
  "codigo": "ORO-001",
  "nombre": "Anillo de Oro 18K",
  "descripcion": "...",
  "precio": 599.99,
  "imagen": "/uploads/productos/1715338800000_a1b2c3d4.jpg",
  "stock": 5,
  "disponible": true,
  "categoria": { "id": 1, "nombre": "Anillos" }
}
```

---

## 🖼️ URLs de Imágenes

### Estructura de almacenamiento local

**Carpeta en VPS:** `/var/www/fiora-app/public/uploads/productos/`

**Formato de archivo:** `[timestamp]_[random].jpg`
- Ejemplo: `1715338800000_a1b2c3d4.jpg`

### URLs públicas

**URL retornada en API:** `/uploads/productos/1715338800000_a1b2c3d4.jpg`

**URL completa:** `https://fiora.mascontrol.app/uploads/productos/1715338800000_a1b2c3d4.jpg`

---

## 💻 Ejemplos de Uso desde Página Web Externa

### React/Next.js

```typescript
// Obtener productos
const response = await fetch('https://fiora.mascontrol.app/api/products/public?page=1&limit=12')
const data = await response.json()

// Usar en componente
data.productos.map(producto => (
  <div key={producto.id}>
    <h2>{producto.nombre}</h2>
    <img src={`https://fiora.mascontrol.app${producto.imagen}`} alt={producto.nombre} />
    <p>${producto.precio}</p>
    <p>{producto.disponible ? '✅ En stock' : '❌ Agotado'}</p>
  </div>
))
```

### JavaScript Vanilla

```javascript
fetch('https://fiora.mascontrol.app/api/products/public?page=1&limit=12')
  .then(res => res.json())
  .then(data => {
    data.productos.forEach(producto => {
      const html = `
        <div class="producto">
          <img src="https://fiora.mascontrol.app${producto.imagen}" />
          <h3>${producto.nombre}</h3>
          <p>$${producto.precio}</p>
        </div>
      `
      document.body.innerHTML += html
    })
  })
```

### HTML con fetch

```html
<div id="productos"></div>

<script>
  fetch('https://fiora.mascontrol.app/api/products/public')
    .then(res => res.json())
    .then(data => {
      const html = data.productos.map(p => `
        <div style="border: 1px solid #ddd; padding: 10px; margin: 10px;">
          <img src="https://fiora.mascontrol.app${p.imagen}" style="width: 100px;" />
          <h3>${p.nombre}</h3>
          <p><strong>$${p.precio}</strong></p>
          <p>Stock: ${p.stock}</p>
        </div>
      `).join('')
      document.getElementById('productos').innerHTML = html
    })
</script>
```

---

## 🔐 CORS - Acceso Público

**CORS está habilitado** para `/api/products/public`:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

Esto significa que puedes acceder desde:
- ✅ Tu sitio web externo
- ✅ Otra aplicación
- ✅ Cualquier origen (mismo dominio o diferente)

---

## 📋 Flujo Completo

```
1. Cliente (página web externa)
   ↓
2. GET https://fiora.mascontrol.app/api/products/public
   ↓
3. Nginx + Node.js (IONOS VPS)
   ├─ Consulta BD
   ├─ Obtiene productos con imágenes
   ↓
4. Respuesta JSON con URLs de imágenes
   {
     "productos": [
       { 
         "nombre": "...",
         "imagen": "/uploads/productos/1715338800000_a1b2c3d4.jpg"
       }
     ]
   }
   ↓
5. Cliente usa imagen
   <img src="https://fiora.mascontrol.app/uploads/productos/1715338800000_a1b2c3d4.jpg" />
   ↓
6. Nginx sirve imagen directamente desde filesystem
   (sin pasar por Node.js - más rápido)
```

---

## 🚀 Optimizaciones Implementadas

### 1. Almacenamiento Local
- ✅ Imágenes guardadas en VPS
- ✅ Sin dependencia de Cloudinary
- ✅ URLs permanentes

### 2. Nginx optimizado para imágenes
```nginx
location /uploads/productos/ {
    alias /var/www/fiora-app/public/uploads/productos/;
    expires 30d;                    # Cache 30 días en navegador
    add_header Cache-Control "..."; # Headers de caché
    add_header Access-Control-Allow-Origin "*";  # CORS público
}
```

### 3. Caché de 30 días
- Imágenes se cachean en navegadores del cliente
- Menos tráfico de servidor
- Más rápido para usuarios

---

## 📊 Comparación: Antes vs Después

| Característica | Antes (Cloudinary) | Ahora (Local) |
|---|---|---|
| Costo | $99/mes | $0 |
| URLs | `https://cloudinary.com/...` | `https://fiora.mascontrol.app/uploads/...` |
| Control | Cloudinary | 100% tuyo |
| Velocidad | Depende de Cloudinary | Servido localmente (rápido) |
| Portabilidad | Atado a Cloudinary | Fácil de mover |

---

## ✅ Checklist para Usar desde Página Externa

- [x] Endpoint `/api/products/public` está público
- [x] CORS habilitado para acceso externo
- [x] Imágenes almacenadas localmente
- [x] Nginx configurado para servir imágenes
- [x] URLs en formato `/uploads/productos/[archivo]`
- [x] Caché de 30 días en navegadores

---

## 🔗 URLs Finales

| Recurso | URL |
|---|---|
| Lista de productos | `https://fiora.mascontrol.app/api/products/public?page=1&limit=12` |
| Detalle de producto | `https://fiora.mascontrol.app/api/products/public/[id]` |
| Imagen de producto | `https://fiora.mascontrol.app/uploads/productos/[archivo].jpg` |
| Categorías públicas | `https://fiora.mascontrol.app/api/catalogos/categorias/public` |

---

## 🎯 Ejemplo Completo: Tienda Online Externa

```html
<!DOCTYPE html>
<html>
<head>
    <style>
        .producto { border: 1px solid #ddd; padding: 20px; margin: 20px; }
        img { max-width: 200px; }
    </style>
</head>
<body>
    <h1>Tienda FIORA - Desde sitio externo</h1>
    <div id="tienda"></div>

    <script>
        async function cargarProductos() {
            const res = await fetch('https://fiora.mascontrol.app/api/products/public')
            const data = await res.json()
            
            const html = data.productos.map(p => `
                <div class="producto">
                    <img src="https://fiora.mascontrol.app${p.imagen}" alt="${p.nombre}">
                    <h3>${p.nombre}</h3>
                    <p>${p.descripcion}</p>
                    <h4>$${p.precio}</h4>
                    ${p.disponible ? '<button>Comprar</button>' : '<p>❌ Agotado</p>'}
                </div>
            `).join('')
            
            document.getElementById('tienda').innerHTML = html
        }
        
        cargarProductos()
    </script>
</body>
</html>
```

---

**Conclusión:** Ya tienes todo configurado para mostrar tus productos e imágenes en cualquier página web externa. Solo necesitas llamar a los endpoints públicos y usar las URLs que retornan. 🚀
