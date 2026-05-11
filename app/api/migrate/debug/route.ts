import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * GET /api/migrate/debug
 * Muestra información de debug sobre las imágenes del primer producto
 */
export async function GET() {
  try {
    // Obtener el primer producto con imágenes
    const producto = await prisma.producto.findFirst({
      where: {
        imagenes: {
          not: null,
        },
      },
    })

    if (!producto) {
      return NextResponse.json(
        { error: 'No hay productos con imágenes' },
        { status: 404 }
      )
    }

    // Parsear el JSON
    let imagenesParsed: any = []
    try {
      imagenesParsed = JSON.parse((producto.imagenes as string) || '[]')
    } catch (e) {
      imagenesParsed = { error: 'Error parseando JSON', raw: producto.imagenes }
    }

    return NextResponse.json(
      {
        producto: {
          id: producto.id,
          codigo: producto.codigo,
          nombre: producto.nombre,
          imagenes_raw: producto.imagenes,
          imagenes_parsed: imagenesParsed,
          imagenes_length: Array.isArray(imagenesParsed) ? imagenesParsed.length : 'N/A',
          imagenes_type: typeof imagenesParsed,
          primera_imagen_url: Array.isArray(imagenesParsed) ? imagenesParsed[0]?.url : null,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    )
  }
}
