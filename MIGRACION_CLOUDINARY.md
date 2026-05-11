# 📸 Migración de Imágenes: Cloudinary → Almacenamiento Local

## 📋 Resumen

Este script descarga todas las imágenes de Cloudinary y las guarda localmente en el VPS, actualizando automáticamente las URLs en la base de datos.

---

## ⚙️ Requisitos Previos

✅ Base de datos con productos que tienen imágenes de Cloudinary
✅ Acceso al VPS (SSH)
✅ Node.js instalado en el VPS

---

## 🚀 Pasos de Migración

### **Paso 1: Preparar en desarrollo (local)**

El script ya está creado en: `scripts/migrate-cloudinary-to-local.ts`

```bash
# Verificar que el archivo existe
ls scripts/migrate-cloudinary-to-local.ts
```

### **Paso 2: Desplegar a VPS**

```bash
git add scripts/migrate-cloudinary-to-local.ts
git commit -m "feat: Script de migración de Cloudinary a almacenamiento local"
git push
```

### **Paso 3: Conectarse al VPS por SSH**

```bash
ssh usuario@fiora.mascontrol.app
# o
ssh usuario@[IP-del-VPS]
```

### **Paso 4: Actualizar código en VPS**

```bash
cd /var/www/fiora-app
git pull origin main
npm install
```

### **Paso 5: Ejecutar el script de migración**

```bash
# Opción A: Compilar y ejecutar con ts-node
npx ts-node scripts/migrate-cloudinary-to-local.ts

# Opción B: Si ts-node no está disponible, compilar primero
npm run build
node dist/scripts/migrate-cloudinary-to-local.js
```

### **Paso 6: Verificar migración**

```bash
# Ver imágenes migradas
ls -lah /var/www/fiora-app/public/uploads/productos/

# Verificar en BD que URLs cambiaron
mysql -u usuario -p nombre_bd
> SELECT id, nombre, imagenes FROM Producto LIMIT 1;
```

---

## 📊 Qué Hace el Script

1. **Busca todos los productos** con imágenes en Cloudinary
2. **Descarga cada imagen** desde Cloudinary
3. **Guarda localmente** en `/public/uploads/productos/`
4. **Renombra archivos** con formato: `[timestamp]_[index].jpg`
5. **Actualiza BD** con nuevas URLs locales
6. **Reporta progreso** en consola

---

## 📝 Ejemplo de Salida

```
🔄 Iniciando migración de imágenes...

📁 Directorio: /var/www/fiora-app/public/uploads/productos

📊 Total de productos con imágenes: 12

📦 Producto: Anillo de Oro 18K (2 imágenes)
  ⬇️  Descargando: https://res.cloudinary.com/...
  ✓ Descargada: 1715338800000_0.jpg
  ⬇️  Descargando: https://res.cloudinary.com/...
  ✓ Descargada: 1715338800001_1.jpg
  ✅ Actualizado en BD

...

==================================================

✅ MIGRACIÓN COMPLETADA
   - Imágenes migradas: 28
   - Errores: 0
   - Almacenamiento: /var/www/fiora-app/public/uploads/productos/
```

---

## 🔍 Antes vs Después

### Antes (Cloudinary)
```json
{
  "imagenes": "[
    {
      \"url\": \"https://res.cloudinary.com/fioraapp/image/upload/v1715338800/fiora/productos/ORO-001_abc123.jpg\",
      \"nombreArchivo\": \"ORO-001_abc123.jpg\",
      \"orden\": 1,
      \"creadoEn\": \"2025-05-10T15:30:00Z\"
    }
  ]"
}
```

### Después (Local)
```json
{
  "imagenes": "[
    {
      \"url\": \"/uploads/productos/1715338800000_0.jpg\",
      \"nombreArchivo\": \"1715338800000_0.jpg\",
      \"orden\": 1,
      \"creadoEn\": \"2025-05-10T15:30:00Z\"
    }
  ]"
}
```

---

## ⚠️ Consideraciones Importantes

