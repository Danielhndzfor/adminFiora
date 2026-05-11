/**
 * Script de migración: Cloudinary → Servidor FTP
 * Descarga imágenes de Cloudinary, las renombra y sube a fioraImages
 * 
 * Uso: npx ts-node prisma/migrate-images.ts [options]
 * Options:
 *   --dry-run    Solo muestra qué haría sin realizar cambios
 *   --limit NUM  Procesa solo NUM productos (p.ej. --limit 5)
 */

import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import axios from 'axios'
import FTP from 'ftp'
import { v2 as cloudinary } from 'cloudinary'
import prisma from '@/lib/prisma'

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Configuraciones desde .env
const FTP_CONFIG = {
  host: process.env.FTP_HOST || '198.251.78.127',
  user: process.env.FTP_USER || 'sad-diffie_u3flty379x',
  password: process.env.FTP_PASSWORD || 'pPT2gFp7drm2i~g@',
  port: parseInt(process.env.FTP_PORT || '21'),
}

const REMOTE_PATH = process.env.FTP_REMOTE_PATH || '/httpdocs/fioraImages'
const BASE_URL = process.env.FTP_BASE_URL || 'https://sad-diffie.198-251-78-127.plesk.page/fioraImages'
const TMP_DIR = path.join(process.cwd(), '.tmp-images')

// Tipos
interface ProductoImagen {
  url: string
  nombreArchivo: string
  orden: number
  creadoEn: string
}

// Utilidades
const sanitizeFilename = (str: string): string => {
  return str
    .replace(/[^a-zA-Z0-9-_]/g, '_') // Solo alfanuméricos, guión, _ 
    .replace(/_+/g, '_') // Reemplazar múltiples _ por uno
    .toLowerCase()
    .slice(0, 50) // Limitar longitud
}

const getFileExtension = (contentType: string): string => {
  const typeMap: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/svg+xml': 'svg',
  }
  return typeMap[contentType] || 'jpg'
}

const ensureTmpDir = () => {
  if (!fs.existsSync(TMP_DIR)) {
    fs.mkdirSync(TMP_DIR, { recursive: true })
  }
}

const cleanupTmpDir = () => {
  if (fs.existsSync(TMP_DIR)) {
    const files = fs.readdirSync(TMP_DIR)
    files.forEach(file => {
      fs.unlinkSync(path.join(TMP_DIR, file))
    })
    fs.rmdirSync(TMP_DIR)
  }
}

/**
 * Descarga imagen desde URL
 */
const downloadImage = async (url: string): Promise<Buffer> => {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 30000,
    })
    return Buffer.from(response.data)
  } catch (error) {
    console.error(`Error descargando ${url}:`, error)
    throw error
  }
}

/**
 * Sube archivo via FTP
 */
const uploadViaFTP = async (
  ftp: FTP,
  localPath: string,
  remoteFilename: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const rs = fs.createReadStream(localPath)
    const remoteFile = path.posix.join(REMOTE_PATH, remoteFilename)
    
    rs.on('error', reject)
    
    ftp.put(rs, remoteFile, (err) => {
      if (err) {
        reject(err)
      } else {
        console.log(`  ✓ Subido: ${remoteFilename}`)
        resolve()
      }
    })
  })
}

/**
 * Procesa un producto: descarga, renombra, sube
 */
const processProduct = async (
  ftp: FTP,
  producto: any,
  index: number
): Promise<ProductoImagen[] | null> => {
  return new Promise(async (resolve) => {
    try {
      console.log(`\n[${index + 1}] Producto: ${producto.codigo} (${producto.nombre})`)

      const imagenes: ProductoImagen[] = []

      // Si el producto ya tiene imagen en Cloudinary o BD
      if (producto.imagen) {
        console.log(`  - Migrando imagen actual...`)

        const tmpFile = path.join(TMP_DIR, `temp_1`)

        // Descargar
        const imageBuffer = await downloadImage(producto.imagen)

        // Obtener extensión (si viene en URL, usarla; si no, asumir jpg)
        let ext = 'jpg'
        try {
          const urlObj = new URL(producto.imagen)
          const pathname = urlObj.pathname
          const match = pathname.match(/\.(\w+)(?:\?|$)/)
          if (match) ext = match[1].toLowerCase()
        } catch {}

        // Renombrar: codigo_producto_1.ext
        const sanitizedCodigo = sanitizeFilename(producto.codigo)
        const filename = `${sanitizedCodigo}_1.${ext}`

        // Guardar localmente
        fs.writeFileSync(tmpFile, imageBuffer)

        // Subir
        try {
          await uploadViaFTP(ftp, tmpFile, filename)

          // Crear registro
          imagenes.push({
            url: `${BASE_URL}/${filename}`,
            nombreArchivo: filename,
            orden: 1,
            creadoEn: new Date().toISOString(),
          })
        } catch (uploadError) {
          console.error(`  ✗ Error subiendo ${filename}:`, uploadError)
        }
      }

      resolve(imagenes.length > 0 ? imagenes : null)
    } catch (error) {
      console.error(`  ✗ Error procesando ${producto.codigo}:`, error)
      resolve(null)
    }
  })
}

