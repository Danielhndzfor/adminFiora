import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { parseImagenesJSON } from '@/lib/image-handler'
import { verificarTokenJWT } from '@/lib/seguridad'

/**
 * Valida autenticación del request
 */
function validarAutenticacion(request: Request): { valid: boolean; usuarioId?: number; error?: string } {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (!token) {
    return { valid: false, error: 'Token no proporcionado' }
  }

  const decoded = verificarTokenJWT(token)
  if (!decoded) {
    return { valid: false, error: 'Token inválido o expirado' }
  }

  return { valid: true, usuarioId: decoded.usuarioId }
}

// GET obtener producto específico (sin autenticación - usa /api/products/public para clientes)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const productoId = parseInt(id)

    const producto = await prisma.producto.findUnique({
      where: { id: productoId },
      include: { categoria: true },
    })

    if (!producto) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    }

    // Parsear imágenes JSON
    return NextResponse.json({
      ...producto,
      imagenesArray: parseImagenesJSON((producto as any).imagenes),
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// PUT actualizar producto (requiere autenticación)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Validar autenticación
  const auth = validarAutenticacion(request)
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }

  try {
    const { id } = await params
    const productoId = parseInt(id)
    const body = await request.json()
    const {
      nombre,
      descripcion,
      palabrasClave,
      precio,
      costo,
      stock,
      activo,
      imagenBase64,
      imagenes, // Array de imágenes completo (para reorden/eliminación)
    } = body

    // Obtener producto actual
    const productoActual = await prisma.producto.findUnique({
      where: { id: productoId },
    })

    if (!productoActual) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    }

    let imagenesActualizadas = (productoActual as any).imagenes

    // Si hay nueva imagen base64, procesarla
    if (imagenBase64) {
      const sanitized = (productoActual.codigo || 'img')
        .replace(/[^a-zA-Z0-9-_]/g, '_')
        .toLowerCase()
        .slice(0, 50)

      // Obtener extensión del base64
      const matches = imagenBase64.match(/data:image\/(\w+);base64/)
      const ext = matches ? matches[1].toLowerCase() : 'jpg'

      // Generar nombre
      const imagenesActuales = parseImagenesJSON((productoActual as any).imagenes)
      const nuevoOrden = imagenesActuales.length + 1

      if (nuevoOrden > 5) {
        return NextResponse.json(
          { error: 'Máximo 5 imágenes por producto' },
          { status: 400 }
        )
      }

      const filename = `${sanitized}_${nuevoOrden}.${ext}`
      const newImageUrl = `https://sad-diffie.198-251-78-127.plesk.page/fioraImages/${filename}`

      // Agregr a array
      imagenesActuales.push({
        url: newImageUrl,
        nombreArchivo: filename,
        orden: nuevoOrden,
        creadoEn: new Date().toISOString(),
      })

      imagenesActualizadas = JSON.stringify(imagenesActuales)
    }

    // Si se proporciona array completo (reorden/eliminación)
    if (imagenes && Array.isArray(imagenes)) {
      imagenesActualizadas = JSON.stringify(imagenes)
    }

    // Construir objeto data como any para evitar errores de tipos del cliente Prisma
    const updateData: any = {
      ...(nombre && { nombre }),
      ...(descripcion !== undefined && { descripcion }),
      ...(palabrasClave !== undefined && { palabrasClave }),
      ...(precio !== undefined && { precio: parseFloat(precio) }),
      ...(costo !== undefined && { costo: parseFloat(costo) }),
      ...(stock !== undefined && { stock: parseInt(stock) }),
      ...(activo !== undefined && { activo }),
    }

    if (imagenesActualizadas) {
      updateData.imagenes = imagenesActualizadas
    }

    const producto = await prisma.producto.update({
      where: { id: productoId },
      data: updateData,
      include: { categoria: true },
    })

    return NextResponse.json({
      ...producto,
      imagenesArray: parseImagenesJSON((producto as any).imagenes),
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// DELETE imagen específica del array (soft delete) - requiere autenticación
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Validar autenticación
  const auth = validarAutenticacion(request)
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }

  try {
    const { id } = await params
    const productoId = parseInt(id)
    const { orden } = await request.json() // orden de la imagen a eliminar

    const producto = await prisma.producto.findUnique({
      where: { id: productoId },
    })

    if (!producto) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    }

    if (!orden) {
      // Si no hay orden específico, hacer soft delete del producto
      const actualizado = await prisma.producto.update({
        where: { id: productoId },
        data: { activo: false },
      })
      return NextResponse.json({ mensaje: 'Producto desactivado', producto: actualizado })
    }

    // Eliminar imagen específica del array
    const imagenesActuales = parseImagenesJSON((producto as any).imagenes)
    const imagenesFiltradas = imagenesActuales.filter(img => img.orden !== orden)

    const actualizado = await prisma.producto.update({
      where: { id: productoId },
      data: { imagenes: JSON.stringify(imagenesFiltradas) } as any,
    })

    return NextResponse.json({
      mensaje: 'Imagen eliminada',
      producto: actualizado,
      imagenesArray: parseImagenesJSON((actualizado as any).imagenes),
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
