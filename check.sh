#!/bin/bash

# Script de verificación pre-despliegue para Fiora App
# Uso: ./check.sh

echo "🔍 Verificando configuración de Fiora App..."

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

# 1. Verificar archivo de configuración
echo -e "\n${YELLOW}📋 Verificando configuración...${NC}"

if [ ! -f ".env.local" ]; then
    echo -e "${RED}✗ Falta .env.local${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✓ .env.local existe${NC}"
    
    # Verificar variables requeridas
    REQUIRED_VARS=("DATABASE_URL" "JWT_SECRET" "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME" "NEXT_PUBLIC_APP_URL")
    
    for var in "${REQUIRED_VARS[@]}"; do
        if grep -q "^$var=" .env.local; then
            echo -e "${GREEN}✓ $var está configurada${NC}"
        else
            echo -e "${RED}✗ Falta $var en .env.local${NC}"
            ERRORS=$((ERRORS + 1))
        fi
    done
fi

# 2. Verificar dependencias instaladas
echo -e "\n${YELLOW}📦 Verificando dependencias...${NC}"

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠ node_modules no existe, ejecuta: npm install${NC}"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✓ node_modules existe${NC}"
fi

# 3. Verificar estructura de directorio
echo -e "\n${YELLOW}📁 Verificando estructura...${NC}"

REQUIRED_DIRS=("app" "components" "lib" "prisma" "public")

for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo -e "${GREEN}✓ $dir existe${NC}"
    else
        echo -e "${RED}✗ Falta directorio: $dir${NC}"
        ERRORS=$((ERRORS + 1))
    fi
done

# 4. Verificar archivos críticos
echo -e "\n${YELLOW}📄 Verificando archivos críticos...${NC}"

REQUIRED_FILES=("next.config.ts" "package.json" "tsconfig.json" "prisma/schema.prisma")

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓ $file existe${NC}"
    else
        echo -e "${RED}✗ Falta archivo: $file${NC}"
        ERRORS=$((ERRORS + 1))
    fi
done

# 5. Verificar configuración de build
echo -e "\n${YELLOW}🔨 Verificando configuración de build...${NC}"

if grep -q '"build"' package.json; then
    echo -e "${GREEN}✓ Script de build existe${NC}"
else
    echo -e "${RED}✗ Script de build no existe${NC}"
    ERRORS=$((ERRORS + 1))
fi

# 6. Verificar Git
echo -e "\n${YELLOW}🌐 Verificando Git...${NC}"

if [ -d ".git" ]; then
    echo -e "${GREEN}✓ Repositorio Git existe${NC}"
    
    # Verificar rama
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    echo -e "${GREEN}✓ Rama actual: $CURRENT_BRANCH${NC}"
    
    # Verificar cambios sin commitear
    if [ -z "$(git status --porcelain)" ]; then
        echo -e "${GREEN}✓ No hay cambios sin commitear${NC}"
    else
        echo -e "${YELLOW}⚠ Hay cambios sin commitear${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "${YELLOW}⚠ No es un repositorio Git${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

# Resumen
echo -e "\n${YELLOW}📊 Resumen:${NC}"
echo -e "Errores: ${RED}$ERRORS${NC}"
echo -e "Advertencias: ${YELLOW}$WARNINGS${NC}"

if [ $ERRORS -eq 0 ]; then
    echo -e "\n${GREEN}✓ ¡Configuración lista para despliegue!${NC}"
    exit 0
else
    echo -e "\n${RED}✗ Hay errores que resolver antes de desplegar${NC}"
    exit 1
fi
