import { NextResponse, NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import https from 'https'
import fs from 'fs/promises'
import path from 'path'

/**
 * Descarga una imagen desde URL externa al servidor local
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
            console.log(`✓ Imagen descargada: ${filePath}`)
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
 * POST /api/migrate/test
 * Prueba migrar UNA imagen de URL externa y actualizar BD
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productoId } = body

    if (!productoId) {
      return NextResponse.json(
        { error: 'productoId es requerido' },
        { status: 400 }
      )
    }

    // 1. Obtener producto
    const producto = await prisma.producto.findUnique({
      where: { id: productoId },
    })

    if (!producto) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    // 2. Parsear imágenes actuales
    let imagenes = JSON.parse((producto.imagenes as string) || '[]')

    if (!Array.isArray(imagenes) || imagenes.length === 0) {
      return NextResponse.json(
        { error: 'El producto no tiene imágenes' },
        { status: 400 }
      )
    }

    // 3. Tomar la primera imagen
    const primeraImagen = imagenes[0]
    const cloudinaryUrl = primeraImagen.url

    // Verificar si ya es local
    if (cloudinaryUrl.startsWith('/uploads/')) {
      return NextResponse.json(
        { 
          message: 'Esta imagen ya es local',
          producto: {
            id: producto.id,
            codigo: producto.codigo,
            nombre: producto.nombre,
            imagenActual: cloudinaryUrl,
          }
        },
        { status: 200 }
      )
    }

    // 4. Crear directorio para el producto
    const uploadDir = path.join(
      process.cwd(),
      'public',
      'uploads',
      'productos',
      producto.codigo
    )
    await fs.mkdir(uploadDir, { recursive: true })

    // 5. Descargar imagen
    const filename = `imagen_0.jpg`
    const filePath = path.join(uploadDir, filename)
    
    console.log(`📥 Descargando imagen externa...`)
    const success = await downloadImageFromCloudinary(cloudinaryUrl, filePath)

    if (!success) {
      return NextResponse.json(
        { error: 'Error descargando imagen externa' },
        { status: 500 }
      )
    }

    // 6. Actualizar URL en imagen
    const newUrl = `/uploads/productos/${producto.codigo}/${filename}`
    imagenes[0].url = newUrl
    imagenes[0].nombreArchivo = filename

    // 7. Actualizar BD
    const productoActualizado = await prisma.producto.update({
      where: { id: productoId },
      data: {
        imagenes: JSON.stringify(imagenes),
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Imagen migrada exitosamente',
        producto: {
          id: productoActualizado.id,
          codigo: productoActualizado.codigo,
          nombre: productoActualizado.nombre,
          imagenAnterior: cloudinaryUrl,
          imagenNueva: newUrl,
          ubicacion: filePath,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('❌ Error en migración de prueba:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    )
  }
}
