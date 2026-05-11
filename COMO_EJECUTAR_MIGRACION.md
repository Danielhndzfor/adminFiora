# 🚀 CÓMO EJECUTAR LA MIGRACIÓN DE CLOUDINARY AL VPS

## 📌 Resumen Rápido

El script descarga TODAS las imágenes de Cloudinary y las guarda localmente en `/public/uploads/productos/` con nomenclatura: **CODIGO-PRODUCTO_NUMERO-IMAGEN.jpg**

Ejemplo:
- `ORO-001_0.jpg` (primer imagen del anillo ORO-001)
- `ORO-001_1.jpg` (segunda imagen del anillo ORO-001)
- `PLATA-005_0.jpg` (primera imagen de la pulsera PLATA-005)

---

## ✅ PASO 1: Desplegar cambios al VPS

Primero, asegúrate de que los últimos cambios estén en el repositorio:

```bash
# En tu máquina local
cd c:\Users\danie\Documents\Sistemas Personales\fiora-app
git add .
git commit -m "Actualizar nomenclatura de imágenes a código-producto_numero"
git push origin main
```

---

## 🔌 PASO 2: Conectarse al VPS por SSH

Abre PowerShell o terminal y conéctate al VPS:

```bash
ssh usuario@fiora.mascontrol.app
```

O si necesitas especificar el puerto:

```bash
ssh -p 22 usuario@[IP-DEL-VPS]
```

**Datos para conectar:**
- Host: `fiora.mascontrol.app` o tu IP del VPS
- Usuario: `usuario` (reemplaza con tu usuario real)
- Contraseña: (la que tengas configurada)

---

## 📂 PASO 3: Ir a la carpeta de la aplicación

Una vez conectado por SSH, ve a la carpeta de Fiora:

```bash
cd /var/www/fiora-app
```

---

## 🔄 PASO 4: Actualizar código desde GitHub

Descarga los cambios más recientes:

```bash
git pull origin main
```

**Salida esperada:**
```
From github.com:Danielhndzfor/adminFiora
 * branch            main       -> FETCH_HEAD
Already up to date.

O si hay cambios:

remote: Enumerating objects: 5, done.
Updating a1b2c3d..e5f6g7h
Fast-forward
 lib/local-upload.ts              | 25 ++++++++++++++++++
 scripts/migrate-cloudinary-to-local.ts | 40 +++++++++++++++++++++++
```

---

## 📦 PASO 5: Instalar dependencias (si es necesario)

```bash
npm install
```

---

## 🎯 PASO 6: Ejecutar la migración

**OPCIÓN A: Ejecutar con ts-node (recomendado)**

```bash
npx ts-node scripts/migrate-cloudinary-to-local.ts
```

**OPCIÓN B: Si ts-node no está disponible, compilar primero**

```bash
npm run build
node dist/scripts/migrate-cloudinary-to-local.js
```

---

## 📊 PASO 7: Monitorear el progreso

Verás una salida como esta:

```
🔄 Iniciando migración de imágenes...

📁 Directorio: /var/www/fiora-app/public/uploads/productos

📊 Total de productos con imágenes: 25

📦 Producto: Anillo de Oro 18K (Código: ORO-001) - 2 imágenes
  ⬇️  Descargando: https://res.cloudinary.com/fioraapp/image/upload/...
  ✓ Descargada: ORO-001_0.jpg
  ⬇️  Descargando: https://res.cloudinary.com/fioraapp/image/upload/...
  ✓ Descargada: ORO-001_1.jpg
  ✅ Actualizado en BD

📦 Producto: Pulsera de Plata (Código: PLATA-005) - 1 imagen
  ⬇️  Descargando: https://res.cloudinary.com/fioraapp/image/upload/...
  ✓ Descargada: PLATA-005_0.jpg
  ✅ Actualizado en BD

... (más productos)

==================================================

✅ MIGRACIÓN COMPLETADA
   - Imágenes migradas: 37
   - Errores: 0
   - Almacenamiento: /var/www/fiora-app/public/uploads/productos/
```

---

## ⏱️ ¿Cuánto tarda?

Depende de:
- **Cantidad de imágenes**: ~5-10 segundos por 10 imágenes
- **Tamaño de imágenes**: Imágenes grandes tardan más
- **Conexión**: Internet del VPS hacia Cloudinary

**Ejemplo:**
- 50 imágenes: ~2-3 minutos
- 100 imágenes: ~5-8 minutos

---

## 🔍 PASO 8: Verificar que funcionó

```bash
# Ver imágenes migradas
ls -lh /var/www/fiora-app/public/uploads/productos/ | head -20

# Contar total de imágenes
ls /var/www/fiora-app/public/uploads/productos/ | wc -l
```

**Salida esperada:**
```
-rw-r--r-- 1 www-data www-data 125K May 10 14:32 ORO-001_0.jpg
-rw-r--r-- 1 www-data www-data 98K  May 10 14:32 ORO-001_1.jpg
-rw-r--r-- 1 www-data www-data 156K May 10 14:33 PLATA-005_0.jpg
-rw-r--r-- 1 www-data www-data 142K May 10 14:33 PLATA-005_1.jpg

37  <-- Total de archivos
```

---

## 🗄️ PASO 9: Verificar en la base de datos

