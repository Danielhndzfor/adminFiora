import type { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const roles = await prisma.rolCatalogo.findMany({
      orderBy: { nombre: 'asc' },
    })
    return Response.json({ data: roles, count: roles.length })
  } catch (error) {
    console.error('Error fetching roles:', error)
    return Response.json(
      { error: 'Error al obtener roles', details: (error as any).message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nombre, descripcion, permisos } = body

    if (!nombre) {
      return Response.json({ error: 'El nombre es requerido' }, { status: 400 })
    }

    const rol = await prisma.rolCatalogo.create({
      data: {
        nombre,
        descripcion,
        permisos,
      },
    })

    return Response.json({ data: rol }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating role:', error)
    if (error.code === 'P2002') {
      return Response.json(
        { error: 'Ya existe un rol con ese nombre' },
        { status: 409 }
      )
    }
    return Response.json(
      { error: 'Error al crear rol', details: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, nombre, descripcion, permisos, activo } = body

    if (!id) {
      return Response.json({ error: 'El ID es requerido' }, { status: 400 })
    }

    const rol = await prisma.rolCatalogo.update({
      where: { id },
      data: {
        nombre,
        descripcion,
        permisos,
        activo,
      },
    })

    return Response.json({ data: rol })
  } catch (error: any) {
    console.error('Error updating role:', error)
    if (error.code === 'P2025') {
      return Response.json({ error: 'Rol no encontrado' }, { status: 404 })
    }
    if (error.code === 'P2002') {
      return Response.json(
        { error: 'Ya existe un rol con ese nombre' },
        { status: 409 }
      )
    }
    return Response.json(
      { error: 'Error al actualizar rol', details: error.message },
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

    await prisma.rolCatalogo.delete({
      where: { id: parseInt(id) },
    })

    return Response.json({ data: null })
  } catch (error: any) {
    console.error('Error deleting role:', error)
    if (error.code === 'P2025') {
      return Response.json({ error: 'Rol no encontrado' }, { status: 404 })
    }
    if (error.code === 'P2014') {
      return Response.json(
        { error: 'No se puede eliminar, hay usuarios asociados' },
        { status: 409 }
      )
    }
    return Response.json(
      { error: 'Error al eliminar rol', details: error.message },
      { status: 500 }
    )
  }
}
