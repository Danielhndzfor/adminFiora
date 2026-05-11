import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { parseImagenesJSON } from '@/lib/image-handler'

const SERVER_BASE_URL = 'https://fiora.mascontrol.app/fioraImages'

/**
 * Convierte base64 a buffer y obtiene extensión
 */
const base64ToBuffer = (base64: string): { buffer: Buffer; ext: string } => {
  // Formato esperado: data:image/png;base64,...
  const matches = base64.match(/data:image\/(\w+);base64,(.+)/)
  if (!matches) throw new Error('Formato base64 inválido')

  const [, mimeType, data] = matches
  const ext = mimeType.toLowerCase()
  const buffer = Buffer.from(data, 'base64')
  return { buffer, ext }
}

/**
 * Genera nombre de archivo único
 */
const generateFilename = (codigoProducto: string, orden: number, ext: string): string => {
  const sanitized = codigoProducto.replace(/[^a-zA-Z0-9-_]/g, '_').toLowerCase().slice(0, 50)
  return `${sanitized}_${orden}.${ext}`
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, imageBase64, productoId } = body

    if (!imageBase64) {
      return NextResponse.json({ error: 'imageBase64 es requerido' }, { status: 400 })
    }

    const { buffer, ext } = base64ToBuffer(imageBase64)

    // Si es un producto nuevo, crear con imagen
    if (!productoId) {
      const codigo = 'IMG-' + Date.now()
      const filename = generateFilename(codigo, 1, ext)

      // Aquí normalmente subirías a SFTP, pero para desarrollo inicial,
      // guardamos la URL como URL temporal/de prueba
      // En producción, implementar upload a SFTP aquí o en endpoint separado

      const imageUrl = `${SERVER_BASE_URL}/${filename}`
      const productImagen = JSON.stringify([
        {
          url: imageUrl,
          nombreArchivo: filename,
          orden: 1,
          creadoEn: new Date().toISOString(),
        },
      ])

      const product = await prisma.producto.create({
        data: {
          codigo,
          nombre: name ?? 'Sin nombre',
          imagenes: productImagen,
          precio: 0,
          categoriaId: 1,
        } as any,
      })

      return NextResponse.json({
        product,
        imageUrl,
        filename,
      })
    }

    // Si es un producto existente, añadir imagen al array
    const producto = await prisma.producto.findUnique({
      where: { id: productoId },
    })

    if (!producto) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    }

    // Generar nombre y URL
    const filename = generateFilename(producto.codigo, 1, ext)
    const imageUrl = `${SERVER_BASE_URL}/${filename}`

    // Aquí subirías el archivo a SFTP en producción
    // Por ahora, solo guardamos la referencia

    const imagenesActuales = parseImagenesJSON((producto as any).imagenes)
    const imagenesNuevas = [
      ...imagenesActuales,
      {
        url: imageUrl,
        nombreArchivo: filename,
        orden: imagenesActuales.length + 1,
        creadoEn: new Date().toISOString(),
      },
    ].slice(0, 5) // Máximo 5

    const productActualizado = await prisma.producto.update({
      where: { id: productoId },
      data: { imagenes: JSON.stringify(imagenesNuevas) } as any,
    })

    return NextResponse.json({
      product: productActualizado,
      imageUrl,
      filename,
      totalImagenes: imagenesNuevas.length,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
