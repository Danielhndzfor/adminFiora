import type { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const metodos = await prisma.metodoPagoCatalogo.findMany({
      orderBy: { nombre: 'asc' },
    })
    return Response.json({ data: metodos, count: metodos.length })
  } catch (error) {
    console.error('Error fetching metodos pago:', error)
    return Response.json(
      { error: 'Error al obtener métodos de pago', details: (error as any).message },
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

    const metodo = await prisma.metodoPagoCatalogo.create({
      data: {
        nombre,
        descripcion,
      },
    })

    return Response.json({ data: metodo }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating metodo pago:', error)
    if (error.code === 'P2002') {
      return Response.json(
        { error: 'Ya existe un método de pago con ese nombre' },
        { status: 409 }
      )
    }
    return Response.json(
      { error: 'Error al crear método de pago', details: error.message },
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

    const metodo = await prisma.metodoPagoCatalogo.update({
      where: { id },
      data: {
        nombre,
        descripcion,
        activo,
      },
    })

    return Response.json({ data: metodo })
  } catch (error: any) {
    console.error('Error updating metodo pago:', error)
    if (error.code === 'P2025') {
      return Response.json({ error: 'Método de pago no encontrado' }, { status: 404 })
    }
    if (error.code === 'P2002') {
      return Response.json(
        { error: 'Ya existe un método de pago con ese nombre' },
        { status: 409 }
      )
    }
    return Response.json(
      { error: 'Error al actualizar método de pago', details: error.message },
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

    await prisma.metodoPagoCatalogo.delete({
      where: { id: parseInt(id) },
    })

    return Response.json({ data: null })
  } catch (error: any) {
    console.error('Error deleting metodo pago:', error)
    if (error.code === 'P2025') {
      return Response.json({ error: 'Método de pago no encontrado' }, { status: 404 })
    }
    if (error.code === 'P2014') {
      return Response.json(
        { error: 'No se puede eliminar, hay órdenes asociadas' },
        { status: 409 }
      )
    }
    return Response.json(
      { error: 'Error al eliminar método de pago', details: error.message },
      { status: 500 }
    )
  }
}
