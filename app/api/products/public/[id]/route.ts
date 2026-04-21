import prisma from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { getCorsHeaders } from "@/lib/cors-utils"

/**
 * GET /api/products/public/[id]
 *
 * Obtiene un producto específico por ID (público, sin autenticación)
 *
 * Path Parameters:
 * - id: ID del producto (number)
 *
 * Response:
 * {
 *   id: number,
 *   codigo: string,
 *   nombre: string,
 *   descripcion: string,
 *   precio: number,
 *   costo: number,
 *   imagen: string,
 *   stock: number,
 *   disponible: boolean,
 *   palabrasClave: string,
 *   categoria: { id, nombre },
 *   creadoEn: Date,
 *   actualizadoEn: Date
 * }
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = parseInt(params.id, 10)

    if (isNaN(productId)) {
      return NextResponse.json(
        { error: "ID de producto inválido" },
        { 
          status: 400,
          headers: getCorsHeaders(),
        }
      )
    }

    const producto = await prisma.producto.findUnique({
      where: { id: productId },
      select: {
        id: true,
        codigo: true,
        nombre: true,
        descripcion: true,
        precio: true,
        costo: true,
        imagen: true,
        stock: true,
        palabrasClave: true,
        creadoEn: true,
        actualizadoEn: true,
        categoria: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    })

    if (!producto) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { 
          status: 404,
          headers: getCorsHeaders(),
        }
      )
    }

    // Verificar que el producto esté activo y su categoría también
    const productoActivo = await prisma.producto.findFirst({
      where: {
        id: productId,
        activo: true,
        categoria: {
          activo: true,
        },
      },
    })

    if (!productoActivo) {
      return NextResponse.json(
        { error: "Producto no disponible" },
        { 
          status: 404,
          headers: getCorsHeaders(),
        }
      )
    }

    return NextResponse.json(
      {
        id: producto.id,
        codigo: producto.codigo,
        nombre: producto.nombre,
        descripcion: producto.descripcion,
        precio: producto.precio,
        costo: producto.costo,
        imagen: producto.imagen,
        stock: producto.stock,
        disponible: producto.stock > 0,
        palabrasClave: producto.palabrasClave,
        categoria: producto.categoria,
        creadoEn: producto.creadoEn,
        actualizadoEn: producto.actualizadoEn,
      },
      {
        headers: getCorsHeaders("detail"),
      }
    )
  } catch (error) {
    console.error("Error fetching public product by ID:", error)
    return NextResponse.json(
      { error: "Error al obtener el producto" },
      {
        status: 500,
        headers: getCorsHeaders(),
      }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(),
  })
}