```bash
# Conectar a MySQL
mysql -u u261887776_For -p
# Ingresar contraseña: Forsito26

# Seleccionar BD
USE u261887776_FioraAdmin;

# Verificar que URLs cambiaron
SELECT id, codigo, nombre, 
       IF(imagenes LIKE '%/uploads/productos/%', 'LOCAL', 'CLOUDINARY') as tipo_imagen
FROM Producto 
WHERE imagenes IS NOT NULL 
LIMIT 5;
```

**Salida esperada:**
```
+----+--------+---------------+---------------+
| id | codigo | nombre        | tipo_imagen   |
+----+--------+---------------+---------------+
| 1  | ORO-001| Anillo de Oro | LOCAL         |
| 2  | PLATA-5| Pulsera Plata | LOCAL         |
| 3  | ORO-002| Otro Anillo   | LOCAL         |
+----+--------+---------------+---------------+

3 rows in set
```

Para salir de MySQL:
```bash
exit
```

---

## 🧪 PASO 10: Probar en navegador

Abre tu navegador y ve a:

```
https://fiora.mascontrol.app/api/products/public
```

Busca las URLs de imágenes. Deben verse así:

**✅ CORRECTO:**
```json
"imagenes": [
  {
    "url": "/uploads/productos/ORO-001_0.jpg",
    "nombreArchivo": "ORO-001_0.jpg",
    "orden": 1
  },
  {
    "url": "/uploads/productos/ORO-001_1.jpg",
    "nombreArchivo": "ORO-001_1.jpg",
    "orden": 2
  }
]
```

**❌ NO DEBERÍA VER:**
```json
"url": "https://res.cloudinary.com/fioraapp/..." // Cloudinary URL
```

---

## 🔄 PASO 11: Reiniciar la aplicación (opcional)

Si las imágenes no se muestran, reinicia PM2:

```bash
pm2 restart fiora
```

O si solo necesitas recargar en navegador:
```bash
Ctrl + F5  (en Windows/Linux)
Cmd + Shift + R  (en Mac)
```

---

## 🎯 RESUMEN DE COMANDOS RÁPIDO

Ejecuta estos comandos en orden:

```bash
# 1. Conectar al VPS
ssh usuario@fiora.mascontrol.app

# 2. Ir a carpeta de app
cd /var/www/fiora-app

# 3. Actualizar código
git pull origin main

# 4. Instalar deps
npm install

# 5. Ejecutar migración
npx ts-node scripts/migrate-cloudinary-to-local.ts

# 6. Verificar archivos
ls -lh public/uploads/productos/ | wc -l

# 7. (opcional) Reiniciar app
pm2 restart fiora
```

---

## ⚠️ SI ALGO SALE MAL

### Error: "Cannot find module 'ts-node'"

```bash
npm install -g ts-node
npm install -g typescript
npx ts-node scripts/migrate-cloudinary-to-local.ts
```

### Error: "Cannot connect to database"

Verifica que DATABASE_URL esté correcto:
```bash
cat .env | grep DATABASE_URL
```

Debería mostrar:
```
DATABASE_URL="mysql://u261887776_For:Forsito26@srv1442.hstgr.io:3306/u261887776_FioraAdmin"
```

Si es incorrecto, edita `.env`:
```bash
nano .env
# Edita DATABASE_URL
# Presiona Ctrl+X, luego Y, luego Enter para guardar
```

### Error: "No space left on device"

```bash
# Ver espacio disponible
df -h /var/www/fiora-app

# Si está lleno, liberar espacio
rm -rf node_modules  # Reinstalar: npm install
```

### Script se queda "colgado"

Presiona `Ctrl+C` para detenerlo y revisa:

```bash
# Verificar conexión a Cloudinary
curl -I "https://res.cloudinary.com/fioraapp/"

# Debería retornar 200 OK o similar
```

---

## ✅ CONFIRMACIÓN DE ÉXITO

Sabrás que funcionó cuando:

✅ El script termina con "MIGRACIÓN COMPLETADA"
✅ Las imágenes están en `/public/uploads/productos/`
✅ Los nombres son: `CODIGO-PRODUCTO_NUMERO.jpg`
✅ Las URLs en BD dicen `/uploads/productos/...`
✅ El API devuelve URLs locales (no Cloudinary)
✅ Las imágenes se ven en https://fiora.mascontrol.app

---

## 🎉 Listo!

Ya no dependerás de Cloudinary. Las imágenes están 100% en tu VPS.

**Opcional:** Si todo funciona perfectamente, puedes eliminar las variables de Cloudinary del `.env` y ahorrar mensualmente:

```bash
nano .env
# Elimina estas líneas:
# NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
# CLOUDINARY_API_KEY=...
# CLOUDINARY_API_SECRET=...
```

---

## 📞 Preguntas frecuentes

**¿Puedo ejecutar la migración 2 veces?**
Sí, es idempotente. Si ejecutas 2 veces, la 2ª no hace nada con las que ya están locales.

**¿Qué pasa si falla a mitad?**
Puedes ejecutar el script de nuevo. Descargará solo las que falten.

**¿Dónde quedan guardadas las imágenes?**
En `/var/www/fiora-app/public/uploads/productos/`
Y se sirven desde: `https://fiora.mascontrol.app/uploads/productos/ARCHIVO.jpg`

**¿Necesito hacer backup?**
Recomendado, pero el script es seguro y no modifica datos existentes en Cloudinary.

---

**¿Dudas? Ejecuta paso a paso y verás el progreso en consola.** 🚀
