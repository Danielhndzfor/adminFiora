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
      //activo: true,
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

    if (stockFiltro === "bajo") {
      where.stock = { lte: 3, gt: 0 };
    } else if (stockFiltro === "cero") {
      where.stock = 0;
    }

    // Get counts by status and total stock
    const productosActivos = await prisma.producto.findMany({
      where: { ...where, activo: true },
      select: { stock: true },
    });

    const productosInactivos = await prisma.producto.findMany({
      where: { ...where, activo: false },
      select: { stock: true },
    });

    const activos = productosActivos.length;
    const inactivos = productosInactivos.length;
    const totalStock = productosActivos.reduce((sum: number, p: { stock: number }) => sum + p.stock, 0);

    return NextResponse.json({
      activos,
      inactivos,
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
