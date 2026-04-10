import type { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const estatus = await prisma.estatusCatalogo.findMany({
      orderBy: { nombre: 'asc' },
    })
    return Response.json({ data: estatus, count: estatus.length })
  } catch (error) {
    console.error('Error fetching estatus:', error)
    return Response.json(
      { error: 'Error al obtener estatus', details: (error as any).message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nombre, descripcion } = body

    if (!nombre) {
      return Response.json({ error: 'El nombre es requerido' }, { status: 400 })
    }

    const estatus = await prisma.estatusCatalogo.create({
      data: {
        nombre,
        descripcion,
      },
    })

    return Response.json({ data: estatus }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating estatus:', error)
    if (error.code === 'P2002') {
      return Response.json(
        { error: 'Ya existe un estatus con ese nombre' },
        { status: 409 }
      )
    }
    return Response.json(
      { error: 'Error al crear estatus', details: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, nombre, descripcion, activo } = body

    if (!id) {
      return Response.json({ error: 'El ID es requerido' }, { status: 400 })
    }

    const estatus = await prisma.estatusCatalogo.update({
      where: { id },
      data: {
        nombre,
        descripcion,
        activo,
      },
    })

    return Response.json({ data: estatus })
  } catch (error: any) {
    console.error('Error updating estatus:', error)
    if (error.code === 'P2025') {
      return Response.json({ error: 'Estatus no encontrado' }, { status: 404 })
    }
    if (error.code === 'P2002') {
      return Response.json(
        { error: 'Ya existe un estatus con ese nombre' },
        { status: 409 }
      )
    }
    return Response.json(
      { error: 'Error al actualizar estatus', details: error.message },
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

    await prisma.estatusCatalogo.delete({
      where: { id: parseInt(id) },
    })

    return Response.json({ data: null })
  } catch (error: any) {
    console.error('Error deleting estatus:', error)
    if (error.code === 'P2025') {
      return Response.json({ error: 'Estatus no encontrado' }, { status: 404 })
    }
    if (error.code === 'P2014') {
      return Response.json(
        { error: 'No se puede eliminar, hay órdenes asociadas' },
        { status: 409 }
      )
    }
    return Response.json(
      { error: 'Error al eliminar estatus', details: error.message },
      { status: 500 }
    )
  }
}
