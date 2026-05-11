import fs from 'fs/promises'
import path from 'path'
import https from 'https'
import prisma from '@/lib/prisma'

/**
 * Script para migrar imágenes de Cloudinary a almacenamiento local
 * Estructura: /public/uploads/productos/{CODIGO-PRODUCTO}/imagen_{numero}.jpg
 * Uso: npx ts-node scripts/migrate-cloudinary-to-local.ts
 * 
 * ⚠️ IMPORTANTE: Solo ejecutar UNA VEZ en producción
 */

const UPLOAD_BASE_DIR = path.join(process.cwd(), 'public', 'uploads', 'productos')

/**
 * Descarga una imagen desde una URL
 */
async function downloadImage(url: string, filePath: string): Promise<boolean> {
  return new Promise((resolve) => {
    https
      .get(url, async (response) => {
        if (response.statusCode !== 200) {
          console.error(`❌ Error descargando ${url}: ${response.statusCode}`)
          resolve(false)
          return
        }

        try {
          const chunks: Buffer[] = []
          response.on('data', (chunk) => chunks.push(chunk))
          response.on('end', async () => {
            try {
              const imageBuffer = Buffer.concat(chunks)
              await fs.writeFile(filePath, imageBuffer)
              console.log(`  ✓ Descargada: ${path.basename(filePath)}`)
              resolve(true)
            } catch (error) {
              console.error(`❌ Error guardando archivo:`, error)
              resolve(false)
            }
          })
        } catch (error) {
          console.error(`❌ Error procesando respuesta:`, error)
          resolve(false)
        }
      })
      .on('error', (error) => {
        console.error(`❌ Error en descarga:`, error)
        resolve(false)
      })
  })
}

/**
 * Genera nombre de archivo usando código de producto
 * Formato: imagen_{numero}.jpg
 */
function generateFilename(index: number): string {
  return `imagen_${index}.jpg`
}

/**
 * Migra productos de Cloudinary a almacenamiento local
 */
async function migrateProducts() {
  console.log('🔄 Iniciando migración de imágenes...\n')

  try {
    // Garantizar que existe el directorio base
    await fs.mkdir(UPLOAD_BASE_DIR, { recursive: true })
    console.log(`📁 Directorio base: ${UPLOAD_BASE_DIR}\n`)

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

        console.log(`📦 Producto: ${producto.nombre} (Código: ${producto.codigo}) - ${imagenesList.length} imágenes`)

        // Crear directorio para este producto
        const productDir = path.join(UPLOAD_BASE_DIR, producto.codigo)
        await fs.mkdir(productDir, { recursive: true })

        // Descargar y migrar cada imagen
        for (let i = 0; i < imagenesList.length; i++) {
          const oldImage = imagenesList[i]
          const cloudinaryUrl = oldImage.url

          // Saltar si ya es URL local
          if (cloudinaryUrl.startsWith('/uploads/')) {
            console.log(`  ⏭️  Ya es local: ${oldImage.nombreArchivo}`)
            continue
          }

          const newFilename = generateFilename(i)
          const filePath = path.join(productDir, newFilename)
          
          console.log(`  ⬇️  Descargando imagen ${i + 1}/${imagenesList.length}...`)

          const success = await downloadImage(cloudinaryUrl, filePath)

          if (success) {
            // Actualizar la URL en memoria
            const newUrl = `/uploads/productos/${producto.codigo}/${newFilename}`
            imagenesList[i].url = newUrl
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

        console.log(`  ✅ Actualizado en BD\n`)
      } catch (error) {
        console.error(`  ❌ Error procesando producto ${producto.id}:`, error)
        errorCount++
      }
    }

    console.log(`\n${'='.repeat(60)}`)
    console.log(`\n✅ MIGRACIÓN COMPLETADA`)
    console.log(`   - Imágenes migradas: ${migratedCount}`)
    console.log(`   - Errores: ${errorCount}`)
    console.log(`   - Almacenamiento: ${UPLOAD_BASE_DIR}`)
    console.log(`   - Estructura: /uploads/productos/{CODIGO}/imagen_{numero}.jpg\n`)
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
