import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

interface ImagenData {
  url: string
  nombreArchivo: string
  orden: number
  creadoEn: string
}

/**
 * GET /api/migrate/products-to-migrate
 * Obtiene productos con imágenes de Cloudinary (PÚBLICO para página de migración)
 * No requiere autenticación
 */
export async function GET() {
  try {
    // Obtener todos los productos con imágenes
    const productos = await prisma.producto.findMany({
      where: {
        imagenes: {
          not: null,
        },
      },
      select: {
        id: true,
        codigo: true,
        nombre: true,
        imagenes: true,
      },
    })

    // Filtrar solo los que tienen imágenes de Cloudinary
    const productosConCloudinary = productos.filter((p) => {
      try {
        const imagenes = JSON.parse((p.imagenes as string) || '[]') as ImagenData[]
        return (
          Array.isArray(imagenes) &&
          imagenes.length > 0 &&
          imagenes[0].url &&
          imagenes[0].url.startsWith('https://res.cloudinary.com')
        )
      } catch {
        return false
      }
    })

    return NextResponse.json(
      {
        total: productosConCloudinary.length,
        productos: productosConCloudinary,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('❌ Error en /api/migrate/products-to-migrate:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    )
  }
}
