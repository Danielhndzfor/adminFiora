import type { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const categorias = await prisma.categoriaCatalogo.findMany({
      orderBy: { nombre: 'asc' },
    })
    return Response.json({ data: categorias, count: categorias.length })
  } catch (error) {
    console.error('Error fetching categorias:', error)
    return Response.json(
      { error: 'Error al obtener categorías', details: (error as any).message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nombre, descripcion, imagen } = body

    if (!nombre) {
      return Response.json({ error: 'El nombre es requerido' }, { status: 400 })
    }

    const categoria = await prisma.categoriaCatalogo.create({
      data: {
        nombre,
        descripcion,
        imagen,
      },
    })

    return Response.json({ data: categoria }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating categoria:', error)
    if (error.code === 'P2002') {
      return Response.json(
        { error: 'Ya existe una categoría con ese nombre' },
        { status: 409 }
      )
    }
    return Response.json(
      { error: 'Error al crear categoría', details: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, nombre, descripcion, imagen, activo } = body

    if (!id) {
      return Response.json({ error: 'El ID es requerido' }, { status: 400 })
    }

    // Si se intenta desactivar, validar que no haya productos activos
    if (activo === false) {
      const productosActivos = await prisma.producto.findMany({
        where: {
          categoriaId: id,
          activo: true,
        },
        select: { id: true, nombre: true },
      })

      if (productosActivos.length > 0) {
        return Response.json(
          {
            error: `No se puede desactivar. Hay ${productosActivos.length} producto(s) activo(s) en esta categoría`,
            code: 'ACTIVE_PRODUCTS',
            products: productosActivos,
          },
          { status: 409 }
        )
      }
    }

    const categoria = await prisma.categoriaCatalogo.update({
      where: { id },
      data: {
        nombre,
        descripcion,
        imagen,
        activo,
      },
    })

    return Response.json({ data: categoria })
  } catch (error: any) {
    console.error('Error updating categoria:', error)
    if (error.code === 'P2025') {
      return Response.json({ error: 'Categoría no encontrada' }, { status: 404 })
    }
    if (error.code === 'P2002') {
      return Response.json(
        { error: 'Ya existe una categoría con ese nombre' },
        { status: 409 }
      )
    }
    return Response.json(
      { error: 'Error al actualizar categoría', details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return Response.json({ error: 'El ID es requerido' }, { status: 400 })
    }

    await prisma.categoriaCatalogo.delete({
      where: { id: parseInt(id) },
    })

    return Response.json({ data: null })
  } catch (error: any) {
    console.error('Error deleting categoria:', error)
    if (error.code === 'P2025') {
      return Response.json({ error: 'Categoría no encontrada' }, { status: 404 })
    }
    if (error.code === 'P2014') {
      return Response.json(
        { error: 'No se puede eliminar, hay productos asociados' },
        { status: 409 }
      )
    }
    return Response.json(
      { error: 'Error al eliminar categoría', details: error.message },
      { status: 500 }
    )
  }
}
