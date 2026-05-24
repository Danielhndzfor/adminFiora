import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { uploadToFTP, deleteFromFTP } from '@/lib/ftp-service'
import { optimizeImage, isValidImageType } from '@/lib/image-optimizer'
import { parseImagenesJSON } from '@/lib/image-handler-client'

const MAX_IMAGES = 5

function base64ToBuffer(base64: string): { buffer: Buffer; mimeType: string } {
  const matches = base64.match(/^data:(image\/\w+);base64,(.+)$/)
  if (!matches) throw new Error('Formato base64 inválido')
  return {
    buffer: Buffer.from(matches[2], 'base64'),
    mimeType: matches[1],
  }
}

/** POST /api/upload
 * Body: { productoId: number, imagenBase64: string }
 * Sube una imagen al VPS y la añade al array del producto (máx 5)
 */
export async function POST(request: Request) {
  try {
    const { productoId, imagenBase64 } = await request.json()

    if (!productoId || !imagenBase64) {
      return NextResponse.json({ error: 'productoId e imagenBase64 son requeridos' }, { status: 400 })
    }

    const producto = await prisma.producto.findUnique({ where: { id: productoId } })
    if (!producto) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    }

    const imagenesActuales = parseImagenesJSON((producto as any).imagenes)
    if (imagenesActuales.length >= MAX_IMAGES) {
      return NextResponse.json({ error: `Máximo ${MAX_IMAGES} imágenes por producto` }, { status: 400 })
    }

    const { buffer, mimeType } = base64ToBuffer(imagenBase64)
    if (!isValidImageType(mimeType)) {
      return NextResponse.json({ error: 'Tipo de imagen no soportado' }, { status: 400 })
    }

    const optimized = await optimizeImage(buffer)
    const timestamp = Date.now()
    const remotePath = `${producto.codigo}/${timestamp}.webp`
    const imageUrl = await uploadToFTP(remotePath, optimized.buffer)

    const imagenesNuevas = [
      ...imagenesActuales,
      {
        url: imageUrl,
        nombreArchivo: `${timestamp}.webp`,
        orden: imagenesActuales.length + 1,
        creadoEn: new Date().toISOString(),
      },
    ]

    await prisma.producto.update({
      where: { id: productoId },
      data: { imagenes: JSON.stringify(imagenesNuevas) } as any,
    })

    return NextResponse.json({
      success: true,
      imageUrl,
      totalImagenes: imagenesNuevas.length,
      stats: {
        original: `${(optimized.originalSize / 1024).toFixed(1)}KB`,
        optimized: `${(optimized.optimizedSize / 1024).toFixed(1)}KB`,
        ahorro: `${optimized.compressionRatio}%`,
      },
    })
  } catch (err: any) {
    console.error('Error en upload:', err)
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}

/** DELETE /api/upload
 * Body: { productoId: number, imageUrl: string }
 * Elimina una imagen del VPS y del array del producto
 */
export async function DELETE(request: Request) {
  try {
    const { productoId, imageUrl } = await request.json()

    if (!productoId || !imageUrl) {
      return NextResponse.json({ error: 'productoId e imageUrl son requeridos' }, { status: 400 })
    }

    const producto = await prisma.producto.findUnique({ where: { id: productoId } })
    if (!producto) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    }

    // Extraer ruta relativa: https://...mascontrol.app/uploads/products/F00001/123.webp → F00001/123.webp
    const baseUrl = process.env.FTP_BASE_URL || 'https://fiora.mascontrol.app/uploads/products'
    const remotePath = imageUrl.replace(baseUrl + '/', '')

    // Actualizar array en BD
    const imagenesActuales = parseImagenesJSON((producto as any).imagenes)
    
    // 🔒 VALIDACIÓN: No permitir eliminar la última imagen
    if (imagenesActuales.length <= 1) {
      return NextResponse.json(
        { error: 'Debe mantener al menos una imagen. Sube otra antes de eliminar esta.' },
        { status: 400 }
      )
    }

    // Eliminar del VPS
    await deleteFromFTP(remotePath)

    const imagenesNuevas = imagenesActuales
      .filter((img) => img.url !== imageUrl)
      .map((img, idx) => ({ ...img, orden: idx + 1 }))

    await prisma.producto.update({
      where: { id: productoId },
      data: { imagenes: JSON.stringify(imagenesNuevas) } as any,
    })

    return NextResponse.json({ success: true, totalImagenes: imagenesNuevas.length })
  } catch (err: any) {
    console.error('Error en delete imagen:', err)
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}
