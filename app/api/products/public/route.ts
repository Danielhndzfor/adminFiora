import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getCorsHeaders } from "@/lib/cors-utils";
import { parseImagenesJSON } from '@/lib/image-handler-client'

/**
 * GET /api/products/public
 * 
 * Endpoint público para obtener productos (sin requerir autenticación)
 * Usado en página web pública, catálogo, etc.
 * 
 * Query Parameters:
 * - page: número de página (default: 1)
 * - limit: cantidad por página (default: 12, max: 50)
 * - categoriaId: filtrar por categoría (opcional)
 * - palabra: búsqueda por nombre/descripción/palabrasClaves (opcional)
 * 
 * Response:
 * {
 *   productos: Product[],
 *   total: number,
 *   page: number,
 *   limit: number,
 *   totalPages: number,
 *   hasMore: boolean
 * }
 */
export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const page = Math.max(1, parseInt(params.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(params.get("limit") || "12", 10)));
    const categoriaId = params.get("categoriaId");
    const palabra = params.get("palabra")?.trim() || "";

    // Build where clause - solo productos activos
    const where: any = {
      activo: true,
      categoria: {
        activo: true, // Solo categorías activas
      },
    };

    if (palabra) {
      where.OR = [
        { nombre: { contains: palabra } },
        { descripcion: { contains: palabra } },
        { palabrasClave: { contains: palabra } },
      ];
    }

    if (categoriaId) {
      where.categoriaId = parseInt(categoriaId, 10);
    }

    // Get total count for pagination
    const total = await prisma.producto.count({ where });

    // Get paginated products
    const productos = await prisma.producto.findMany({
      where,
      select: {
        id: true,
        codigo: true,
        nombre: true,
        descripcion: true,
        precio: true,
        costo: true,
        imagenes: true,
        stock: true,
        palabrasClave: true,
        activo: true,
        categoriaId: true,
        categoria: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
      orderBy: { nombre: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);
    const hasMore = page < totalPages;

    // Format response
    return NextResponse.json(
      {
          productos: productos.map((p: any) => {
          const imagenesArray = parseImagenesJSON(p.imagenes as string)
          return {
            id: p.id,
            codigo: p.codigo,
            nombre: p.nombre,
            descripcion: p.descripcion,
            precio: p.precio,
            costo: p.costo,
            imagen: imagenesArray[0]?.url || '/products/default.jpg',
            imagenes: JSON.stringify(imagenesArray),
            stock: p.stock,
            disponible: p.stock > 0,
            palabrasClave: p.palabrasClave,
            activo: p.activo,
            categoriaId: p.categoriaId,
            categoria: p.categoria,
          }
        }),
        total,
        page,
        limit,
        totalPages,
        hasMore,
      },
      {
        headers: getCorsHeaders("short"),
      }
    );
  } catch (error) {
    console.error("Error fetching public products:", error);
    return NextResponse.json(
      { error: "Error fetching products" },
      { status: 500, headers: getCorsHeaders() }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json(null, {
    headers: getCorsHeaders(),
  })
}