### ✅ Ventajas
- URLs independientes de Cloudinary
- Imágenes almacenadas en tu VPS
- Sin costos de servicio externo
- Control total sobre las imágenes

### ⚠️ Precauciones
- **Ejecutar UNA SOLA VEZ** - El script es idempotente pero mejor solo ejecutarlo una vez
- **Backup de BD** - Hacer backup antes de ejecutar:
  ```bash
  mysqldump -u usuario -p base_datos > backup_antes_migracion.sql
  ```
- **Espacio en disco** - Verificar que hay espacio suficiente:
  ```bash
  df -h /var/www/fiora-app
  ```
- **Tiempo** - Puede tardar dependiendo de:
  - Cantidad de productos
  - Tamaño de imágenes
  - Velocidad de descarga de Cloudinary

---

## 🔧 Solución de Problemas

### Error: "Cannot find module 'ts-node'"

```bash
# Instalar ts-node globalmente
npm install -g ts-node
npm install -g typescript

# Luego intentar de nuevo
npx ts-node scripts/migrate-cloudinary-to-local.ts
```

### Error: "Cannot connect to database"

```bash
# Verificar que DATABASE_URL está correcto en .env
cat .env | grep DATABASE_URL

# Si es incorrecto, actualizar
nano .env
# Presionar Ctrl+X para salir después de editar
```

### Error: "No space left on device"

```bash
# Verificar espacio disponible
df -h

# Liberar espacio si es necesario
# Opción 1: Comprimir archivos viejos
tar -czf old_uploads.tar.gz public/uploads/

# Opción 2: Eliminar logs antiguos
rm logs/*.old
```

### Las imágenes no se descargan

```bash
# Verificar que Cloudinary URL sigue siendo válida
curl -I "https://res.cloudinary.com/..."
# Debe retornar 200 OK

# Si retorna 403/404, las imágenes pueden estar expiradas en Cloudinary
```

---

## 📞 Rollback (Si algo sale mal)

Si necesitas revertir la migración:

```bash
# 1. Restaurar BD desde backup
mysql -u usuario -p base_datos < backup_antes_migracion.sql

# 2. Limpiar imágenes locales
rm -rf public/uploads/productos/*

# 3. Reiniciar app
pm2 restart fiora
```

---

## ✅ Verificación Post-Migración

Después de ejecutar el script, verifica:

```bash
# 1. Imágenes guardadas localmente
ls -lah public/uploads/productos/ | head -10

# 2. URLs actualizadas en BD
mysql -u usuario -p -e "SELECT COUNT(*) as total FROM Producto WHERE imagenes LIKE '%/uploads/productos/%';"

# 3. Acceso a imágenes desde navegador
curl https://fiora.mascontrol.app/uploads/productos/[nombre-archivo].jpg
# Debe retornar la imagen correctamente

# 4. API retorna imágenes correctas
curl https://fiora.mascontrol.app/api/products/public | jq '.productos[0].imagen'
# Debe mostrar: /uploads/productos/[archivo].jpg
```

---

## 🎯 Próximos Pasos

Una vez completada la migración:

1. **Opcional: Eliminar de Cloudinary** 
   - Si deseas ahorrar espacio en Cloudinary
   - Ir a https://cloudinary.com y limpiar imágenes viejas

2. **Remover variable de Cloudinary** (opcional)
   ```bash
   # Ya no necesitarás estas variables
   # NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
   # CLOUDINARY_API_KEY
   # CLOUDINARY_API_SECRET
   ```

3. **Actualizar documentación**
   - Ya está hecho con PAGINA_WEB_EXTERNA.md

---

## 📚 Archivos Relacionados

- Script: `scripts/migrate-cloudinary-to-local.ts`
- Handler local: `lib/local-upload.ts`
- Endpoints: `app/api/products/route.ts`, `app/api/products/[id]/route.ts`
- Documentación: `PAGINA_WEB_EXTERNA.md`

---

**¿Listo para ejecutar la migración?** 🚀
