#!/bin/bash

# Script de despliegue para IONOS - Fiora App
# Uso: ./deploy.sh

set -e

echo "🚀 Iniciando despliegue de Fiora App..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variables
APP_DIR=$(pwd)
APP_NAME="fiora-app"

# 1. Validar que estamos en el directorio correcto
if [ ! -f "next.config.ts" ]; then
    echo -e "${RED}✗ Error: No estás en el directorio raíz de la app${NC}"
    exit 1
fi

# 2. Detener la app con PM2 si está corriendo
echo -e "${YELLOW}⏸  Deteniendo app...${NC}"
pm2 stop $APP_NAME 2>/dev/null || echo "App no estaba corriendo"

# 3. Descargar últimos cambios
echo -e "${YELLOW}📥 Descargando cambios del repositorio...${NC}"
git pull origin main || echo "Advertencia: No se pudo hacer git pull"

# 4. Instalar dependencias
echo -e "${YELLOW}📦 Instalando dependencias...${NC}"
npm install

# 5. Ejecutar migraciones de Prisma
echo -e "${YELLOW}🗄  Ejecutando migraciones de base de datos...${NC}"
npx prisma migrate deploy 2>/dev/null || echo "No hay migraciones pendientes"

# 6. Compilar para producción
echo -e "${YELLOW}🔨 Compilando para producción...${NC}"
npm run build

# 7. Reiniciar con PM2
echo -e "${YELLOW}🚀 Reiniciando aplicación...${NC}"
pm2 restart $APP_NAME

# 8. Verificar estado
sleep 2
if pm2 describe $APP_NAME | grep -q "online"; then
    echo -e "${GREEN}✓ App desplegada exitosamente${NC}"
    echo -e "${GREEN}✓ La aplicación está corriendo en: https://fiora.mascontrol.app${NC}"
    pm2 logs $APP_NAME --lines 20
else
    echo -e "${RED}✗ Error: La app no está corriendo${NC}"
    echo -e "${RED}Logs de error:${NC}"
    pm2 logs $APP_NAME --err --lines 50
    exit 1
fi
