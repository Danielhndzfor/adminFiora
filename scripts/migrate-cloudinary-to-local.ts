import fs from 'fs/promises'
import path from 'path'
import https from 'https'
import prisma from '@/lib/prisma'

/**
 * Script para migrar imágenes de Cloudinary a almacenamiento local
 * Uso: node prisma/migrate-images.ts
 * 
 * ⚠️ IMPORTANTE: Solo ejecutar UNA VEZ en producción
 */

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'productos')

/**
 * Descarga una imagen desde una URL
 */
async function downloadImage(url: string, filename: string): Promise<boolean> {
  return new Promise((resolve) => {
    https
      .get(url, async (response) => {
        if (response.statusCode !== 200) {
          console.error(`❌ Error descargando ${url}: ${response.statusCode}`)
          resolve(false)
          return
        }

        try {
          const filePath = path.join(UPLOAD_DIR, filename)
          const writeStream = await fs.open(filePath, 'w')
          
          response.pipe(writeStream as any)
          
          response.on('end', () => {
            writeStream.close()
            console.log(`✓ Descargada: ${filename}`)
            resolve(true)
          })
        } catch (error) {
          console.error(`❌ Error guardando ${filename}:`, error)
          resolve(false)
        }
      })
      .on('error', (error) => {
        console.error(`❌ Error en descarga de ${url}:`, error)
        resolve(false)
      })
  })
}

/**
 * Genera nombre de archivo usando código de producto
 * Formato: {CODIGO-PRODUCTO}_{NUMERO-IMAGEN}.jpg
 * Ejemplo: ORO-001_0.jpg, ORO-001_1.jpg
 */
function generateFilename(codigoProducto: string, index: number): string {
  return `${codigoProducto}_${index}.jpg`
}

/**
 * Extrae extensión de una URL (fallback a jpg)
 */
function getExtension(url: string): string {
  try {
    const ext = url.split('.').pop()?.split('?')[0] || 'jpg'
    return ['jpg', 'jpeg', 'png', 'webp'].includes(ext.toLowerCase()) ? ext.toLowerCase() : 'jpg'
  } catch {
    return 'jpg'
  }
}

/**
 * Convierte URL de Cloudinary a local
 */
function convertUrlToLocal(newFilename: string): string {
  return `/uploads/productos/${newFilename}`
}

/**
 * Migra productos de Cloudinary a almacenamiento local
 */
async function migrateProducts() {
  console.log('🔄 Iniciando migración de imágenes...\n')

  try {
    // Garantizar que existe el directorio
    await fs.mkdir(UPLOAD_DIR, { recursive: true })
    console.log(`📁 Directorio: ${UPLOAD_DIR}\n`)

    // Obtener todos los productos con imágenes
    const productos = await prisma.producto.findMany({
      where: {
        imagenes: {
          not: null,
        },
      },
    })

    console.log(`📊 Total de productos con imágenes: ${productos.length}\n`)

    let migratedCount = 0
    let errorCount = 0

    for (const producto of productos) {
      try {
        const imagenesList = JSON.parse((producto.imagenes as string) || '[]')

        if (!Array.isArray(imagenesList) || imagenesList.length === 0) {
          continue
        }

        console.log(`\n📦 Producto: ${producto.nombre} (Código: ${producto.codigo}) - ${imagenesList.length} imágenes`)

        // Descargar y migrar cada imagen
        for (let i = 0; i < imagenesList.length; i++) {
          const oldImage = imagenesList[i]
          const cloudinaryUrl = oldImage.url

          // Saltar si ya es URL local
          if (cloudinaryUrl.startsWith('/uploads/')) {
            console.log(`  ⏭️  Ya es local: ${oldImage.nombreArchivo}`)
            continue
          }

          const newFilename = generateFilename(producto.codigo, i)
          console.log(`  ⬇️  Descargando: ${cloudinaryUrl.substring(0, 60)}...`)

          const success = await downloadImage(cloudinaryUrl, newFilename)

          if (success) {
            // Actualizar la URL en memoria
            imagenesList[i].url = convertUrlToLocal(newFilename)
            imagenesList[i].nombreArchivo = newFilename
            migratedCount++
          } else {
            errorCount++
          }
        }

        // Actualizar BD con nuevas URLs
        await prisma.producto.update({
          where: { id: producto.id },
          data: {
            imagenes: JSON.stringify(imagenesList),
          },
        })

        console.log(`  ✅ Actualizado en BD`)
      } catch (error) {
        console.error(`  ❌ Error procesando producto ${producto.id}:`, error)
        errorCount++
      }
    }

    console.log(`\n${'='.repeat(50)}`)
    console.log(`\n✅ MIGRACIÓN COMPLETADA`)
    console.log(`   - Imágenes migradas: ${migratedCount}`)
    console.log(`   - Errores: ${errorCount}`)
    console.log(`   - Almacenamiento: ${UPLOAD_DIR}\n`)
  } catch (error) {
    console.error('❌ Error en migración:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

/**
 * Punto de entrada
 */
migrateProducts().catch(console.error)
