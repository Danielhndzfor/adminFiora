# Fiora Admin - Sistema E-Commerce Profesional

## 📋 Descripción

Fiora Admin es una plataforma de administración de e-commerce profesional y segura, construida con **Next.js 14**, **Prisma ORM**, **MySQL (Hostinger)**, **Cloudinary** y autenticación mediante **JWT**. 

Incluye gestión completa de usuarios, productos, órdenes, catálogos y un sistema de seguridad enterprise-level.

---

## 🔐 Características de Seguridad

✅ **Autenticación JWT** - Tokens seguros con expiración de 7 días  
✅ **Contraseñas Hasheadas** - Bcrypt con 10 rounds de salt  
✅ **Validaciones Robustas** - Email, contraseña segura, inputs sanitizados  
✅ **Recuperación de Contraseña** - Tokens temporales de 1 hora  
✅ **Roles y Permisos** - ADMINISTRADOR, VENDEDOR, CLIENTE  
✅ **Soft Delete** - Datos no se eliminan, solo se marcan inactivos  

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MySQL (Hostinger)
- **ORM**: Prisma v4
- **Auth**: JWT + Bcrypt
- **Storage**: Cloudinary (imágenes)
- **Email**: Nodemailer (configurar)

---

## 📁 Estructura de Archivos

```
fiora-app/
├── app/
│   ├── api/
│   │   ├── autenticacion/
│   │   │   ├── registro/route.ts
│   │   │   ├── iniciar-sesion/route.ts
│   │   │   ├── olvide-contrasena/route.ts
│   │   │   └── restablecimiento/route.ts
│   │   ├── productos/route.ts
│   │   ├── usuarios/route.ts
│   │   ├── ordenes/route.ts
│   │   └── payment-methods/route.ts
│   ├── iniciar-sesion/page.tsx
│   ├── registro/page.tsx
│   ├── olvide-contrasena/page.tsx
│   ├── dashboard/page.tsx
│   └── page.tsx (redirige a login)
├── components/
│   ├── auth/
│   │   ├── login-form.tsx
│   │   ├── register-form.tsx
│   │   └── forgot-password-form.tsx
│   └── ui/
├── lib/
│   ├── prisma.ts (instancia singleton)
│   ├── seguridad.ts (JWT, bcrypt, validaciones)
│   ├── middleware-auth.ts
│   ├── product-code-generator.ts
│   ├── ticket-generator.ts
│   └── cloudinary.ts
├── prisma/
│   ├── schema.prisma (base de datos)
│   └── seed.ts (datos iniciales)
├── .env.local (variables de entorno)
└── package.json
```

---

## 🗄️ Modelo de Datos (Database)

### Tablas Principales

**Usuario**
- id, correo (único), contrasena (hash)
- nombre, apellido, telefono, direccion
- rolId → RolCatalogo
- Campos de seguridad: verificado, tokenVerificacion, tokenRestablecimiento
- Timestamps: creadoEn, actualizadoEn, ultimoAcceso

**Producto**
- id, codigo (único: F00001, F00002...), nombre
- descripcion, palabrasClave, precio, costo, stock, imagen
- categoriaId → CategoriaCatalogo
- activo (soft delete), creadoEn, actualizadoEn

**Orden (Ticket)**
- id, numeroTicket (único: TKT-2026-0001...), usuarioId, metodoPagoId
- estatus (PENDIENTE, PAGADA, ENVIADA, ENTREGADA, CANCELADA)
- montoTotal, notas, creadoEn, actualizadoEn

**ItemOrden**
- Detalles de cada producto en la orden
- cantidad, precioEn (price snapshot)

**Catálogos** (RolCatalogo, CategoriaCatalogo, MetodoPagoCatalogo)
- Datos maestros configurables

---

## 🚀 Instalación y Setup

### 1. Clonar el proyecto
```bash
git clone <tu-repo>
cd fiora-app
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Copia `.env.local.example` a `.env.local` y completa:

```env
# Base de datos
DATABASE_URL="mysql://usuario:contraseña@host:puerto/basedatos"

# JWT (cambiar en producción)
JWT_SECRET="tu-secreto-muy-seguro-cambiar-en-produccion"

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=tu-cloud-name
CLOUDINARY_API_KEY=tu-api-key
CLOUDINARY_API_SECRET=tu-api-secret

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Preparar la base de datos
```bash
# Sincronizar schema (crea tablas)
npx prisma db push

# Llenar datos iniciales (roles, categorías, métodos de pago)
npx ts-node prisma/seed.ts
```

### 5. Ejecutar en desarrollo
```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) → **Redirige a login automáticamente**

---

## 📝 Flujos Principales

### Registro de Usuario
```
POST /api/autenticacion/registro
{
  "correo": "usuario@ejemplo.com",
  "contrasena": "Segura#123",
  "nombre": "Juan",
  "apellido": "Pérez",
  "telefono": "+1234567890"
}

Response:
{
  "mensaje": "Usuario registrado exitosamente",
  "usuario": { id, correo, nombre, apellido, creadoEn },
  "token": "eyJhbGc..."
}
```

### Iniciar Sesión
```
POST /api/autenticacion/iniciar-sesion
{
  "correo": "usuario@ejemplo.com",
  "contrasena": "Segura#123"
}

