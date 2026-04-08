import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { uploadImageFromBase64, deleteImageFromCloudinary } from '@/lib/cloudinary'

// GET obtener producto específico
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

    return NextResponse.json(producto)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// PUT actualizar producto
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const productoId = parseInt(id)
    const body = await request.json()
    const { nombre, descripcion, palabrasClave, precio, costo, stock, activo, imagenBase64 } = body

    // Obtener producto actual para verificar si hay imagen anterior
    const productoActual = await prisma.producto.findUnique({
      where: { id: productoId },
    })

    if (!productoActual) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    }

    let urlImagen = undefined
    let publicIdImagen = undefined

    // Si hay una nueva imagen, eliminar la anterior de Cloudinary
    if (imagenBase64) {
      // Eliminar imagen anterior si existe
      if (productoActual.publicIdImagen) {
        await deleteImageFromCloudinary(productoActual.publicIdImagen)
      }

      // Subir nueva imagen
      const resultado = await uploadImageFromBase64(imagenBase64, {
        folder: 'fiora/productos',
      })
      urlImagen = resultado.secure_url
      publicIdImagen = resultado.public_id
    }

    const producto = await prisma.producto.update({
      where: { id: productoId },
      data: {
        ...(nombre && { nombre }),
        ...(descripcion !== undefined && { descripcion }),
        ...(palabrasClave !== undefined && { palabrasClave }),
        ...(precio !== undefined && { precio: parseFloat(precio) }),
        ...(costo !== undefined && { costo: parseFloat(costo) }),
        ...(stock !== undefined && { stock: parseInt(stock) }),
        ...(activo !== undefined && { activo }),
        ...(urlImagen && { imagen: urlImagen }),
        ...(publicIdImagen && { publicIdImagen }),
      },
      include: { categoria: true },
    })

    return NextResponse.json(producto)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// DELETE lógico (soft delete) - Elimina imagen de Cloudinary también
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const productoId = parseInt(id)

    // Obtener producto para eliminar su imagen
    const producto = await prisma.producto.findUnique({
      where: { id: productoId },
    })

    if (producto?.publicIdImagen) {
      await deleteImageFromCloudinary(producto.publicIdImagen)
    }

    // Soft delete de la BD
    const productoActualizado = await prisma.producto.update({
      where: { id: productoId },
      data: { activo: false },
    })

    return NextResponse.json({ mensaje: 'Producto desactivado', producto: productoActualizado })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
