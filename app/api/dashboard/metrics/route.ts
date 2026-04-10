import type { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const dateParam = searchParams.get('date')   // YYYY-MM-DD
    const monthParam = searchParams.get('month') // 1-12
    const yearParam = searchParams.get('year')   // YYYY

    let startDate: Date
    let endDate: Date

    if (dateParam) {
      startDate = new Date(`${dateParam}T00:00:00`)
      endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 1)
    } else if (monthParam && yearParam) {
      const month = parseInt(monthParam)
      const year = parseInt(yearParam)
      startDate = new Date(year, month - 1, 1)
      endDate = new Date(year, month, 1)
    } else {
      // Default: today
      startDate = new Date()
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 1)
    }

    const whereActivo = {
      creadoEn: { gte: startDate, lt: endDate },
      idEstatus: 1,
    }

    // 1. Órdenes activas en el periodo
    const ordenes = await prisma.orden.findMany({
      where: whereActivo,
      select: {
        id: true,
        montoTotal: true,
        metodoPagoId: true,
        metodoPago: { select: { nombre: true } },
      },
    })

    const ticketCount = ordenes.length
    const totalRevenue = ordenes.reduce((sum: number, o: any) => sum + Number(o.montoTotal), 0)
    const avgTicket = ticketCount > 0 ? totalRevenue / ticketCount : 0
    const maxTicket = ordenes.reduce((max: number, o: any) => Math.max(max, Number(o.montoTotal)), 0)

    // 2. Agrupar por método de pago (por nombre y por ID)
    const salesByPayment: Record<string, number> = {}
    const salesByPaymentId: Record<number, number> = {}
    for (const o of ordenes) {
      const method = (o.metodoPago.nombre as string).toLowerCase()
      salesByPayment[method] = (salesByPayment[method] ?? 0) + Number(o.montoTotal)
      
      const paymentId = o.metodoPagoId
      salesByPaymentId[paymentId] = (salesByPaymentId[paymentId] ?? 0) + Number(o.montoTotal)
    }

    // 3. Top 5 productos más vendidos DEL MES ACTUAL (siempre, incluso en vista Hoy)
    const today = new Date()
    const monthStartDate = new Date(today.getFullYear(), today.getMonth(), 1)
    const monthEndDate = new Date(today.getFullYear(), today.getMonth() + 1, 1)
    
    const whereMonth = {
      creadoEn: { gte: monthStartDate, lt: monthEndDate },
      idEstatus: 1,
    }

    const itemsMonth = await prisma.itemOrden.findMany({
      where: { orden: whereMonth },
      select: {
        cantidad: true,
        producto: { select: { nombre: true } },
      },
    })

    const productCountMonth: Record<string, number> = {}
    for (const item of itemsMonth) {
      const name = item.producto.nombre
      productCountMonth[name] = (productCountMonth[name] ?? 0) + item.cantidad
    }

    const topProducts = Object.entries(productCountMonth)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // 4. Productos con stock bajo
    const lowStockProducts = await prisma.producto.findMany({
      where: { activo: true, stock: { lte: 3 } },
      select: { id: true, nombre: true, stock: true },
      orderBy: { stock: 'asc' },
      take: 5,
    })

    return Response.json({
      totalRevenue,
      ticketCount,
      avgTicket,
      maxTicket,
      salesByPayment,
      salesByPaymentId,
      topProducts,
      lowStockProducts,
    })
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error)
    return Response.json(
      { error: 'Error al obtener métricas', details: (error as any).message },
      { status: 500 }
    )
  }
}

