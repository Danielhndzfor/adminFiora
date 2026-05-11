import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { parseImagenesJSON } from '@/lib/image-handler'
import { uploadImageLocal, reorganizeImages } from '@/lib/local-upload'
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
      const imagenesActuales = parseImagenesJSON((productoActual as any).imagenes)
      
      // Si viene con reemplaceIndex, reemplazar esa imagen
      const reemplaceIndex = (body as any).reemplaceIndex ?? -1
      
      if (reemplaceIndex >= 0 && reemplaceIndex < imagenesActuales.length) {
        // Reemplazar imagen existente
        const nuevoIndice = reemplaceIndex
        const resultado = await uploadImageLocal(imagenBase64, productoActual.codigo, nuevoIndice)
        
        imagenesActuales[reemplaceIndex] = {
          url: resultado.url,
          nombreArchivo: resultado.nombreArchivo,
          orden: reemplaceIndex + 1,
          creadoEn: new Date().toISOString(),
        }
      } else {
        // Agregar nueva imagen
        const nuevoIndice = imagenesActuales.length

        if (nuevoIndice >= 5) {
          return NextResponse.json(
            { error: 'Máximo 5 imágenes por producto' },
            { status: 400 }
          )
        }

        const resultado = await uploadImageLocal(imagenBase64, productoActual.codigo, nuevoIndice)

        imagenesActuales.push({
          url: resultado.url,
          nombreArchivo: resultado.nombreArchivo,
          orden: nuevoIndice + 1,
          creadoEn: new Date().toISOString(),
        })
      }

      imagenesActualizadas = JSON.stringify(imagenesActuales)
    }

    // Si se proporciona array completo (reorden/eliminación)
    if (imagenes && Array.isArray(imagenes)) {
      imagenesActualizadas = JSON.stringify(imagenes)
    }

    // Si se pasa deleteImageIndex, eliminar esa imagen y reorganizar
    const deleteImageIndex = (body as any).deleteImageIndex ?? -1
    if (deleteImageIndex >= 0) {
      const imagenesActuales = parseImagenesJSON((productoActual as any).imagenes)
      if (deleteImageIndex < imagenesActuales.length) {
        // Reorganizar archivos en el servidor
        await reorganizeImages(productoActual.codigo, deleteImageIndex)
        
        // Actualizar array de imágenes
        imagenesActuales.splice(deleteImageIndex, 1)
        
        // Actualizar URLs después de reorganizar
        for (let i = deleteImageIndex; i < imagenesActuales.length; i++) {
          imagenesActuales[i].url = `/uploads/productos/${productoActual.codigo}/imagen_${i}.jpg`
          imagenesActuales[i].nombreArchivo = `imagen_${i}.jpg`
          imagenesActuales[i].orden = i + 1
        }
        
        imagenesActualizadas = JSON.stringify(imagenesActuales)
      }
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
    const body = await request.json()
    const { orden } = body

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
      return NextResponse.json({ 
        mensaje: 'Producto desactivado', 
        producto: actualizado 
      })
    }

    // Eliminar imagen específica y reorganizar
    const imagenesActuales = parseImagenesJSON((producto as any).imagenes)
    const indexAEliminar = imagenesActuales.findIndex(img => img.orden === orden)

    if (indexAEliminar < 0) {
      return NextResponse.json(
        { error: 'Imagen no encontrada' },
        { status: 404 }
      )
    }

    // Reorganizar archivos en el sistema de archivos
    const archivosRestantes = await reorganizeImages(producto.codigo, indexAEliminar)
    console.log(`📊 Archivos restantes después de eliminar imagen ${indexAEliminar}:`, archivosRestantes)

    // Actualizar array de imágenes
    imagenesActuales.splice(indexAEliminar, 1)
    
    // Recalcular orden y URLs después de reorganizar
    for (let i = 0; i < imagenesActuales.length; i++) {
      imagenesActuales[i].url = `/uploads/productos/${producto.codigo}/imagen_${i}.jpg`
      imagenesActuales[i].nombreArchivo = `imagen_${i}.jpg`
      imagenesActuales[i].orden = i + 1
    }

    const actualizado = await prisma.producto.update({
      where: { id: productoId },
      data: { imagenes: JSON.stringify(imagenesActuales) } as any,
    })

    return NextResponse.json({
      mensaje: 'Imagen eliminada y reorganizada',
      producto: actualizado,
      imagenesArray: parseImagenesJSON((actualizado as any).imagenes),
    })
  } catch (err) {
    console.error('❌ Error en DELETE:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
