import { NextResponse, NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import https from 'https'
import fs from 'fs/promises'
import path from 'path'

/**
 * Descarga una imagen desde Cloudinary al VPS
 */
async function downloadImageFromCloudinary(url: string, filePath: string): Promise<boolean> {
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
            const imageBuffer = Buffer.concat(chunks)
            await fs.writeFile(filePath, imageBuffer)
            resolve(true)
          })
        } catch (error) {
          console.error(`❌ Error guardando imagen:`, error)
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
 * POST /api/migrate/complete
 * Migra TODAS las imágenes de Cloudinary
 */
export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now()
    let migratedCount = 0
    let errors = 0

    console.log('🔄 Iniciando migración completa...')

    // Obtener todos los productos con imágenes
    const productos = await prisma.producto.findMany({
      where: {
        imagenes: {
          not: null,
        },
      },
    })

    console.log(`📊 Total de productos: ${productos.length}`)

    for (const producto of productos) {
      try {
        const imagenesList = JSON.parse((producto.imagenes as string) || '[]')

        if (!Array.isArray(imagenesList) || imagenesList.length === 0) {
          continue
        }

        // Crear directorio para este producto
        const productDir = path.join(
          process.cwd(),
          'public',
          'uploads',
          'productos',
          producto.codigo
        )
        await fs.mkdir(productDir, { recursive: true })

        // Descargar y migrar cada imagen
        for (let i = 0; i < imagenesList.length; i++) {
          const oldImage = imagenesList[i]
          const cloudinaryUrl = oldImage.url

          // Saltar si ya es URL local
          if (cloudinaryUrl.startsWith('/uploads/')) {
            continue
          }

          const filename = `imagen_${i}.jpg`
          const filePath = path.join(productDir, filename)

          const success = await downloadImageFromCloudinary(cloudinaryUrl, filePath)

          if (success) {
            const newUrl = `/uploads/productos/${producto.codigo}/${filename}`
            imagenesList[i].url = newUrl
            imagenesList[i].nombreArchivo = filename
            migratedCount++
          } else {
            errors++
          }
        }

        // Actualizar BD con nuevas URLs
        await prisma.producto.update({
          where: { id: producto.id },
          data: {
            imagenes: JSON.stringify(imagenesList),
          },
        })

        console.log(`✅ ${producto.codigo}: ${imagenesList.length} imágenes procesadas`)
      } catch (error) {
        console.error(`❌ Error procesando producto ${producto.id}:`, error)
        errors++
      }
    }

    const duration = Date.now() - startTime

    console.log(`\n✅ MIGRACIÓN COMPLETA FINALIZADA`)
    console.log(`   - Imágenes migradas: ${migratedCount}`)
    console.log(`   - Errores: ${errors}`)
    console.log(`   - Tiempo: ${duration}ms`)

    return NextResponse.json(
      {
        success: true,
        message: 'Migración completa finalizada',
        migratedCount,
        errors,
        duration,
        productosProcessados: productos.length,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('❌ Error en migración completa:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    )
  }
}