/**
 * Main
 */
const main = async () => {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const limitIdx = args.indexOf('--limit')
  const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1]) : undefined

  console.log('🔄 Iniciando migración de imágenes...')
  console.log(`   Cloudinary -> ${BASE_URL}`)
  console.log(`   Modo: ${dryRun ? 'DRY RUN' : 'EJECUCIÓN'}`)
  if (limit) console.log(`   Límite: ${limit} productos`)

  ensureTmpDir()

  const ftp = new FTP()
  let connectionOk = false

  try {
    // Conectar FTP
    console.log('\n📡 Conectando FTP...')
    await new Promise<void>((resolve, reject) => {
      ftp.on('ready', () => {
        connectionOk = true
        console.log('✓ Conexión FTP establecida')
        resolve()
      })

      ftp.on('error', (err) => {
        reject(err)
      })

      ftp.connect(FTP_CONFIG)
    })

    // Verificar directorio remoto
    try {
      await new Promise<void>((resolve, reject) => {
        ftp.list(REMOTE_PATH, (err) => {
          if (err) {
            reject(err)
          } else {
            console.log(`✓ Directorio remoto existe: ${REMOTE_PATH}`)
            resolve()
          }
        })
      })
    } catch (error) {
      console.log(`⚠ Intentando crear directorio remoto: ${REMOTE_PATH}`)
      try {
        await new Promise<void>((resolve, reject) => {
          ftp.mkdir(REMOTE_PATH, true, (err) => {
            if (err) {
              reject(err)
            } else {
              console.log(`✓ Directorio creado`)
              resolve()
            }
          })
        })
      } catch (mkdirError) {
        console.error('Error creando directorio:', mkdirError)
      }
    }

    // Obtener productos
    console.log('\n📋 Obteniendo productos...')
    let query = prisma.producto.findMany({
      where: { activo: true },
      orderBy: { id: 'asc' },
    })

    if (limit) {
      query = (query as any).take(limit)
    }

    const productos = await query
    console.log(`✓ ${productos.length} producto(s) encontrado(s)`)

    if (productos.length === 0) {
      console.log('✓ No hay productos para migrar')
      ftp.end()
      return
    }

    // Procesar cada producto
    console.log('\n🖼️  Migrando imágenes...')
    let migratedCount = 0

    for (let i = 0; i < productos.length; i++) {
      const producto = productos[i]
      const imagenesNuevas = await processProduct(ftp, producto, i)

      if (imagenesNuevas && imagenesNuevas.length > 0 && !dryRun) {
        // Actualizar BD
        await prisma.producto.update({
          where: { id: producto.id },
          data: { imagenes: JSON.stringify(imagenesNuevas) } as any,
        })
        console.log(`  ✓ BD actualizada`)
        migratedCount++
      }
    }

    console.log(`\n✅ Migración completada: ${migratedCount}/${productos.length} productos`)

    if (dryRun) {
      console.log('\n💡 Este fue un DRY RUN. Sin cambios en BD ni archivos.')
    }

    ftp.end()
  } catch (error) {
    console.error('\n❌ Error durante migración:', error)
    process.exit(1)
  } finally {
    if (connectionOk) {
      try {
        ftp.end()
      } catch (e) {
        // ignore
      }
    }
    cleanupTmpDir()
    await prisma.$disconnect()
  }
}

main()
