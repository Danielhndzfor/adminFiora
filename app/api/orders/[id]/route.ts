import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// PATCH / PUT actualizar estatus de orden por ID de EstatusCatalogo
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const ordenId = parseInt(id)
    const body = await request.json()
    const { idEstatus } = body

    if (!idEstatus) {
      return NextResponse.json({ error: 'idEstatus es requerido' }, { status: 400 })
    }

    const orden = await prisma.orden.update({
      where: { id: ordenId },
      data: { idEstatus },
      include: {
        estatus: true,
      },
    })

    return NextResponse.json({ data: orden })
  } catch (err: any) {
    if (err.code === 'P2025') {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
    }
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// GET orden específica (detalles completos)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const ordenId = parseInt(id)

    const orden = await prisma.orden.findUnique({
      where: { id: ordenId },
      include: {
        usuario: {
          select: {
            id: true,
            correo: true,
            nombre: true,
            apellido: true,
            direccion: true,
            ciudad: true,
            estado: true,
            codigoPostal: true,
            pais: true,
          },
        },
        metodoPago: true,
        items: {
          include: {
            producto: {
              select: {
                id: true,
                codigo: true,
                nombre: true,
                imagen: true,
              },
            },
          },
        },
      },
    })

    if (!orden) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
    }

    return NextResponse.json(orden)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
