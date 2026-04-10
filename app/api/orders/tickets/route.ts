import type { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import type { Orden, ItemOrden, Producto, Usuario } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const dateStr = searchParams.get('date')
    const weekStart = searchParams.get('weekStart')
    const allParam = searchParams.get('all')
    const skipParam = searchParams.get('skip')
    const takeParam = searchParams.get('take')

    // Construir filtro de fecha
    let whereClause: any = {}

    if (dateStr) {
      const targetDate = new Date(dateStr)
      const nextDay = new Date(targetDate)
      nextDay.setDate(nextDay.getDate() + 1)

      whereClause = {
        creadoEn: {
          gte: targetDate,
          lt: nextDay,
        },
      }
    } else if (weekStart) {
      const startDate = new Date(weekStart)
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 7)

      whereClause = {
        creadoEn: {
          gte: startDate,
          lt: endDate,
        },
      }
    } else if (allParam === 'true') {
      // No filter - fetch all orders
      whereClause = {}
    } else {
      // Si no hay filtro específico, mostrar solo de hoy
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const nextDay = new Date(today)
      nextDay.setDate(nextDay.getDate() + 1)

      whereClause = {
        creadoEn: {
          gte: today,
          lt: nextDay,
        },
      }
    }

    // Paginación
    const skip = skipParam ? parseInt(skipParam, 10) : 0
    const take = takeParam ? parseInt(takeParam, 10) : 25

    // Consultar órdenes con relaciones
    const ordenes = await prisma.orden.findMany({
      where: whereClause,
      skip,
      take,
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            correo: true,
          },
        },
        items: {
          include: {
            producto: {
              select: {
                id: true,
                nombre: true,
                codigo: true,
                imagen: true,
                precio: true,
              },
            },
          },
        },
        metodoPago: {
          select: {
            id: true,
            nombre: true,
          },
        },
        estatus: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
      orderBy: {
        creadoEn: 'desc',
      },
    })

    // Transformar a estructura esperada por el frontend
    const tickets = ordenes.map((orden: any) => ({
      ticketId: orden.numeroTicket,
      ordenId: orden.id,
      createdAt: orden.creadoEn,
      userId: orden.usuarioId,
      userName: `${orden.usuario.nombre} ${orden.usuario.apellido}`,
      paymentMethod: orden.metodoPago.nombre.toLowerCase(),
      items: orden.items.map((item: any) => ({
        id: item.id.toString(),
        orderId: item.ordenId,
        productId: item.productoId,
        productName: item.producto.nombre,
        productImage: item.producto.imagen || '/products/default.jpg',
        quantity: item.cantidad,
        price: Number(item.precioEn),
        originalPrice: Number(item.producto.precio),
        createdAt: item.creadoEn,
      })),
      total: Number(orden.montoTotal),
      estatusId: orden.idEstatus,
      estatusNombre: orden.estatus?.nombre ?? 'Sin estatus',
    }))

    return Response.json({ tickets, count: tickets.length })
  } catch (error) {
    console.error('Error fetching tickets:', error)
    return Response.json(
      { error: 'Error al obtener órdenes', details: (error as any).message },
      { status: 500 }
    )
  }
}