Response:
{
  "usuario": { id, correo, nombre, rol },
  "token": "eyJhbGc..."
}
```

### Crear Producto
```
POST /api/productos
{
  "nombre": "Laptop Pro",
  "descripcion": "Laptop de alta gama",
  "precio": 999.99,
  "costo": 500.00,
  "stock": 10,
  "categoriaId": 1,
  "imagenBase64": "data:image/png;base64,..."
}

Response:
{
  "codigo": "F00001",
  "nombre": "Laptop Pro",
  "imagen": "https://res.cloudinary.com/...",
  ...
}
```

### Crear Orden
```
POST /api/ordenes
{
  "usuarioId": 1,
  "paymentMethodId": 1,
  "items": [
    { "productId": 1, "quantity": 2 },
    { "productId": 2, "quantity": 1 }
  ],
  "notas": "Envío urgente"
}

Response:
{
  "numeroTicket": "TKT-2026-0001",
  "usuarioId": 1,
  "estatus": "PENDIENTE",
  "montoTotal": 1999.98,
  "items": [ ... ]
}
```

---

## 🔌 Endpoints API

### Autenticación
- `POST /api/autenticacion/registro` - Crear cuenta
- `POST /api/autenticacion/iniciar-sesion` - Login
- `POST /api/autenticacion/olvide-contrasena` - Solicitar restablecimiento
- `POST /api/autenticacion/restablecimiento` - Cambiar contraseña

### Productos
- `GET /api/productos` - Listar (con búsqueda)
- `POST /api/productos` - Crear
- `PUT /api/productos/[id]` - Editar
- `DELETE /api/productos/[id]` - Desactivar (soft delete)

### Órdenes
- `GET /api/ordenes` - Listar
- `POST /api/ordenes` - Crear
- `GET /api/ordenes/[id]` - Obtener detalles
- `PUT /api/ordenes/[id]` - Cambiar estatus

### Métodos de Pago
- `GET /api/payment-methods` - Listar catálogo
- `POST /api/payment-methods` - Crear (admin only)

### Usuarios
- `GET /api/usuarios` - Listar
- `POST /api/usuarios` - Crear

---

## 🔒 Seguridad - Validaciones

### Contraseña (campo `esContrasenaSegu​ra`)
✅ Mínimo 8 caracteres  
✅ Mayúsculas  
✅ Números  
✅ Caracteres especiales (!@#$%^&*)  

### Email
✅ Formato válido con regex

### Token JWT
✅ Válido 7 días  
✅ Contiene usuarioId y correo  
✅ Firmado con JWT_SECRET  

### Base de Datos
✅ Contraseñas: SHA256 + BCRYPT  
✅ Índices en campos críticos (correo, codigo, numeroTicket)  
✅ Relaciones con CASCADE DELETE  

---

## 📧 Integración con Email (TODO)

Para recuperación de contraseña, configura Nodemailer:

```typescript
// lib/email.ts (crear archivo)
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
})

export async function enviarEmailRestablecimiento(correo: string, token: string) {
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/restablecimiento?token=${token}`
  
  await transporter.sendMail({
    from: 'noreply@fiora.com',
    to: correo,
    subject: 'Restablece tu contraseña',
    html: `<a href="${url}">Haz clic aquí para restablecerla</a>`,
  })
}
```

---

## 🚀 Despliegue en Hostinger

### 1. Preparación
```bash
# Build para producción
npm run build

# Verificar que no hay errores
npm run lint
```

### 2. Variables en Hostinger
Panel de Control → Aplicaciones → Variables de Entorno:
```
DATABASE_URL=mysql://...
JWT_SECRET=genera-una-cadena-aleatoria-larga
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
NEXT_PUBLIC_APP_URL=https://tudominio.com
```

### 3. Desplegar
```bash
# Push a rama main
git push origin main

# Hostinger detectará cambios y desplegará automáticamente
```

---

## 🧪 Testing

```bash
# Prueba de endpoints con curl
curl -X POST http://localhost:3000/api/autenticacion/iniciar-sesion \
  -H "Content-Type: application/json" \
  -d '{"correo":"test@test.com","contrasena":"Test#1234"}'

# Ver logs
npm run dev -- --debug
```

---

## 📊 Monitoreo

- **Logs**: Revisar `console.error()` en rutas API
- **Base de datos**: Usar Prisma Studio para inspeccionar datos
  ```bash
  npx prisma studio
  ```
- **Variables**: Verificar en Dashboard de Hostinger

---

## 🤝 Contribuir

1. Crear rama: `git checkout -b feature/nueva-funcion`
2. Hacer cambios
3. Commit: `git commit -m "feat: descripcion"`
4. Push: `git push origin feature/nueva-funcion`
5. Crear Pull Request

---

## 📄 Licencia

MIT - Libre para uso comercial

---

## 📞 Contacto & Soporte

- Email: support@fiora.com
- Docs: [Ver schema.prisma](./prisma/schema.prisma)
- Issues: Reportar en GitHub

---

**Última actualización**: 6 de abril de 2026  
**Versión**: 1.0.0 (Beta)
