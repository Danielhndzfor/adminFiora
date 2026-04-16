import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const palabra = params.get("palabra")?.trim() || "";
    const categoriaId = params.get("categoriaId");
    const stockFiltro = params.get("stockFiltro"); // 'bajo' o 'cero'

    // Build where clause
    const where: any = {
      activo: true,
    };

    if (palabra) {
      where.OR = [
        { nombre: { contains: palabra, mode: "insensitive" } },
        { descripcion: { contains: palabra, mode: "insensitive" } },
        { palabrasClave: { contains: palabra, mode: "insensitive" } },
      ];
    }

    if (categoriaId) {
      where.categoriaId = parseInt(categoriaId, 10);
    }

    if (stockFiltro === "bajo") {
      where.stock = { lte: 3, gt: 0 };
    } else if (stockFiltro === "cero") {
      where.stock = 0;
    }

    // Get count and total stock
    const productos = await prisma.producto.findMany({
      where,
      select: {
        stock: true,
      },
    });

    const totalArticulos = productos.length;
    const totalStock = productos.reduce((sum: number, p: { stock: number }) => sum + p.stock, 0);

    return NextResponse.json({
      totalArticulos,
      totalStock,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Error fetching stats" },
      { status: 500 }
    );
  }
}
