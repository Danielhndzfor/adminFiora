import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * GET /api/categories
 * Obtiene todas las categorías activas
 */
export async function GET(request: Request) {
  try {
    const categorias = await prisma.categoriaCatalogo.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
    })

    return NextResponse.json(categorias)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
