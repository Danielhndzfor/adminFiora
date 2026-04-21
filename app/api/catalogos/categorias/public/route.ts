import prisma from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

/**
 * GET /api/catalogos/categorias/public
 * 
 * Endpoint público para obtener categorías activas (sin requerir autenticación)
 * Usado en página web pública, catálogo, selector de productos, etc.
 * 
 * Query Parameters:
 * - palabra: búsqueda por nombre/descripción (opcional)
 * 
 * Response:
 * [
 *   {
 *     id: number,
 *     nombre: string,
 *     descripcion?: string,
 *     imagen?: string,
 *     activo: boolean,
 *     creadoEn: Date,
 *     actualizadoEn: Date
 *   }
 * ]
 */
export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams
    const palabra = params.get("palabra")?.trim() || ""

    // Build where clause - solo categorías activas
    const where: any = {
      activo: true,
    }

    if (palabra) {
      where.OR = [
        { nombre: { contains: palabra, mode: "insensitive" } },
        { descripcion: { contains: palabra, mode: "insensitive" } },
      ]
    }

    const categorias = await prisma.categoriaCatalogo.findMany({
      where,
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        imagen: true,
        activo: true,
        creadoEn: true,
        actualizadoEn: true,
      },
      orderBy: { nombre: "asc" },
    })

    return NextResponse.json(categorias, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    })
  } catch (error) {
    console.error("Error fetching public categorías:", error)
    return NextResponse.json(
      { error: "Error al obtener categorías" },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return NextResponse.json(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}
