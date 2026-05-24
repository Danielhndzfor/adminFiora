import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getCorsHeaders } from "@/lib/cors-utils";
import { parseImagenesJSON } from "@/lib/image-handler-client";

/**
 * GET /api/products/public/related/{id}?limit=4
 * 
 * Obtiene productos relacionados/similares basados en palabras clave compartidas
 * Primero busca por palabras clave iguales, luego por categoría como fallback
 * 
 * Path Parameters:
 * - id: ID del producto de referencia
 * 
 * Query Parameters:
 * - limit: cantidad de productos a retornar (default: 4, max: 20)
 * 
 * Response:
 * {
 *   productos: Product[],
 *   total: number,
 *   limit: number
 * }
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id, 10);
    const limit = Math.min(20, Math.max(1, parseInt(req.nextUrl.searchParams.get("limit") || "4", 10)));

    if (isNaN(productId)) {
      return NextResponse.json(
        { error: "ID de producto inválido" },
        { status: 400, headers: getCorsHeaders("short") }
      );
    }

    // Obtener el producto para conocer sus palabras clave y categoría
    const producto = await prisma.producto.findUnique({
      where: { id: productId },
      select: {
        id: true,
        categoriaId: true,
        palabrasClave: true,
        activo: true,
      },
    });

    if (!producto || !producto.activo) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404, headers: getCorsHeaders("short") }
      );
    }

    // Construir condiciones de búsqueda
    let whereClause: any = {
      id: { not: productId },
      activo: true,
      categoria: {
        activo: true,
      },
    };

    // Si el producto tiene palabras clave, buscar productos con las mismas
    if (producto.palabrasClave && producto.palabrasClave.trim()) {
      whereClause.palabrasClave = {
        contains: producto.palabrasClave,
      };
    } else {
      // Si no tiene palabras clave, usar categoría como fallback
      whereClause.categoriaId = producto.categoriaId;
    }

    // Obtener total de productos relacionados
    const total = await prisma.producto.count({
      where: whereClause,
    });

    // Obtener productos relacionados
    const productos = await prisma.producto.findMany({
      where: whereClause,
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
        categoriaId: true,
        categoria: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
      orderBy: { creadoEn: "desc" },
      take: limit,
    });

    return NextResponse.json(
      {
        productos: productos.map((p) => {
          const imagenesArray = parseImagenesJSON(p.imagenes as string);
          return {
            id: p.id,
            codigo: p.codigo,
            nombre: p.nombre,
            descripcion: p.descripcion,
            precio: p.precio,
            costo: p.costo,
            imagen: imagenesArray[0]?.url || "/products/default.jpg",
            imagenes: JSON.stringify(imagenesArray),
            stock: p.stock,
            disponible: p.stock > 0,
            palabrasClave: p.palabrasClave,
            categoriaId: p.categoriaId,
            categoria: p.categoria,
          };
        }),
        total,
        limit,
      },
      {
        headers: getCorsHeaders("short"),
      }
    );
  } catch (error) {
    console.error("Error fetching related products:", error);
    return NextResponse.json(
      { error: "Error fetching related products" },
      { status: 500, headers: getCorsHeaders() }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json(null, {
    headers: getCorsHeaders(),
  });
}
