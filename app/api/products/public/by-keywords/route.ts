import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getCorsHeaders } from "@/lib/cors-utils";
import { parseImagenesJSON } from "@/lib/image-handler-client";

/**
 * GET /api/products/public/by-keywords?keywords=vestido,formal&page=1&limit=12
 * 
 * Busca productos que contengan las palabras clave especificadas
 * 
 * Query Parameters:
 * - keywords: palabras clave separadas por coma (requerido)
 * - page: número de página (default: 1)
 * - limit: cantidad por página (default: 12, max: 50)
 * - matchAll: si true, producto DEBE tener TODAS las palabras clave (default: false = O lógico)
 * - sortBy: campo para ordenar (default: "relevancia", opciones: "relevancia", "nombre", "precio", "creadoEn")
 * - order: dirección de orden (default: "desc" para relevancia, "asc" para otros)
 * 
 * Examples:
 * - /api/products/public/by-keywords?keywords=vestido,formal
 * - /api/products/public/by-keywords?keywords=rojo,elegante&matchAll=true&page=1&limit=20
 * - /api/products/public/by-keywords?keywords=zapatos&sortBy=precio&order=asc
 * 
 * Response:
 * {
 *   productos: Product[],
 *   total: number,
 *   page: number,
 *   limit: number,
 *   totalPages: number,
 *   hasMore: boolean,
 *   keywords: string[]
 * }
 */
export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const keywordsParam = params.get("keywords");

    if (!keywordsParam || !keywordsParam.trim()) {
      return NextResponse.json(
        { error: "El parámetro 'keywords' es requerido" },
        { status: 400, headers: getCorsHeaders("short") }
      );
    }

    // Procesar palabras clave
    const keywords = keywordsParam
      .split(",")
      .map((k) => k.trim().toLowerCase())
      .filter((k) => k.length > 0);

    if (keywords.length === 0) {
      return NextResponse.json(
        { error: "Al menos una palabra clave es requerida" },
        { status: 400, headers: getCorsHeaders("short") }
      );
    }

    // Parámetros de paginación y ordenamiento
    const page = Math.max(1, parseInt(params.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(params.get("limit") || "12", 10)));
    const matchAll = params.get("matchAll") === "true";
    const sortBy = params.get("sortBy") || "relevancia";
    const orderParam = params.get("order");
    const order = orderParam || (sortBy === "relevancia" ? "desc" : "asc");

    // Construir condiciones de búsqueda
    let where: any = {
      activo: true,
      categoria: {
        activo: true,
      },
    };

    // Búsqueda de palabras clave
    if (matchAll) {
      // Todos deben estar presentes (AND lógico)
      where.AND = keywords.map((keyword) => ({
        palabrasClave: {
          contains: keyword,
          mode: "insensitive",
        },
      }));
    } else {
      // Al menos uno debe estar presente (OR lógico)
      where.OR = keywords.map((keyword) => ({
        palabrasClave: {
          contains: keyword,
          mode: "insensitive",
        },
      }));
    }

    // Contar total
    const total = await prisma.producto.count({ where });

    // Construir orderBy dinámico
    const orderByClause: any = {};
    if (sortBy === "relevancia") {
      // Para relevancia, ordenar por creadoEn descendente (más recientes primero)
      orderByClause.creadoEn = order === "asc" ? "asc" : "desc";
    } else if (["nombre", "precio", "creadoEn"].includes(sortBy)) {
      orderByClause[sortBy] = order === "asc" ? "asc" : "desc";
    } else {
      orderByClause.creadoEn = "desc";
    }

    // Obtener productos paginados
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
        categoriaId: true,
        categoria: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
      orderBy: orderByClause,
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);
    const hasMore = page < totalPages;

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
        page,
        limit,
        totalPages,
        hasMore,
        keywords,
        matchAll,
      },
      {
        headers: getCorsHeaders("short"),
      }
    );
  } catch (error) {
    console.error("Error fetching products by keywords:", error);
    return NextResponse.json(
      { error: "Error fetching products" },
      { status: 500, headers: getCorsHeaders() }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json(null, {
    headers: getCorsHeaders(),
  });
}
