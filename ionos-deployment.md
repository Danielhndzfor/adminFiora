# Guía de Despliegue en IONOS Alma 9

## Requisitos previos
- Node.js 18+ instalado en IONOS
- npm o yarn
- Acceso SSH a tu VPS

## Pasos de despliegue

### 1. Conectarse al VPS
```bash
ssh usuario@tu-dominio.com
```

### 2. Clonar el repositorio
```bash
cd ~
git clone https://github.com/Danielhndzfor/adminFiora.git fiora-app
cd fiora-app
```

### 3. Instalar dependencias
```bash
npm install
```

### 4. Configurar variables de entorno
Crear archivo `.env.production`:
```bash
cp .env.local .env.production
```

Actualizar en `.env.production`:
```env
NODE_ENV=production
DATABASE_URL="mysql://u261887776_For:Forsito26@srv1442.hstgr.io:3306/u261887776_FioraAdmin"
JWT_SECRET="topsecretkeyforfioraapp"
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="fioraapp"
CLOUDINARY_API_KEY="263782784861927"
CLOUDINARY_API_SECRET="gbvZ6Qa5eYphO2D1KFl27QPFm1Q"
NEXT_PUBLIC_APP_URL="https://fiora.mascontrol.app"
CORS_ALLOWED_ORIGINS="https://fiora.mascontrol.app"
PORT=3000
```

### 5. Compilar para producción
```bash
npm run build
```

### 6. Ejecutar con PM2 (recomendado)
```bash
# Instalar PM2 globalmente (si no está)
npm install -g pm2

# Crear archivo de configuración pm2.config.js
cat > pm2.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: "fiora-app",
      script: "./server.js",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      },
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_file: "./logs/combined.log",
      time_format: "YYYY-MM-DD HH:mm:ss Z",
      autorestart: true,
      max_memory_restart: "1G"
    }
  ]
};
EOF

# Iniciar con PM2
pm2 start pm2.config.js

# Guardar configuración de PM2
pm2 save

# (Opcional) Configurar PM2 para iniciar con el sistema
pm2 startup
```

### 7. Configurar Nginx como proxy reverso
```bash
# Crear archivo de configuración nginx
sudo cat > /etc/nginx/sites-available/fiora << 'EOF'
server {
    listen 80;
    server_name fiora.mascontrol.app;
    client_max_body_size 100M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts aumentados
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Cache para assets estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 30d;
        proxy_cache off;
        expires 30d;
    }
}
EOF

# Habilitar sitio
sudo ln -s /etc/nginx/sites-available/fiora /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 8. Certificado SSL (HTTPS)
```bash
# Instalar Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtener certificado
sudo certbot --nginx -d fiora.mascontrol.app
```

## Monitoreo

### Logs de PM2
```bash
# Ver logs en tiempo real
pm2 logs fiora-app

# Ver logs específicos
pm2 logs fiora-app --err
pm2 logs fiora-app --out
```

### Verificar estado
```bash
pm2 status
pm2 monit  # Monitor en tiempo real
```

## Actualizaciones

```bash
# Detener la app
pm2 stop fiora-app

# Descargar cambios
git pull

# Reinstalar dependencias si hay cambios
npm install

# Compilar
npm run build

# Reiniciar
pm2 restart fiora-app
```

## Troubleshooting

### Error 500 en /api/products
- Verificar conexión a base de datos: `npm run prisma:test`
- Revisar logs: `pm2 logs fiora-app --err`
- Reiniciar: `pm2 restart fiora-app`

### Errores de permisos
- Los archivos deben ser propiedad del usuario: `chown -R usuario:usuario ~/fiora-app`

### Problema de memoria
- Monitorear con `pm2 monit`
- Aumentar limite si es necesario en pm2.config.js

## Base de datos

Para ejecutar migraciones de Prisma en servidor:
```bash
npx prisma migrate deploy
npx prisma db seed
```
