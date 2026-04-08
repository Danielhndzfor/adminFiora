import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// PUT actualizar estado de orden
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const ordenId = parseInt(id)
    const body = await request.json()
    const { estatus } = body

    if (!estatus) {
      return NextResponse.json({ error: 'estatus es requerido' }, { status: 400 })
    }

    // Validar estado válido
    const estatusValidos = ['PENDIENTE', 'PAGADA', 'ENVIADA', 'ENTREGADA', 'CANCELADA']
    if (!estatusValidos.includes(estatus)) {
      return NextResponse.json(
        { error: `Estatus debe ser uno de: ${estatusValidos.join(', ')}` },
        { status: 400 }
      )
    }

    const orden = await prisma.orden.update({
      where: { id: ordenId },
      data: { estatus },
      include: {
        items: true,
        metodoPago: true,
      },
    })

    return NextResponse.json(orden)
  } catch (err) {
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
