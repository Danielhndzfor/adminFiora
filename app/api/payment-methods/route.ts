import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET todos los métodos de pago activos
export async function GET() {
  try {
    const metodosPago = await prisma.metodoPagoCatalogo.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
    })

    return NextResponse.json(metodosPago)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// POST crear método de pago (admin only)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { nombre, descripcion } = body

    if (!nombre) {
      return NextResponse.json({ error: 'nombre es requerido' }, { status: 400 })
    }

    // Verificar que no existe
    const existente = await prisma.metodoPagoCatalogo.findUnique({
      where: { nombre },
    })

    if (existente) {
      return NextResponse.json(
        { error: 'Método de pago ya existe' },
        { status: 409 }
      )
    }

    const metodoPago = await prisma.metodoPagoCatalogo.create({
      data: {
        nombre,
        descripcion: descripcion || undefined,
      },
    })

    return NextResponse.json(metodoPago, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
